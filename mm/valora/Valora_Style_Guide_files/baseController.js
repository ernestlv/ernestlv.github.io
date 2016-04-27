module.exports.baseController = function (objectTemplate, _getTemplate) {

    var BaseController = objectTemplate.create('BaseController', {
        errorCount:         {isLocal: true, type: Number, value: 0},

        // Validators
        isPassword: function () {
            //from amorphic-userman: Password must be 6-30 characters with at least one letter and one number
            this.mustMatch(/^.{6,30}$/, 'password_composition');
            this.mustMatch('[0-9]', 'password_composition');
            this.mustMatch('[a-zA-Z]', 'password_composition');
        },
        isName: function () {
            this.mustMatch(/^[a-z ,.'-]+$/i, 'name2');
        },
        isNameSupportComma: function () {
            this.mustNotMatch('[^0-9A-Za-z \'\-\,]', 'name');
        },
        isText: function () {
            this.mustNotMatch("[^\\-0-9A-Za-z !@#$%^&*()_+={}|\]\[\":;'<>?\',.]", 'text');
        },
        isEmail: function () {
            this.mustMatch(/^([\w\.%\+\-]+)@([\w\-]+\.)+([\w]{2,})$/i, 'email'); // node's email validator
        },
        isNumeric: function () {
            this.mustNotMatch('[^0-9]', 'Please enter a number');
        },
        isPercent: function () {
            this.isNumeric();
            if(this.value && (this.value < 1 || this.value > 100)) { throw {message: 'percent'}; }
        },
        isGeoName: function() {
            this.mustMatch(/^([a-zA-Z\u0080-\u024F]+(?:. |-| |'))*[a-zA-Z\u0080-\u024F]*$/, 'Invalid Name');
        },
        isAlphaNumeric: function () {
            this.mustNotMatch('[^0-9A-Za-z]', 'alphanumeric');
        },
        isPhone: function () {
            this.mustNotMatch('[^0-9 \(\)-]', 'phone');
        },
        isSSN: function () {
            this.mustMatch(/^\d{3}-\d{2}-\d{4}$/, 'ssn');
        },
        isSSNOptional: function() {
            if (!this.value) { return true; }
            return this.isSSN();
        },
        isEIN: function () {
            this.mustMatch(/^\d{2}-\d{7}$/, 'ein');
        },
        isEINSSN: function () {
            this.mustMatch(/(^\d{2}-\d{7}$)|(^\d{3}-\d{2}-\d{4}$)/, 'einssn');
        },
        isLast4SSN: function () {
            var regex = '[0-9]{4}';
            if (this.value != null && this.value.length > 0 && (this.value.length != 4  || !(this.value + '').match(regex))) {
                throw {message: 'Incorrect Format'};
            }
            return true;
        },
        isTaxID: function () {
            this.mustMatch('[0-9]{3}-[0-9]{2}-[0-9]{4}', 'taxid') || this.mustMatch('[0-9]{2}-[0-9]{6}', 'taxid');
        },
        isZip5: function () {
            this.mustMatch('[0-9]{5}', 'zip5');
        },
        isZip5OrBlank: function () {
            this.value && this.mustMatch('[0-9]{5}', 'zip5');
        },
        notEmpty: function() {
            var valueEmpty = this.value == null || this.value == undefined || this.value.length == 0;

            if (valueEmpty) { throw {message: 'required'}; }
        },
        isWithin: function(min,max) {
            if(this.value == null || this.value.length == 0) { return; }

            var f = parseFloat(this.value);
            if (isNaN(f)) { throw {message: 'Please enter a number'}; }
            if (this.value < min) { throw {message: 'min', min: min}; }
            if (this.value > max) { throw {message: 'max', max: max}; }
        },
        isWithinCurrency: function(min,max) {
            if (this.value < min) { throw {message: 'min', min: this.formatCurrencyInternal(min)}; }
            if (this.value > max) { throw {message: 'max', max: this.formatCurrencyInternal(max)}; }
        },
        isWithinPercent: function(min,max) {
            if (this.value < min / 100) { throw {message: 'min', min: min + '%'}; }
            if (this.value > max / 100) { throw {message: 'max', max: max + '%'}; }
        },
        isMinLength: function(len) {
            if (this.isEmpty() || this.value.length < len) { throw {message: 'minlength', minlength: len}; }
        },
        isNotEmptyAndMinLength: function(len) {
            if (!this.isEmpty() && this.value.length < len) { throw {message: 'minlength', minlength: len}; }
        },
        isMaxLength: function(len) {
            if (this.isEmpty() || this.value.length > len) { throw {message: 'maxlength', maxlength: len}; }
        },
        isEmpty: function(_value) {
            return this.value == null || this.value.length == 0;
        },
        isDOBWithin: function(min, max) {
            if (this.value == null || this.value.length == '') { return null; }

            var age = this.getAge(this.value);
            if (age > max || age < min) { throw {message: 'invaliddob', min: min, max: max}; }
        },
        isPositiveNumber: function() {
            if(this.value == null || this.value.length == 0) { return; }

            var f = parseFloat(this.value);
            if (isNaN(f)) { throw {message: 'Please enter a number'}; }
            if (this.value < 0) { throw {message: 'Value cannot be negative'}; }
        },

        pastDate: function(_max){
            if (!this.value) { return null; }

            // Has to be a past date
            var date = new Date(this.value),
                now = new Date();
            if (date > new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))) {
                throw {message: 'pastdate'};
            }

            return true;
        },

        validZeroOrVal: function(val) {
            if (!this.value || this.value === val) {
                return true;
            } else {
                throw {message: 'maxpoints', max: val};
            }
        },

        isLegalAdult: function(min) {
            if (this.value == null || this.value.length == '') { return null; }

            var age = this.getAge(this.value);
            if(age < min){ throw {message: 'The owner must be at least 18 years of age'}; }
        },

        getAge: function (date) {
            var thisYear = (new Date()).getFullYear();
            var thisMonth = (new Date()).getMonth();
            var thisDay = (new Date()).getDate();

            var bornYear = date.getFullYear();
            var bornMonth = date.getMonth();
            var bornDay = date.getDate();
            return bornYear == thisYear || bornMonth > thisMonth ||
            ((bornMonth == thisMonth) && bornDay > thisDay) ?
            thisYear - bornYear - 1 : thisYear - bornYear;
        },

        // Parsers - Numbers
        parseCurrency: function() {
            if (!this.value) { return 0; }

            var n = this.value;
            n = n.replace(/k/i, '000');
            n = n.replace(/[^0-9\.\-]/g, '');
            var f = parseFloat(n);
            if (isNaN(f)) { throw {message: 'Please enter a number'}; }
            var result = Math.floor(f * 100 + .5) / 100;
            return result;
        },
        parsePercent: function() {
            if (!this.value) { return 0; }

            var n = this.value;
            n = n.replace(/[^0-9\.\-]/g, '');
            var f = parseFloat(n);
            if (isNaN(f)) { throw {message: 'number'}; }
            var result = f / 100;
            return result;
        },
        parseNumber: function() {
            if (!this.value) { return null; }
            var n = this.value;
            n = n.replace(/k/i, '000');
            n = n.replace(/[^0-9\.\-]/g, '');
            var result = parseFloat(n);
            if (isNaN(result)) { throw {message: 'Please enter a number'}; }
            return result;
        },
        parseInteger: function() {
            if (!this.value) { return null; }
            var n = this.value;
            n = n.replace(/k/i, '000');
            n = n.replace(/[^0-9\.\-]/g, '');
            var result = parseInt(n);
            if (isNaN(result)) { throw {message: 'Please enter a number'}; }
            return result;
        },

        // Parsers - Dates
        parseUTCDate: function() {
            if (this.value == null || this.value.length == '') { return null; }
            if (!this.isDateValid(this.value)) { throw {message: 'date'}; }

            var dtParts = this.value.split('/');
            var parsed = Date.UTC(dtParts[2], (dtParts[0] * 1) - 1, dtParts[1]);
            if (isNaN(parsed)) { throw {message: 'date'}; }

            return new Date(parsed);
        },
        parseUTCShortDate: function() {
            if (this.value == null || this.value.length == '') { return null; }
            if (!this.isShortDateValid(this.value)) { throw {message: 'shortdate'}; }
            // Add a day of 01 and convert to Date
            var tokens = this.value.split('/');
            var parsed = Date.UTC(tokens[1], (tokens[0] * 1) - 1, 1);

            if (isNaN(parsed)) { throw {message: 'shortdate'}; }

            // Has to be a past date
            var date = new Date(parsed),
                now = new Date();
            if(date > new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))){
                throw {message: 'shortdate'};
            }
            return date;
        },
        parseUTCFutureDate: function() {
            // Limit the date to next 100 yrs
            var dt = this.parseUTCDate(),
                now = new Date();
            if(dt < new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))){
                throw {message: 'futuredate'};
            }

            return dt;
        },
        parseDOB: function() {
            return this.parseUTCDate();
        },

        isDateValid: function(date) {
            var dateRegex = /^([0]?[1-9]|[1][0-2])[./-]([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0-9]{4}|[0-9]{2})$/;
            return date.match(dateRegex);
        },

        isShortDateValid: function(date) {
            // mm/yyyy
            var dateRegex = /^([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2})$/;
            return date.match(dateRegex);
        },

        // Parsers - White Space Trimming
        parseRemoveSpace: function(){
            return this.value ? this.value.trim() : this.value;
        },

        // Formatters
        formatText: function(value) {
            value = value || this.value;
            if (value == null || typeof(value) == 'undefined') { return ''; }
            return (value + '').replace(/\<.*\>/g, ' ').trim();
        },
        formatUTCDate: function(value)   {
            value = value || this.value;
            if (!value) { return ''; }
            var date = value;
            return (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        },
        formatDate: function(value) {
            value = value || this.value;
            if (!value) { return ''; }
            return (value.getMonth() + 1) + '/' + value.getDate() + '/' + value.getFullYear();
        },
        formatUTCShortDate: function(value)  {
            value = value || this.value;
            if (!value) { return ''; }
            var date = value;
            // Ignore date
            return (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear();
        },
        formatDateTime: function(value)  {
            value = value || this.value;
            if (!value) { return ''; }
            var date = new Date(value);
            return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' ' +
                date.toTimeString().replace(/ .*/, '');
        },
        formatPercent: function(value) {
            value = value || this.value;
            if (!value) { return ''; }
            return Math.round(value * 100) + '%';
        },
        formatPercentOneDecimal: function(value) {
            value = value || this.value;
            if (!value) { return ''; }
            return Math.round(value * 1000) / 10 + '%';
        },
        formatPercentTwoDecimal: function(value) {
            value = value || this.value;
            if (!value) { return ''; }
            return Math.round(value * 10000) / 100 + '%';
        },
        formatPercentTwoDecimalNoPercentSign: function(value) {
            value = value || this.value;
            if (!value) { return ''; }
            return Math.round(value * 10000) / 100;
        },
        formatPercentNS: function(value) {
            value = value || this.value;
            if (!value) { return ''; }
            return Math.round(value * 100);
        },
        formatDollar: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null || value == 0) { return ''; }
            return this.formatCurrencyZero(prependSymbol || '$', value);
        },
        formatNegativeDollarBalanceSheet: function(value){
            value = value || this.value;
            if (value == null || value == 0 || value == '$0') { return '$0'; }
            return this.formatCurrencyZero('-$', value);
        },
        formatNegativeDollar: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null || value == 0) { return ''; }
            return this.formatCurrencyZero(prependSymbol || '-$', value);
        },
        formatPositiveDollar: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null || value == 0) { return ''; }
            if (value < 0) { return '$0'; }
            return this.formatCurrencyZero(prependSymbol || '$', value);
        },
        formatDollarZero: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null) { return ''; }
            return this.formatCurrencyZero(prependSymbol || '$', value);
        },
        formatDollarRounded: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null || value == 0) { return ''; }
            return this.formatCurrencyZero(prependSymbol || '$', Math.round(value));
        },
        formatDollarDoNotRound: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null || value == 0) { return ''; }
            return this.formatCurrencyInternal(value, prependSymbol || '$', true);
        },
        formatCurrency: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null || value == 0) { return ''; }
            return this.formatCurrencyZero(prependSymbol || '$', value);
        },
        formatCurrencyZero: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null) { return ''; }
            return this.formatCurrencyInternal(value, prependSymbol || '$');
        },
        formatCurrencyCents: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null || value == 0) { return ''; }
            return this.formatCurrencyInternal(value, prependSymbol || '$', true);
        },
        formatCurrencyInternal: function(value, prependSymbol, noround) {
            prependSymbol = prependSymbol || '';
            var n = (noround ? value : Math.round(value)) + '';
            n = n.replace(/\.([0-9])$/, '.$10');
            var p = value < 0 ? ['-', ''] : ['', ''];
            return p[0] + prependSymbol + this.addCommas(n.replace(/-/, '')) + p[1];
        },
        formatCurrencyFree: function(prependSymbol, value) {
            value = value || this.value;
            if (value == null || value==0) { return 'FREE'; }
            if (value < 0) { return 'TBD'; }
            return this.formatCurrencyZero(prependSymbol, value);
        },
        formatPercentForNow: function(value) {
            value = value || this.value;
            if (value == null || value==0) { return ''; }
            return (this.value*100);
        },
        formatRank: function(value) {
            value = value || this.value;
            if (value == null) { return ''; }
            var lastDigit = (value + '').substr(-1);
            switch (lastDigit) {
                case '1': return value + 'st';
                case '2': return value + 'nd';
                case '3': return value + 'rd';
                default: return value + 'th';
            }
        },
        formatMillionBillion: function (value) {
            value = value || this.value;
            if (value == null) { return ''; }
            value = value.replace(/[,\$ ]/, '') * 1;
            if (value >= 1000000000) {
                return this.formatCurrencyInternal(Math.round((value + 500000000) / 10000000) / 100, '$', true) + 'B';
            } else if (value >= 1000000) {
                return this.formatCurrencyInternal(Math.round((value + 500000) / 10000) / 100, '$', true) + 'M';
            } else {
                return this.formatCurrencyInternal(value, '$');
            }
        },
        format100K: function (value) {
            value = value || this.value;
            if (value == null) { return ''; }
            value = (value + '').replace(/[,\$ ]/, '') * 1;
            if (value >= 1000000) {
                return this.formatSingleDecimalInternal(Math.round(value / 100000) / 10, '$') + 'm';
            } else {
                return this.formatSingleDecimalInternal(Math.round(value / 100) / 10, '$') + 'k';
            }
        },
        formatSingleDecimalInternal: function(value, prependSymbol) {
            prependSymbol = (prependSymbol || prependSymbol == '' ? prependSymbol : '$') + '';
            var n = Math.round(value * 10) / 10 + '';
            var p = value < 0 ? ['(', ')'] : ['', ''];
            return p[0] + prependSymbol + this.addCommas(n.replace(/-/, '')) + p[1];
        },
        formatNumber: function (value) {
            value = value || this.value;
            if (value == null) { return ''; }
            return this.addCommas(value);
        },
        parseTelephone: function() {
            if (!this.value) { return null; }
            var str = this.value.replace(/[^0-9]/g, '');
            if (!str) { return null; }
            if (str.length > 10) {
                str = str.replace(/^1/, ''); //if phone number starts with 1 (U.S. country code), remove it.
            }
            var num = str.substr(0, 10);
            var ext = str.length > 10 ? ' ' + str.substr(10) : '';
            if (num.length < 10) { throw {message: 'phone'}; }
            if (ext.length > 11) { throw {message: 'phoneMax'}; }
            return num + ext;
        },
        parseCapitalizeName: function(){
            if (this.value == null || typeof(this.value) == 'undefined') { return ''; }
            return this.value.trim().replace(/^(.)/, function($1){return $1.toUpperCase();});
        },
        formatTelephone: function (value) {
            value = value || this.value;
            if (!value) { return ''; }
            var parts = value.split(' ');
            if (parts[0].length < 10) { return value; }
            return '(' + parts[0].substr(0,3) + ') ' + parts[0].substr(3,3) + '-' + parts[0].substr(6, 4) +
                (parts[1] && parts[1].length > 0 ? ' x' + parts[1] : '');
        },
        parseGeoName: function () {
            return this.parseText();
        },
        // Not really used when you parse with parseSSN
        formatSSN: function (value) {
            value = value || this.value;
            if (!value || value.length < 9) { return ''; }
            return value.substr(0,3) + '-' + value.substr(3, 2) + '-' + value.substr(5,4);
        },
        formatEIN: function (value) {
            value = value || this.value;
            if (!value || value.length < 9) { return ''; }
            return value.substr(0,2) + '-' + value.substr(2,7);
        },
        parseEINSSN: function() {
            if (!this.value) { return null; }

            var isSSN = this.value.substr(3,1) == '-';
            var str = this.value.replace(/[^0-9]/g, '');
            if (!str) { return null; }
            if (str.length < 9) { throw {message: 'ssnein'}; }

            isSSN = this.value.indexOf('-') < 0 ? true: false; // if no '-', format as SSN
            return isSSN ? this.formatSSN(str) : this.formatEIN(str);
        },
        parseSSN: function() {
            if (!this.value) { return null; }
            var str = this.value.replace(/[^0-9]/g, '');
            if (!str) { return null; }
            if (str.length < 9) { throw {message: 'ssn'}; }
            return this.formatSSN(str);
        },
        parseEIN: function() {
            if (!this.value) { return null; }
            var str = this.value.replace(/[^0-9]/g, '');
            if (!str) { return null; }
            if (str.length < 9) { throw {message: 'ssn'}; }
            return this.formatEIN(str);
        },

        parseText: function() {
            if (!this.value) { return ''; }
            return this.value.trim();
        },

        parseLocalDate: function() {
            if (this.value == null || this.value.length == '') { return null; }
            var parsed = Date.parse(this.value);
            if (isNaN(parsed)) { throw {message: 'date'}; }
            return new Date(parsed);
        },

        formatLocalDate: function(value) {
            value = value || this.value;
            if (!value) { return ''; }
            var date = value;
            return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
        },

        clientInit: function () {
            if (typeof(__ver) != 'undefined') { this.setIncludeURLSuffix('?ver=' + __ver); }

            this.attr('.currency', {format: this.formatDollar});
            this.attr('.spin', {min: '{prop.min}', max: '{prop.max}'});
            this.rule('text', {maxlength: '{prop.length}', validate: this.isText, format: this.formatText, parse: this.parseText});
            this.rule('numeric', {parse: this.parseNumber, format: this.formatText});
            this.rule('numericPositive', {parse: this.parseNumber, format: this.formatText, validate: this.isPositiveNumber});
            this.rule('name', {maxlength: '{prop.length}', validate: this.isName, parse: this.parseCapitalizeName});
            this.rule('nameSupportComma', {maxlength: '{prop.length}', validate: this.isNameSupportComma});
            this.rule('email', {parse: this.parseRemoveSpace, validate: this.isEmail});
            this.rule('currency', {format:this.formatDollar, parse: this.parseCurrency});
            this.rule('currencyZero', {format:this.formatDollarZero, parse: this.parseCurrency});
            this.rule('currencycents', {format:this.formatCurrencyCents, parse: this.parseCurrency});
            this.rule('localdate', {format: this.formatLocalDate, parse: this.parseLocalDate});
            this.rule('date', {format: this.formatUTCDate, parse: this.parseUTCDate});
            this.rule('shortdate', {format: this.formatUTCShortDate, parse: this.parseUTCShortDate});
            this.rule('futuredate', {format: this.formatUTCDate, parse: this.parseUTCFutureDate});
            this.rule('datetime', {format: this.formatDateTime, parse: this.parseUTCDate});
            this.rule('DOB', {format: this.formatUTCDate, parse: this.parseDOB});
            this.rule('SSN', {validate: this.isSSN});
            this.rule('EIN', {validate: this.isEIN});
            this.rule('EINSSN', {validate: this.isEINSSN});
            this.rule('taxid', {validate: this.isTaxID});
            this.rule('phone', {validate: this.isPhone});
            this.rule('required', {validate: this.notEmpty});
            this.rule('percent', {validate: this.isPercent, format: this.formatPercent});
            this.rule('zip5', {validate: this.isZip5});
            this.rule('telephone', {parse: this.parseTelephone, format: this.formatTelephone});
            this.rule('numericInt', {parse: this.parseInteger, format: this.formatText});
            this.rule('numericstring', {validate: this.isNumeric, format: this.formatText});
            this.rule('geoName', {maxlength: '{prop.length}', validate: this.isGeoName, parse: this.parseGeoName});
        },

        // Utility
        addCommas: function (nStr)  {
            nStr += '';
            var x = nStr.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        },
        mustNotMatch: function(regex, error) {
            if (this.value != null && this.value.length > 0 && (this.value + '').match(regex)) {
                throw error ? {message: error} : ' Incorrect Format';
            }
        },
        mustMatch: function(regex, error) {
            if (this.value != null && this.value.length > 0 && !(this.value + '').match(regex)) {
                throw error ? {message: error} : ' Incorrect Format';
            }
        },
        serverLog: function (text) {
            console.log(text);
            if (this.errorCount < 3) {
                this.xhr('/log', 'text/plain', text, this, function () {});
            }
        },
        getModalLeft: function (dialogWidth) {
            var element = window;
            var attr = 'inner';
            if (!('innerWidth' in window )) {
                attr = 'client';
                element = document.documentElement || document.body;
            }
            return Math.round(element[attr + 'Width'] / 2 - dialogWidth / 2);
        },
        getModalTop: function (dialogHeight) {
            var element = window;
            var attr = 'inner';
            if (!('innerHeight' in window )) {
                attr = 'client';
                element = document.documentElement || document.body;
            }
            return Math.round(element[attr + 'Height'] / 2 - dialogHeight / 2);
        },
        show: function(target, speed) {
            $(target).slideDown(speed || 1000);
        },
        hide: function(target, speed) {
            $(target).slideUp(speed || 1000);
        },
        slideIn: function(target, _speed) {
            $(target).animate({left: '0px'});
        },
        slideOut: function(target, _speed) {
            $(target).animate({left: '893px'});
        },
        slideBottom: function(target, pixels, _speed) {
            $(target).animate({bottom: pixels + 'px'});
        },
        fadeIn: function(target, speed) {
            $(target).fadeIn(speed || 1000);
        },
        fadeOut: function(target, speed) {
            $(target).fadeOut(speed || 1000);
        },
        sendCoverageToAnalytics: function(level){
            var trackerName = ga.getAll()[0].get('name');
            ga(trackerName + '.send', 'event', { eventCategory: 'Select Quote', eventAction: 'Click', eventLabel: level + '_panel'});

            // Fire GA event. The above event may no longer be necessary?
            this.analyticsController.addCustomData('BucketChoice', level);
            if (level === 'SILVER') {
                this.analyticsController.addCustomEvent('BucketCheck', 'CheckedSilver');
            } else if (level === 'PLATINUM') {
                this.analyticsController.addCustomEvent('BucketCheck', 'CheckedPlatinum');
            }
        },
        sendCoverageDetailsToAnalytics: function(level){
            var trackerName = ga.getAll()[0].get('name');
            ga(trackerName + '.send', 'event', { eventCategory: 'Select Quote', eventAction: 'Click', eventLabel: level + '_details'});
        },
        gaEmailSignup: function(location){
            var trackerName = ga.getAll()[0].get('name');
            ga(trackerName + '.send', 'event', {
                eventCategory: location == 'Modal' ? 'Sitewide' : 'Homepage',
                eventAction: 'Click',
                eventLabel: 'Stay Updated ' + location
            });
        },
        fireNeedsGA: function(){
            var trackerName = ga.getAll()[0].get('name');
            ga(trackerName + '.send', 'event', {
                eventCategory: 'Calculator',
                eventAction: 'Visit',
                eventLabel: 'Calculator Page Visits'
            });
        },


        /**
         * Client is to expire, either reset or let infrastructure handle it
         *
         * @return {Boolean} - true if reset handled within controller, false to destroy/create controller
         */
        clientExpire: function () {
            return false;
        },


        /**
         * Send an XMLHTTPREQUEST for get or put
         * @param url
         * @param contentType
         * @param data - will do a put if not null
         * @param callbackobj
         * @param callbackfn
         */
        xhr: function (url, contentType, data, callbackobj, callbackfn, errcallbackobj, errcallbackfn) {
            var request = this.getxhr();
            request.open(data ? 'PUT' : 'GET', url, true);
            request.setRequestHeader('Content-type', contentType);
            var self = this;
            request.onreadystatechange = function () {
                if (request.readyState != 4) { return; }
                var status, statusText;
                try {
                    status = request.status;
                    statusText = request.statusText;
                } catch (e) {
                    status = 666;
                    statusText = 'unknown';
                }

                if (status == 200) {
                    self.errorCount = 0;
                    callbackfn.call(callbackobj, request);
                } else {
                    ++self.errorCount;
                    var error = 'Server request failed\nurl: ' + url + '\nstatus: ' +  statusText + '\nmessage:' + request.responseText;
                    if (errcallbackfn) {
                        errcallbackfn.call(errcallbackobj, request, error);
                    } else {
                        if (self.errorCount < 3) { alert(error); }
                    }
                }
            };
            request.send(data);
        },

        getxhr: function() {
            try {
                return new XMLHttpRequest();
            } catch (e) {
                try {
                    return new ActiveXObject('Msxml2.XMLHTTP');
                } catch (e2) {
                    try {
                        return new ActiveXObject('Microsoft.XMLHTTP');
                    } catch (e3) {
                        throw 'No support for XMLHTTP';
                    }
                }
            }
        },

        loadScript: function(src, then) {
            var head= document.getElementsByTagName('head')[0];
            var script= document.createElement('script');
            var thenFunction = then;
            var self = this;
            script.type= 'text/javascript';
            script.src= src;
            if (then) {
                if(document.all) {
                    script.onreadystatechange = function() {
                        if (script.readyState == 'complete') {
                            script.onreadystatechange = '';
                        } else if (script.readyState == 'loaded') {
                            script.onreadystatechange = '';
                        }

                        thenFunction.call(self);
                    };
                }
                else {
                    script.onload = function() {
                        thenFunction.call(self);
                    };
                }
            }
            head.appendChild(script);
        }
    });

    return {
        BaseController: BaseController
    };
};
