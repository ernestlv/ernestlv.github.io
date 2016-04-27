module.exports.Utils = function (objectTemplate, _getTemplate) {

    if (typeof(require) != 'undefined') {
        _ = require('underscore');
        Q = require('q');
        var nconf = require('nconf');
        var exec = require('child_process').exec;
        var xml2js = require('xml2js');
        var qhttp = require('q-io/http');
        var uuid = require('node-uuid');
        var os = require('os');
        var crypto = require('crypto');
        var moment = require('moment-timezone');
        var fs = require('fs');
        var Path = require('path');
        var _templatePath = __dirname + '/../../workflow/templates/';
    }

    function WrappedError(sourceError, message) {
        this.sourceError = sourceError;
        this.message = message;
    }

    function xml2jsOptions(options) {
        var opts = {attrkey: '_', charkey: '_value', explicitCharkey: false, explicitArray: false};
        return _.extend(opts, options);
    }

    var Xml = {
        fetch: function (paths, fileNameParts) {
            paths = Utils.array(paths).concat().reverse();
            var path, fnParts;

            return fetchFromPath();

            function fetchFromPath(_e) {
                path = paths.pop();
                if (!path) {
                    throw new Error('File not found');
                }
                fnParts = fileNameParts.concat('');
                return fetchXml().catch(fetchFromPath);
            }
            function fetchXml(_e) {
                fnParts.pop();
                if (fnParts.length == 0) {
                    throw new Error('File not found');
                }
                var fileName = fnParts.join('_'),
                    filePath = path + fileName + '.xml';

                Utils.logDebug('Fetching XML from', filePath);

                return Q.ninvoke(fs, 'readFile', filePath, {encoding: 'utf-8'})
                    .then(parseXml)
                    .catch(fetchXml);

                function parseXml(xmlStr) {
                    Utils.logDebug('Fetched XML from', filePath);
                    return Xml.parse(xmlStr);
                }
            }
        },

        /**
         * @return Promise
         */
        parse: function (xml, options, type) {
            options = xml2jsOptions(options);
            options.tagNameProcessors = [xml2js.processors.stripPrefix];

            return Q.ninvoke(new xml2js.Parser(options), 'parseString', xml)
                .then(function (doc) {
                    return Q(type ? new type(doc) : doc);
                });
        },

        build: function(doc, options) {
            options = xml2jsOptions(options);
            return new xml2js.Builder(options).buildObject(doc);
        },

        /**
         * Creates a new element node for the provided name, attributes and value,
         * and appends it to the provided parent element node.
         * @return newNode
         */
        appendChild: function(parentElement, name, attrs, value) {
            return Xml.appendChildElement(parentElement, name, createElement(attrs, value));

            function createElement(attrs, value) {
                var e = {};
                if (attrs) {
                    e._ = _.each(attrs, function(_v, k) {
                        attrs[k] = (attrs[k] == null ? '' : attrs[k]);
                    });
                }
                if (value != null) {
                    if (e._) {
                        e._value = value;
                    } else {
                        e = value;
                    }
                }
                return e;
            }
        },

        appendChildElement: function(parentElement, childName, childElement) {
            var oldElement = parentElement[childName],
                newElement = childElement;

            if (oldElement === undefined) {
                parentElement[childName] = newElement;
            } else if (oldElement instanceof Array) {
                oldElement.push(newElement);
            } else {
                parentElement[childName] = [oldElement, newElement];
            }
            return newElement;
        },

        /**
         * Creates a XML builder object that keeps track of a stack of the nodes that are added.
         * A request to 'appendChild' on the builder creates and appends the new node to the last
         * node on the node stack. A request to 'up' on the builder pops the last node from the
         * node stack. The root node can be obtained from the 'doc' property of the builder.
         */
        builder: function() {
            var parentNodes = [{}];
            return {
                doc: parentNodes[0],

                appendChild: function(name, attrs, value) {
                    parentNodes.push(Xml.appendChild(parentNodes[parentNodes.length - 1], name, attrs, value));
                    return this;
                },

                appendChildElement: function(name, element) {
                    Xml.appendChildElement(parentNodes[parentNodes.length - 1], name, element);
                    return this;
                },

                up: function(count) {
                    do {
                        parentNodes.pop();
                    } while(--count > 0);
                    return this;
                }
            };
        },

        value: function(val) {
            return val instanceof Object ? val._value : val;
        },

        setValue: function(parent, name, value) {
            if (parent && parent[name]) {
                if (parent[name]._) {
                    parent[name]._value = value;
                } else {
                    parent[name] = value;
                }
            }
        }
    };

    var _currentTimeOffset = 0;

    function toMilliseconds(unit) {
        unit = unit ? unit.toLowerCase() : 'ms';
        return unit.match(/^secs?$/) ? 1000 : unit.match(/^mins?$/) ? 60000 :
            unit.match(/^hrs?$/) ? 3600000 : unit.match(/^days?$/) ? 86400000 : 1;
    }

    function logArgs(level, args) {
        var isoDt = Utils.dateToIsoObj(new Date());
        var argsArr = Array.prototype.slice.call(args);
        argsArr.splice(0, 0, '[', isoDt.date, isoDt.time, ']', level);
        return argsArr;
    }

    var _listeningToShutdownSignals = false,
        _shutdownHandlers = [];

    var Utils = {
        extend: function(obj) {
            Array.prototype.slice.call(arguments, 1).forEach(function(source) {
                if (source) {
                    for (var prop in source) {
                        var descriptor = Object.getOwnPropertyDescriptor(source, prop);
                        Object.defineProperty(obj, prop, descriptor);
                    }
                }
            });
            return obj;
        },

        asyncMap: function(arr, concurrency, callback) {
            var arrGrp = [];
            while (arr.length > 0) {
                arrGrp.push(arr.splice(0, concurrency));
            }
            return arrGrp.reduce(function(p, arr) {
                return p.then(function(resArr) {
                    return Q.all(arr.map(callback)).then(function(res) {
                        return resArr.concat(res);
                    });
                });
            }, Q([]));
        },

        listenToShutdownSignals: function(shutdownHandler) {
            if (shutdownHandler) {
                _shutdownHandlers.push(shutdownHandler);
            }
            if (_listeningToShutdownSignals) {
                return;
            }
            _listeningToShutdownSignals = true;
            ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM'].forEach(function(signal) {
                process.on(signal, function() {
                    Utils.logInfo('Shutdown triggered by', signal);

                    Q.all(_shutdownHandlers.map(function(handler) {
                        return handler();
                    })).then(function() {
                        setTimeout(function() { // Allow logs to complete
                            process.exit(1);
                        }, 1000);
                    }).done();
                });
            });
        },

        getGeolocation: function(zip) {
            var url = _geoLocationUrl + zip;
            console.log('Zip code resolution --> ' + url);
            return qhttp.request(url).then(function(response) {
                return response.body.read().then(function (bodyStream) {
                    var body = JSON.parse(bodyStream.toString('UTF-8'));

                    if (body.status === 'OK') {
                        var address = body.results[0].formatted_address, // city, statecode zip, USA OR city, zip, Puerto Rico
                            tokens = address.split(','),
                            city = tokens[0].trim();

                        console.log('Address from Google lookup - ' + address);
                        if(tokens[2] && tokens[2].trim().match(/USA|Puerto Rico/)){
                            var stateToks = tokens[1].trim().split(' '),
                                stateCode = stateToks.length  == 1 ? 'PR' : stateToks[0];

                            var lat = body.results[0].geometry.location.lat,
                                lng = body.results[0].geometry.location.lng;
                            return {city: city, stateCode: stateCode, lat: lat, lng: lng};
                        }
                    }
                    throw new Error('Unable to retrieve geolocation for ' + zip);
                });
            });
        },

        getTimezone: function(latitude, longitude) {
            var secs = new Date().getTime() / 1000;
            var url = _geoTimezoneUrl + (latitude + ',' + longitude) + '&timestamp=' + secs; // + '&key=AIzaSyDxbdzc25T6_lTU7EUC2mhppy_ykwtTT2k';
            return qhttp.request(url).then(function(resp) {
                return resp.body.read().then(function(dataBuf) {
                    var data = JSON.parse(dataBuf.toString('utf-8'));
                    if (data.status === 'OK') {
                        return data.timeZoneId;
                    }
                    throw new Error('Unable to retrieve timezone for (' + latitude + ', ' + longitude + ')');
                });
            });
        },

        now: function() {
            return _currentTimeOffset ? new Date(Date.now() + _currentTimeOffset) : new Date();
        },

        milliseconds: function(value, unit) {
            return value * toMilliseconds(unit);
        },

        getPreviousDate: function (date) {
            date.setDate(date.getDate() - 1);
            return date;
        },

        getYesterday: function () {
            return this.getPreviousDate(this.now());
        },

        /**
         * Offsets the current time, as specified by Utils.now(), by the specified offset value.
         * The acceptable values for unit are: secs, mins, hrs, and days.
         */
        offsetCurrentTime: function (offset, unit) {
            return Utils.offsetTime(Utils.now(), offset, unit);
        },

        offsetTime: function (date, offset, unit) {
            date = new Date(date); // in case the date is passed as a string
            return new Date(date.getTime() + (offset * toMilliseconds(unit)));
        },

        timeDiff: function(dt1, dt2, unit) {
            return (dt1 - dt2) / toMilliseconds(unit);
        },

        offsetDate: function(date, offset, unit) {
            unit = unit ? unit.toLowerCase() : '';
            date = new Date(date); // in case the date is passed as a string
            var newDate = new Date(date);
            if (unit.match(/^days?$/)) {
                newDate.setUTCDate(date.getUTCDate() + offset);
            } else if (unit.match(/^months?$/)) {
                newDate.setUTCMonth(date.getUTCMonth() + offset);
            } else if (unit.match(/^years?$/)) {
                newDate.setUTCFullYear(date.getUTCFullYear() + offset);
            }
            return newDate;
        },

        dateToIsoObj: function(date) {
            if (date) {
                var dt = date.toISOString().split('T');
                return {date: dt[0], time: dt[1]};
            }
            return {date: null, time: null};
        },

        isoToDate: function(dtStr, timeStr) {
            if (!dtStr) {
                return null;
            }
            if (timeStr) {
                dtStr += 'T' + timeStr;
            }
            return new Date(dtStr);
        },

        mdyToDate: function(dtStr) {
            if (!dtStr) {
                return null;
            }
            var dtParts = dtStr.split(/[\/\-]/);
            return new Date(Date.UTC(dtParts[2], (dtParts[0] * 1) - 1, dtParts[1]));
        },

        ymdToDate: function(dtStr) {
            if (!dtStr) {
                return null;
            }
            var dtParts = dtStr.split(/[\/\-]/);
            return new Date(Date.UTC(dtParts[0], (dtParts[1] * 1) - 1, dtParts[2]));
        },

        tzDate: function(date, timezone) {
            return {
                dt: date ? (timezone ? moment(date).tz(timezone) : moment(date)) : date,
                toDate: function() {
                    return this.dt ? this.dt.toDate() : null;
                },
                getDate: function() {
                    return this.dt ? this.dt.date() : null;
                },
                timezoneOffset: function() {
                    return this.dt ? this.dt.utcOffset() : null;
                },
                format: function(fmt) {
                    return this.dt ? this.dt.format(fmt) : '';
                },
                toMdy: function() {
                    return this.format('L');
                },
                toMy: function(separator) {
                    separator = separator || '/';
                    return this.format('MM' + separator + 'YYYY');
                },
                toMdyHm: function() {
                    return this.format('L LT');
                },
                toYmd: function(separator) {
                    separator = separator || '-';
                    return this.format('YYYY' + separator + 'MM' + separator + 'DD');
                }
            };
        },

        dateToMdy: function(date) {
            return date && date.dt ? date.toMdy() : Utils.tzDate(date).toMdy();
        },

        dateToMY: function(date) {
            return date && date.dt ? date.toMy() : Utils.tzDate(date).toMy();
        },

        dateToMdyHm: function(date) {
            return date && date.dt ? date.toMdyHm() : Utils.tzDate(date).toMdyHm();
        },

        dateToYmd: function(date) {
            return date && date.dt ? date.toYmd() : Utils.tzDate(date).toYmd();
        },

        yearsBetween: function(fromDate, toDate) {
            if (fromDate > toDate) {
                var dt = fromDate;
                fromDate = toDate;
                toDate = dt;
            }
            var toYear = toDate.getUTCFullYear(), toMonth = toDate.getUTCMonth(), toDay = toDate.getUTCDate(),
                fromYear = fromDate.getUTCFullYear(), fromMonth = fromDate.getUTCMonth(), fromDay = fromDate.getUTCDate();

            return (fromYear == toYear || fromMonth < toMonth || (fromMonth == toMonth && fromDay <= toDay)) ?
            toYear - fromYear : toYear - fromYear - 1;
        },

        timeBetween: function(fromDate, toDate, unit) {
            return Math.floor((toDate - fromDate) / toMilliseconds(unit));
        },

        daysBetween: function(fromDate, toDate) {
            return Utils.timeBetween(fromDate, toDate, 'days');
        },

        getCurrentMidYearDate: function(anniversaryDate, asOfDate) {
            asOfDate = asOfDate || Utils.now();
            var lastAnnDt = new Date(Date.UTC(asOfDate.getUTCFullYear(), anniversaryDate.getUTCMonth(), anniversaryDate.getUTCDate())),
                nextAnnDt = lastAnnDt;

            if (lastAnnDt > asOfDate) {
                lastAnnDt = Utils.offsetDate(lastAnnDt, -1, 'year');
            } else {
                nextAnnDt = Utils.offsetDate(nextAnnDt, 1, 'year');
            }

            return Utils.offsetDate(lastAnnDt, Math.round(Utils.daysBetween(lastAnnDt, nextAnnDt) / 2), 'days');
        },

        ipAddress: function() {
            var ifaces = os.networkInterfaces();
            var ip = _.findWhere(_.flatten(_.values(ifaces)), {family: 'IPv4', internal: false});
            return ip ? ip.address : 'Unknown';
        },

        /**
         * Finds and returns the range value corresponding to the limit >= input value.
         * <p>
         * Data is two dimensional array represented in a one dimensional array, so
         * for every element in i, where i starts from 0, there is a corresponding range value
         * element in i + 1.
         * <p>
         * For example, the following table
         * <pre><code>
         * Range Upper Limit   Range Value
         * -----------------   -----------
         * 1                   20
         * 2                   15
         * 3                   10
         * 5                   5
         * </code></pre>
         * must be provided as [1, 20, 2, 15, 3, 10, 5, 5].
         * <p>
         * The data must be provided in ascending order of the range limit values.
         */
        findInRange: function(data, value, inclusive) {
            for (var i = 0; i < data.length; i += 2) {
                if (value < data[i] || (inclusive && value == data[i])) {
                    return data[i + 1];
                }
            }
            return null;
        },

        generateUuid: function() {
            return uuid.v1();
        },

        array: function(arr) {
            return arr == null ? [] : (arr instanceof Array ? arr : [arr]);
        },

        merge: function(firstObj, secondObj) {
            for (var key in secondObj) {
                if (secondObj.hasOwnProperty(key)) {
                    firstObj[key] = secondObj[key];
                }
            }
            return firstObj;
        },

        transformTemplate: function(templateName, data, ctx, options) {
            options = options || {};
            var templatePath = options.templatePath || _templatePath;
            return Q.ninvoke(fs, 'readFile', templatePath + templateName, {encoding: 'utf-8'})
                .then(buildTemplate);

            function buildTemplate(templateStr) {
                var bodyOnly = options.bodyOnly || false;
                var templStr = bodyOnly ? templateStr.match(/<body>([\s\S]*)<\/body>/im)[1] : templateStr;
                ctx = ctx || {};
                ctx.data = data;
                return _.template(templStr, {variable: 'ctx'})(ctx);
            }
        },

        group: function(arr, groupSize, callback) {
            var counter = 0, grp = [];
            Utils.array(arr).forEach(function(e) {
                if (counter++ < groupSize) {
                    grp.push(e);
                } else {
                    callback(grp);
                    grp = [e];
                    counter = 1;
                }
            });
            callback(grp);
        },

        toCamelCase: function() {
            var str = [].map.call(arguments, function (str) {
                return str.trim();
            }).filter(function(str) {
                return str.length;
            }).join('-');

            if (!str.length) { return ''; }
            if (str.length === 1) { return str; }

            if (!(/[_.\- ]+/).test(str)) {
                if (str === str.toUpperCase()) { return str.toLowerCase(); }
                if (str[0] !== str[0].toLowerCase()) { return str[0].toLowerCase() + str.slice(1); }
                return str;
            }

            return str
                .replace(/^[_.\- ]+/, '')
                .toLowerCase()
                .replace(/[_.\- ]+(\w|$)/g, function (_m, p1) {
                    return p1.toUpperCase();
                });
        },

        toCapitalizedWords: function(str) {
            if (! str) { return ''; }

            // Separate words by spaces or newlines.
            var words = str.split(/[\s\n]+/)
                .filter(function(word) {
                    return word.length > 0;
                })
                .map(function (word) {
                    return word.charAt(0).toUpperCase()
                        + word.slice(1).toLowerCase();
                });

            return words.join(' ');
        },

        formatPhoneNumber: function(numberString) {
            if (! numberString) { return ''; }

            var len = numberString.length;
            if (len === 10) {
                return format10DigitPhoneNumber(numberString);
            }
            else if (len === 11) {
                // Country code prefix
                return '+' + numberString.charAt(0) + ' '
                    + format10DigitPhoneNumber(numberString.slice(1));
            }
            else {
                return '';
            }

            function format10DigitPhoneNumber(numberString) {
                return '(' + numberString.slice(0,3) + ') '
                    + numberString.slice(3,6) + '-'
                    + numberString.slice(6);
            }
        },

        toCapitalCamelCase: function() {
            var camelCased = this.toCamelCase.apply(this, arguments);
            return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
        },

        formatNumber: function(value, precision) {
            if(value == null) {
                return '';
            }
            var x = value.toString().split('.');
            precision = precision || (x[1] && x[1].length);
            var x1 = x[0], x2 = '';
            if (precision > 0) {
                x[1] = x[1] || '';
                _(precision - x[1].length).times(function() {
                    x[1] += '0';
                });
                x2 = '.' + x[1];
            }
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        },

        formatCurrency: function(value) {
            if(value == null) {
                return '';
            }
            var roundedValue = this.round(value, 2);
            return '$' + this.formatNumber(roundedValue, 2);
        },

        round: function(num, precision) {
            var factor = Math.pow(10, precision);
            return Math.round(num * factor) / factor;
        },

        encrypt: function(text, algorithm, key) {
            var cipher = crypto.createCipher(algorithm, key);
            var encText = cipher.update(text, 'utf8', 'base64');
            return encText + cipher.final('base64');
        },

        decrypt: function(encText, algorithm, key) {
            var cipher = crypto.createDecipher(algorithm, key);
            var text = cipher.update(encText, 'base64', 'utf8');
            return text + cipher.final('utf8');
        },

        visitFiles: function(path, callback) {
            try {
                fs.statSync(path).isDirectory() ? visitDir() : callback(path, true);
            } catch (e) {
                // Ignore
                Utils.logDebug('Visiting', path, 'threw error', e);
            }

            function visitDir() {
                fs.readdirSync(path).forEach(function(file) {
                    Utils.visitFiles(path + '/' + file, callback);
                });
                callback(path, false);
            }
        },

        deleteDir: function(path) {
            path = Path.join(path);
            if (os.platform() == 'win32') {
                return Utils.forkExec('rd /s /q ' + path);
            } else {
                return Utils.forkExec('rm -rf ' + path);
            }
        },

        forkExec: function(cmd, opts, callback) {
            var qDef = Q.defer();

            exec(cmd, opts || {}, function (error, stdout, stderr) {
                console.log('---------------');
                console.log('>', cmd);
                console.log('>', opts || '');
                if (callback) {
                    callback(qDef, error, stdout, stderr);
                } else if (error) {
                    console.error(error);
                    qDef.reject(error);
                } else {
                    console.log(stdout, stderr);
                    qDef.resolve({stdout: stdout, stderr: stderr});
                }
            });

            return qDef.promise;
        },

        toString: function(error) {
            return error ? (error instanceof WrappedError ? formatError(error.sourceError, error.message) : formatError(error)) : null;

            function formatError(error, message) {
                message = message || '';
                return message + '\n' + (error.stack ? error.stack : error.toString());
            }
        },

        logError: function() {
            var lastPos = arguments.length - 1;
            if (arguments[lastPos] instanceof Error) {
                arguments[lastPos] = Utils.toString(arguments[lastPos]);
            }
            console.error.apply(console, logArgs('[Error]', arguments));
        },

        endTimer: function(startTime, unit) {
            var div = unit && unit.match(/^secs?$/i) ? 1e9 : 1e6;
            var time = process.hrtime(startTime);
            return (time[0] * 1e9 + time[1]) / div;
        },

        /**
         * @param arr Array of numbers
         * @return Number, or null when some unexpected error happens
         */
        average: function(arr) {
            var count = 0;
            var sum = (arr = arr || []).reduce(function(sum, n) {
                n = n || n == 0 ? n * 1 : undefined;
                if (isNaN(n)) {
                    return sum;
                }
                count++;
                return sum + n;
            }, 0);
            return count > 0 ? sum / count : null;
        },

        /**
         * Encode/decode a String/Buffer to base64.
         * @param {String|Buffer} data - The data.
         * @param {Boolean} encode - data encoded if true, decoded if false.
         * @returns {String} the data in the desired format.
         */
        base64: function(data, encode) {
            if (encode) {
                return (new Buffer(data)).toString('base64');
            } else {
                return (new Buffer(data, 'base64')).toString('ascii');
            }
        }
    };

    var _geoLocationUrl = undefined;
    var _geoTimezoneUrl = undefined;

    (function initGeoConfig(){ // this should move out to it's own lib if not used on client
        if(objectTemplate.config !== undefined){
            if(_geoLocationUrl === undefined){
                var localtionUrl = nconf.get('geoLocationUrl');
                _geoLocationUrl = localtionUrl !== undefined ? localtionUrl : 'https://maps.googleapis.com/maps/api/geocode/json?sensor=true&components=postal_code:';
                console.log('Setting GEO location url: ' + _geoLocationUrl);
            }
            if(_geoTimezoneUrl === undefined){
                var timezoneUrl = nconf.get('geoTimezoneUrl');
                _geoTimezoneUrl = timezoneUrl !== undefined ? timezoneUrl : 'https://maps.googleapis.com/maps/api/timezone/json?location=';
                console.log('Setting GEO timezone url: ' + _geoTimezoneUrl);
            }
        }
    })();

    function getRunMode() {
        return objectTemplate.config.nconf.get('runMode') || '';
    }
    function isRunMode(mode, subMode, subModes) {
        var regex, modeSpec = '';

        if (subMode) {
            regex = new RegExp('^\\s*' + mode + '\\s*:([\\w-]*\\s+)*' + subMode + '(\\s+[\\w-]*)*$', 'i');

            if (subModes && subModes.match(/^\s*!/)) {
                modeSpec = mode + ': ' + subModes.replace(/^\s*!\s*/, '');

            } else if (subModes && subModes.match(/^\s*\+/)) {
                modeSpec = getRunMode() + ' ' + subModes.replace(/^\s*\+\s*/, '');

            } else {
                modeSpec = getRunMode();
            }
        } else {
            regex = new RegExp('^\\s*' + mode, 'i');
            modeSpec = getRunMode() || '';
        }

        return modeSpec.match(regex);
    }
    function isLogLevel(level) {
        var levels = objectTemplate.config.nconf.get('logLevels');
        return !!levels.match(new RegExp(level, 'i'));
    }
    Utils.isTestMode = function(testMode, testModes) {
        return isRunMode('test', testMode, testModes);
    };
    Utils.isPilotMode = function(pilotMode) {
        return isRunMode('pilot', pilotMode);
    };
    Utils.getEnv = function() {
        return objectTemplate.config.nconf.get('environment').trim();
    };
    Utils.isCiEnv = function() {
        return Utils.getEnv().match(/^ci(\s*:\s*(.*))?$/i);
    };
    Utils.isUatEnv = function() {
        return Utils.getEnv().match(/^uat(\s*:\s*(.*))?$/i);
    };
    Utils.isProdEnv = function() {
        return Utils.getEnv().match(/^production(\s*:\s*(.*))?$/i);
    };
    Utils.setCurrentTimeOffset = function(offset, unit) {
        Utils.resetCurrentTime();
        Utils.addCurrentTimeOffset(offset, unit);
    };
    Utils.addCurrentTimeOffset = function(offset, unit) {
        if (Utils.isTestMode() && offset) {
            _currentTimeOffset += Utils.milliseconds(offset, unit);
        }
    };
    Utils.resetCurrentTime = function() {
        _currentTimeOffset = 0;
    };
    Utils.logDebug = function() {
        if (nconf.get('isTesting')) { return; }
        if (isLogLevel('debug')) {
            console.info.apply(console, logArgs('[Debug]', arguments));
        }
    };
    Utils.logInfo = function() {
        if (isLogLevel('info')) {
            console.info.apply(console, logArgs('[Info]', arguments));
        }
    };
    Utils.executionCtx = function() {
        return {
            _execCtx: {type: Object, isLocal: true},

            get execCtx() {
                return this._execCtx || (this._execCtx = {});
            },

            get txnCtx() {
                return this.execCtx.txnCtx || (this.execCtx.txnCtx = {});
            },

            get txn() {
                return this.txnCtx.txn || this.beginTxn().txn;
            },

            beginTxn: function(signalCustomer) {
                this.execCtx.txnCtx = {
                    txn: objectTemplate.begin()
                };
                if (signalCustomer) {
                    this.execCtx.txnCtx.txn.touchTop = true;
                }
                return this.execCtx.txnCtx;
            },

            endTxn: function() {
                var txn = this.txn;
                this.execCtx.txnCtx = null;
                return objectTemplate.end(txn);
            },

            mergeTxn: function(txn) {
                this.txn.dirtyObjects = _.extend(this.txn.dirtyObjects, txn.dirtyObjects);
                this.txn.savedObjects = _.extend(this.txn.savedObjects, txn.savedObjects);
                this.txn.touchObjects = _.extend(this.txn.touchObjects, txn.touchObjects);
            },

            setDirtyTxn: function(obj, onlyIfChanged, cascade) {
                obj = obj || this;
                return obj.setDirty(this.txn, onlyIfChanged, cascade);
            },

            addDelTxnCallback: function(callback) {
                var callbacks = this.txnCtx.delTxnCallbacks || (this.txnCtx.delTxnCallbacks = []);
                callbacks.push(callback);

                if (callbacks.length == 1) {
                    this.txn.preSave = function(txn) {
                        return Q.all(callbacks.map(function(cb) {
                            return cb(txn);
                        }));
                    }.bind(this);
                }
            }
        };
    };

    /**
     * Encode a String/Buffer to base64.
     * @param {String|Buffer} data - The data to be encoded.
     * @returns {String} the data in base64.
     */
    Utils.toBase64 = function(data) {
        return Utils.base64(data, true);
    };

    /**
     * Decode a String/Buffer from base64.
     * @param {String|Buffer} data - The data to be decoded.
     * @returns {String} the data as a decoded string.
     */
    Utils.fromBase64 = function(data) {
        return Utils.base64(data, false);
    };

    return {
        Xml: Xml,
        Utils: Utils,
        WrappedError: WrappedError
    };
};
