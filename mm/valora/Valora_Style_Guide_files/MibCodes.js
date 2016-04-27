module.exports.MibCodes = function (objectTemplate, getTemplate) {

    // Non-Semotus modules
    if (typeof(require) != 'undefined') {
        _ = require('underscore');
    }

    getTemplate('./Utils.js');

    var MibCodeComponent = objectTemplate.create('MibCodeComponent', {});
    var MibCodes = objectTemplate.create('MibCodes', {});
    var MibCode = objectTemplate.create('MibCode', {});

    return {
        MibCodeComponent: MibCodeComponent,
        MibCodes: MibCodes,
        MibCode: MibCode
    };
};

module.exports.MibCodes_mixins = function (objectTemplate, requires) {
    var Utils = requires.Utils.Utils;
    var Policy = requires.Policy.Policy;

    var MibCodeComponent = requires.MibCodes.MibCodeComponent;
    var MibCode = requires.MibCodes.MibCode;
    var MibCodes = requires.MibCodes.MibCodes;
    MibCodes.CATEGORIES = ['Standard', 'Height&Weight', 'ECG'];

    MibCodeComponent.REGEXES = {
        'empty': '^$',
        'impairment_code': '^[A-Za-z0-9#?!]{3}$',
        'degree': '^[A-Za-z0-9#?!]$',
        'source': '^[A-Za-z0-9#?!]$',
        'time': '^[A-Za-z0-9#?!]$',
        'site_code': '^[A-Za-z0-9#?!]{0,3}$',
        'height_ft': '^[1-9]$',
        'height_in': '^[0-9]$|^1[0-1]$',
        'weight_lb': '^[1-9][0-9]{1,2}$',
        'weight_loss_lb': '^[0-9]$|^[1-9][0-9]{1,2}$',
        'ecg': '^[A-Za-z0-9#?! ,-]{0,20}$'
    };

    MibCodeComponent.mixin({
        index: {type: Number},
        value: {type: String},
        regex: {type: String},
        init: function (index, value, category) {
            this.index = index;
            this.regex = this.getRegexByIndex(index, category);
            this.value = value || '';
        },
        getRegexByIndex: function (index, category) {
            var regexes = MibCodeComponent.REGEXES;
            var categories = MibCodes.CATEGORIES;

            switch (index) {
                case 0:
                    if (category === categories[1]) {
                        return regexes['height_ft'];
                    }
                    return regexes['empty'];
                case 1:
                    if (category === categories[1]) {
                        return regexes['height_in'];
                    }
                    return regexes['empty'];
                case 2:
                    if (category === categories[1]) {
                        return regexes['weight_lb'];
                    }
                    return regexes['impairment_code'];
                case 3:
                    return regexes['degree'];
                case 4:
                    return regexes['source'];
                case 5:
                    return regexes['time'];
                case 6:
                    if (category === categories[1]) {
                        return regexes['weight_loss_lb'];
                    } else if (category === categories[2]) {
                        return regexes['ecg'];
                    }
                    return regexes['site_code'];
                default:
                    return '';
            }


        },
        match: function () {
            return this.value.match(this.regex);
        }
    });

    MibCode.mixin({
        code: {type: String},
        codeRegex: {
            isLocal: true,
            type: String,
            value: '^([A-Za-z0-9#?!]{3}|([1-9])\\.([0-9]|1[0-1])\\.([1-9][0-9]{1,2}))([A-Za-z0-9#?!])([A-Za-z0-9#?!])([A-Za-z0-9#?!])(\\(([A-Za-z0-9#?! ,-]{1,20})\\))?$'
        },
        description: {type: String},
        versionDate: {type: Date},
        category: {type: String},
        source: {type: String},
        sourceValues: {isLocal: true, type: Array, value: ['MIB', 'Reported']},
        from: {type: String},
        fromValues: {isLocal: true, type: Array, value: ['Application', 'Labs', 'Manuel', 'Rx']},
        resultCode: {type: String},
        resultCodeValues: {
            isLocal: true, type: Array, value: ['-1', '0', '1', '2', '5', '10', '100']
        },
        policy: {type: Policy},
        _component0: {type: String},
        _component1: {type: String},
        _component2: {type: String},
        _component3: {type: String},
        _component4: {type: String},
        _component5: {type: String},
        _component6: {type: String},
        get components() {
            return [
                new MibCodeComponent(0, this._component0, this.category),
                new MibCodeComponent(1, this._component1, this.category),
                new MibCodeComponent(2, this._component2, this.category),
                new MibCodeComponent(3, this._component3, this.category),
                new MibCodeComponent(4, this._component4, this.category),
                new MibCodeComponent(5, this._component5, this.category),
                new MibCodeComponent(6, this._component6, this.category)
            ];
        },
        init: function (policy, category, _0, _1, _2, _3, _4, _5, _6) {
            this.policy = policy;
            this.category = category || MibCodes.CATEGORIES[0];
            this._component0 = _0;
            this._component1 = _1;
            this._component2 = _2;
            this._component3 = _3;
            this._component4 = _4;
            this._component5 = _5;
            this._component6 = _6;
            this.getCode();
            this.resultCode = '0';
            this.versionDate = new Date();
        },
        getCode: function () {
            var components = this.components,
                maxIndex = components.length - 1,
                i,
                str = '';
            for (i = 0; i < maxIndex; i++) {
                str += components[i].value;
                if ((i === 0 || i === 1) && str !== '') {
                    str += '.';
                }
            }
            str += (components[maxIndex].value ? '(' + components[maxIndex].value + ')' : '');
            return this.code = str;
        },
        setComponent: function (index, value) {
            this["_component" + index] = value;
            return this.getCode();
        },
        isMatch: function () {
            var components = this.components,
                i;
            for (i = 0; i < components.length - 1; i++) {
                if (!components[i].match()) {
                    return false;
                }
            }
            return true;
        },
        isStandard: function () {
            return this.category === MibCodes.CATEGORIES[0];
        },
        isHeightAndWeight: function () {
            return this.category === MibCodes.CATEGORIES[1];
        },
        isECG: function () {
            return this.category === MibCodes.CATEGORIES[2];
        },
        setAsStandard: function () {
            return this.category = MibCodes.CATEGORIES[0];
        },
        setAsHeightAndWeight: function () {
            return this.category = MibCodes.CATEGORIES[1];
        },
        setAsECG: function () {
            return this.category = MibCodes.CATEGORIES[2];
        },
        getHeightAndWeight: function () {
            var feet = this.components[0];
            var inches = this.components[1];
            var weight = this.components[2];
            if (feet && inches && weight) {
                return {
                    height: {value: feet * 12 + inches, unit: 'inch'},
                    weight: {value: weight * 1, unit: 'lb'}
                }
            }
            return null;
        },
        isValid: function () {
            return this.resultCode === '1';
        }
    });

    MibCodes.mixin({
        codes: {type: Array, of: MibCode, value: []},
        init: function (codes) {
            this.codes = codes;
        },
        add: function (mibCode) {
            this.codes.push(mibCode);
        },
        update: function (mibCode) {
            mibCode.getCode();
            var id = mibCode._id;
            var mibCodes = this.codes;
            var index = _.findIndex(mibCodes, function (code) {
                return code._id === id;
            });
            if (index === -1) {
                this.add(mibCode);
            } else {
                mibCodes[index] = mibCode;
            }
        },
        delete: function (mibCode) {
            var id = mibCode._id;
            this.deleteById(id);

        },
        deleteById: function (id) {
            this.codes = _.reject(this.codes, function (code) {
                return code._id === id;
            });
        },
        filteredBySource: function (source) {
            return _.filter(this.codes, function (mibCode) {
                return mibCode.source === source;
            });
        },
        retrieveReportedCodes: function () {
            return this.filteredBySource('Reported');
        },
        retrieveReportedCodesOrdered: function () {
            return _.sortBy(this.retrieveReportedCodes(), 'code');
        },
        hasReportedCodes: function () {
            var mibCodes = this.codes;
            var index = _.findIndex(mibCodes, function (code) {
                return code.source === 'Reported';
            });
            return index !== -1;
        }
    });
};