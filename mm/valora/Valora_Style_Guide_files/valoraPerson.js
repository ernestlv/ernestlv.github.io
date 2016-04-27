/*global moment*/

module.exports.valoraPerson = function (_objectTemplate, getTemplate) {

    var Person = getTemplate('./customer/Person.js').Person;
    var Assumptions = getTemplate('static/Assumptions.js').Assumptions;

    var ValoraPerson = Person.extend('ValoraPerson', {
        init: function (customer) {
            if(customer) {
                Person.call(this, customer);
            }
        },

        residencyContinuousValues: {isLocal: true, type: Array, value: ['Yes', 'No']},
        residencyContinuousDescriptions: { isLocal: true, type: Object, value: { 'Yes': 'Yes','No': 'No'}},

        residencyYearsTrigger: function () {

            var years = +this.residencyYears;
            var isValid = !Number.isNaN(years);

            if(!isValid) {
                throw {message: 'number'};
            }
        },

        residencyStatusValues: {isLocal: true, type: Array, value: ['citizen', 'residentAlien', 'none']},
        residencyStatusDescriptions: {
            isLocal: true,
            type: Object,
            value: {
                'citizen': 'You are a U.S. citizen and you reside in the U.S.',
                'residentAlien': 'You are a non-U.S. citizen and you reside in the U.S. as a Permanent Resident (Green Card Holder)',
                'none': 'Other'
            }
        },

        citizenshipCountryValues: {isLocal: true, type: Object, value: Assumptions.countryValues},

        residencyAssetValues: {isLocal: true, type: Array, value: ['Yes', 'No']},
        residencyAssetDescriptions: {isLocal: true, type: Object, value: { 'Yes': 'Yes', 'No': 'No'}},

        assetValueTrigger: function () {
            var value = +this.assetValue;
            var isValid = !Number.isNaN(value);

            if(!isValid) {
                throw {message: 'number'};
            }
        },

        residencyPlansValues: {isLocal: true, type: Array, value: ['Yes', 'No']},
        residencyPlansDescriptions: {isLocal: true, type: Object, value: { 'Yes': 'Yes','No': 'No'}},

        hasVisaValues: {isLocal: true, type: Array, value: ['Yes', 'No']},
        hasVisaDescriptions: { isLocal: true, type: Object, value: { 'Yes': 'Yes','No': 'No'}},
        visaNumberTrigger: function () {
            if(this.visaNumber === '') {
                throw {message: 'required'};
            }
        },
        visaExpirationDateTrigger: function () {
            var today = moment();

            var expirationDate = moment(new Date(this.visaExpirationDate));
            var isValid = expirationDate.isValid() && expirationDate.isAfter(today);

            if(!isValid) {
                throw {message: 'futuredate'};
            }

        },

        dateResidentLeavingTrigger: function () {
            var today = moment();

            var dateLeaving = moment(new Date(this.dateResidentLeaving));
            var isValid = dateLeaving.isValid() && dateLeaving.isAfter(today);

            if(!isValid) {
                throw {message: 'futuredate'};
            }
        },

        TINTrigger: function () {
            var isValid = this.TIN.match(/^\d{3}-?\d{2}-?\d{4}$/);

            if(!isValid) {
                throw {message: 'taxid'};
            }
        },

        SSNTrigger: function () {
            this.noSSN = !(this.SSN) ? true : false;
        },

        noSSNTrigger: function() {
            if( this.noSSN ) { this.SSN = null; }
        }

    });

    return {
        ValoraPerson: ValoraPerson
    };
};
