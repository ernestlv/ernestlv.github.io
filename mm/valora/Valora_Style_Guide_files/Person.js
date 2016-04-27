module.exports.Person = function (objectTemplate, getTemplate) {

var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
var Utils = getTemplate('./Utils.js').Utils;

// Non-Semotus modules
if (typeof(require) != "undefined") {
    _ = require('underscore');
}

/*
* A party that has something to be split between them such that
* that their percentage ownership adds up to 100
*/
var SplitParty = objectTemplate.create("SplitParty",
{
    ratio:          {type: Number, rule: ["required", "numeric"], value: null},
    ratioChanged:   {isLocal: true, type: Boolean, value: false},
    partyProperty:  {type: String},
    ratioTrigger:   function () {
        // Avoid running triggers during final validation
        if(this.policy.isValidating){
           return;
        }

        // Depend on container to maintain reference to collection
        this.ratioChanged = true;
        this.ratio = Math.min(this.ratio, 100);
        this.ratio = Math.max(this.ratio, 0);
        if (this.policy[this.partyProperty]) {
            this.setRatios(this.policy[this.partyProperty]);
        }
    },
    init: function (policy, partyProperty) {
        this.policy = policy;
        this.partyProperty = partyProperty;
    },
    setRatios: function (parties) {
        var variableCount = 0;
        var fixedPercent = 0;
        var evenPercent = 0;

        var beneficiaryType = parties[0].partyProperty;
        var childrenSplitProps = {
            primaryBeneficiary: 'beneficiaryChildrenEvenSplit',
            contingentBeneficiary: 'contingentBeneficiaryChildrenEvenSplit'
        };

        var beneficiaryChildrenEvenSplit = this.policy[childrenSplitProps[beneficiaryType]];

        if (beneficiaryChildrenEvenSplit) {
            evenPercent = Utils.round((1 / parties.length) * 100, 2);
            for (var ix = 0; ix < parties.length; ix++) {
                parties[ix].ratio = evenPercent;
            }
            return;
        }

        // See how many slots not changed by user
        for (var ix = 0; ix < parties.length; ++ix) {
            if (parties[ix].ratioChanged) {
                fixedPercent += parties[ix].ratio * 1;
            } else {
                variableCount++
            }
        }

        // If we are stuck between a rock and a hard place reset all but current
        if (!variableCount || fixedPercent > 100) {
            for (var ix = 0; ix < parties.length; ++ix) {
                if(parties[ix]  != this || parties.length == 1) {
                    parties[ix].ratioChanged = false;
                }
            }
        }


        // See how much of the percent is fixed because user touched it
        var fixedPercent = 0;
        variableCount = 0;
        for (var ix = 0; ix < parties.length; ++ix) {
            if (parties[ix].ratioChanged) {
                fixedPercent += parties[ix].ratio * 1;
            } else {
                variableCount++
            }
        }

        // Split up the remainder and distribute evenly (round to two decimal places)
        // var split = Math.floor((100 - Math.min(100, fixedPercent)) / variableCount);
        var split = (100 - Math.min(100, fixedPercent)) / variableCount;
        split = Math.floor(split*100)/100;
        for (var ix = 0; ix < parties.length; ++ix) {
            if (!parties[ix].ratioChanged) {
                parties[ix].ratio = split;
            }
        }

    }
});

var Beneficiary = SplitParty.extend("Beneficiary",
{
    init: function (policy, partyProperty) {
        SplitParty.call(this, policy, partyProperty);
    },
    type:               {type: String},  // Used by Persistor to classify Beneficaries as primary or continguent
	relationship:       {type: String, value: null, rule: "required"},
    relationshipValues: {isLocal: true, type: Object, value: {
        16: 'Brothers of Insured', 24: 'Business Agreement', 12: 'Children born of marriage.', 13: 'Children',
        11: 'Children of marriage', 27: 'Children of Primary Beneficiary', 3: 'Complex', 4: 'Creditors', 10: 'Domestic partner',
        2:  'Estate', 26: 'Estate of Primary Beneficiary', 30: 'Ex-Spouse of Insured', 5: 'Fractions', 6: 'Last Will and Testament',
        15: 'Lawful children of insured', 14: 'Legally adopted children of insured', 1: 'Named Individual', 2147483647: 'Other',
        20: 'Parents of insured', 28: 'Parents of Primary Beneficiary', 22: 'PVT CSC Child of Primary Beneficiary',
        23: 'PVT CSC Parents of Primary Beneficiary', 21: 'PVT CSC Primary Beneficiary', 18: 'Siblings of Insured',
        17: 'Sisters of Insured', 8: 'Split Dollar', 9: 'Spouse', 25: 'Spouse and Children', 7: 'Trust Agreement',
        19: 'Uniform Gifts to Minors', 0: 'Unknown'}
    },
    getRelationshipDescription: function() {
        return this.relationshipValues[this.relationship];
    },
    /*
	relationshipValues: {isLocal: true, type: Array, value: {29: 'All natural children of the insured',
        16: 'Brothers of Insured', 24: 'Business Agreement', 12: 'Children born of marriage.', 13: 'Children of Insured',
        11: 'Children of marriage', 27: 'Children of Primary Beneficiary', 3: 'Complex', 4: 'Creditors', 10: 'Domestic partner',
        2: 'Estate', 26: 'Estate of Primary Beneficiary', 30: 'Ex-Spouse of Insured', 5: 'Fractions', 6: 'Last Will and Testament',
        15: 'Lawful children of insured', 14: 'Legally adopted children of insured', 1: 'Named', 2147483647: 'Other',
        20: 'Parents of insured', 28: 'Parents of Primary Beneficiary', 22: 'PVT CSC Child of Primary Beneficiary',
        23: 'PVT CSC Parents of Primary Beneficiary', 21: 'PVT CSC Primary Beneficiary', 18: 'Siblings of Insured',
        17: 'Sisters of Insured', 8: 'Split Dollar', 9: 'Spouse', 25: 'Spouse and Children', 7: 'Trust Agreement',
        19: 'Uniform Gifts to Minors', 0: 'Unknown'}
    },
    */
	dob:            {isObsolete: true, type: Date, rule: ["date", "required"], value: null},

    fullName:          {type: String, length: 40, rule: ["name", "required"], value: null},
    fullNameDependsOn: function () {return this.type == 'trust' || this.type == 'trustwill'},

    // obsolete
	copyBeneficiary: function(beneficary) {
		this.SSN = beneficary.SSN ;
		this.gender = beneficary.gender ;
		this.relationship = beneficary.relationship ;
		this.dob = beneficary.dob ;
		this.ratio = beneficary.ratio ;
		this.fullName = beneficary.fullName;
	}

    /*taxId:              {type: String, rule: ["EINSSN"]},
    taxIdDependsOn:     function () {return this.type == 'trust' || this.type == 'trustwill'},
    getTaxIdType:       function () {return this.getTaxId().substr(2,1) == '-' ? 'EIN' : 'SSN'},
    getTaxId:           function () {return this.type == 'trust' || this.type == 'trustwill' ? this.taxId :
                                            this.type == 'individual' ? this.person.SSN : ""},*/

    /*formed:             {type: Date, rule: ['date', 'required']},
    formedDependsOn:    function () {return this.type == 'trust' || this.type == 'trustwill'},
    getDate:            function () {return this.type == 'trust' || this.type == 'trustwill' ? this.formed :
                                     this.type == 'individual' ? this.person.dob : null},

    trustType:          {type: String, rule: ["required"]},
    trustTypeValues:       {isLocal: true, type: Array, value: ['revocable', 'irrevocable']},
    trustTypeDescriptions: {isLocal: true, type: Object,
        value: {'revocable': "Revocable", 'irrevocable':"Irrevocable"}}*/

    /*type:       {type: String, value: 'individual'},
    typeValues: {isLocal: true, type: Object,
        value: {individual: 'Individual', trustwill:'Trust in will', estate:'Your estate', trust:'Trust'}},*/
});

var UniversalBeneficiary = objectTemplate.create("UniversalBeneficiary",
{
    init: function (beneficiary, type) {
        this.beneficiary = beneficiary;
        this.type = type;

    },
    beneficiary:    {type: Beneficiary},
    type:           {type: String},

    getBeneficiaryType: {type: String, body: function() {
        if (!this.beneficiary.policy) { return; }
        return this.type == 'primary'
            ? (this.beneficiary.policy.beneficiaryType == 13
                ? this.beneficiary.policy.beneficiaryChildrenType
                : this.beneficiary.policy.beneficiaryType)
            : (this.beneficiary.policy.contingentBeneficiaryType == 13
                ? this.beneficiary.policy.contingentBeneficiaryChildrenType
                : this.beneficiary.policy.contingentBeneficiaryType);
    }},

    getNameOfOtherParent: function() {
        return this.getBeneficiaryType()  == 12 ?
            (this.type == 'primary'
                ? this.beneficiary.policy.beneficiaryOtherParentName
                : this.beneficiary.policy.contingentBeneficiaryOtherParentName)
            : "";
    },

    getBeneficiaryRelationship: {type: String, body: function() {
        var beneType = this.getBeneficiaryType(),
            spouseType = '9';
        if (beneType === spouseType) {
            if (this.beneficiary.policy.ownerType == "partnerfiance"){
                return "Partner/Fiance"
            } else {
                return "Spouse"
            }
        } else {
             return this.beneficiary.relationship;
        }
    }}
});
    
    
var Address = objectTemplate.create("Address",
{
    init:           function (customer) {
        if (customer) {
            this.customer = customer;
            this.customer.addresses.push(this);
        }
    },
    bucket:         {type: String},  // Used temporarily to ensure master list in customer is accurate
    type:           {type: String, value: '1'}, // Residence, hardcoded, not asked in the UI
    typeValues:     {type: Object, value: {'1': 'Home', '2': 'Business', '17': 'Mailing'}, isLocal: true},
	street:         {type: String, rule: ["text", "required"], length: 35, value: null},
	line1:          {type: String, rule: ["text"], length: 35, value: null},
	line2:          {type: String, rule: ["text"], length: 35, value: null}, // not used at present
	city:           {type: String, rule: ["geoName"], length: 40, value: null},
 	zip:            {type: String, rule: ["zip5", "required"], length: 5, value: null},
	state:          {type: String, value: null},
	stateValues:    {isLocal: true, type: Object, value: Assumptions.stateValues},
    timezone:       {type: String},
    latitude:       {type: Number},
    longitude:      {type: Number},

    setLocation: function (location) {
        this.state = location.stateCode;
        this.city = location.city;
        this.latitude = location.lat;
        this.longitude = location.lng;
        this.timezone = location.timezone;
    },

    getOneLineValue: function () {
        return (this.street ? this.street  + ", " : "") + (this.line1 ? this.line1 + ", " : "") + (this.city ? this.city  : "") + (this.state ? ", " + this.state  : "") + " " + (this.zip ? this.zip  : "");
    },
    getLine1: function () {
        return (this.street ? this.street + ", "   : "") + (this.line1 ? this.line1 + ", " : "");
    },
    getLine2: function () {
        return (this.city ? this.city  : "") + (this.state ? ", " + this.state  : "") + " " + (this.zip ? this.zip  : "");
    },
    getListValue:   function () {
        return (this.street ? this.street  + ", " : "") + (this.city ? this.city  : "") + ", " + (this.state ? this.state  : "");
    },
    getChooserDisplay: function () {
        if (!(this.street && this.city && this.state && this.zip))
            return "";
        return this.getListValue()
    },
    lookupState:    function(stateVal){
        for(var stateCode in Assumptions.stateValues){
            if(Assumptions.stateValues.hasOwnProperty(stateCode)){
                if(Assumptions.stateValues[stateCode] === stateVal){
                    return stateCode;
                }
            }
        }
        return null;
    },
    isHome: function() {
        return this.type == '1';
    },
    reset: function(){
        this.line1 = this.line2 = this.city = this.state = this.zip = null;
    },
    retrieveTimezone: function() {
        if (this.timezone != null) return Q(this.timezone);

        var locP;

        if (this.latitude == null || this.longitude == null) {
            locP = Utils.getGeolocation(this.zip).then(setGeolocation.bind(this));
        } else {
            locP = Q([this.latitude, this.longitude]);
        }

        return locP.spread(Utils.getTimezone).then(setTimezone.bind(this));

        function setGeolocation(geoloc) {
            this.city = geoloc.city;
            this.state = geoloc.stateCode;
            this.latitude = geoloc.lat;
            this.longitude = geoloc.lng;
            return [this.latitude, this.longitude];
        }
        function setTimezone(timezone) {
            return this.timezone = timezone;
        }
    }
});

var PersonQuery = objectTemplate.create("PersonQuery", {
    firstName:  {type: String, value: "", length: 40, rule: ["name", "required"]},
    middleName: {type: String, value: "", length: 40, rule: "name"},
    getMiddleInitial: function () {return this.middleName.substr(0, 1);},
    lastName:	{type: String, value: "", length: 40, rule: ["name", "required"]},
    email:      {type: String, rule: ["email"]},
    getFullName: function () {
        return this.firstName + (this.middleName ? " " + this.middleName : "") + " " + this.lastName;
    },
    SSN:        {type: String, toClient: false, rule: ["SSN"], value: null},
    dob:        {type: Date}
});

var Person = objectTemplate.create("Person",   // WILL BECOME PARTY
{
    init:           function (customer) {
        if (customer) {
            this.customer = customer;
            this.customer.persons.push(this);
        }
    },
    bucket:         {type: String},  // Used temporarily to ensure master list in customer is accurate

	firstName:  {type: String, value: "", length: 40, rule: ["name", "required"]},
	middleName: {type: String, value: "", length: 40, rule: "name"},
    getMiddleInitial: function () {return this.middleName.substr(0, 1);},
	lastName:	{type: String, value: "", length: 40, rule: ["name", "required"]},
    email:      {type: String, rule: ["email", "required"]},
    getPerStirpesFullName: function(){
        if ( this.customer.applicationPolicy.beneficiaryPerStirpes ){
            var name = this.firstName + (this.middleName ? " " + this.middleName : "") + " " + this.lastName;
            return name.length > 3 ? name + ", per stirpes" : "";
        } else {
            return this.firstName + (this.middleName ? " " + this.middleName : "") + " " + this.lastName;
        }
    },
    getPerStirpesContingentFullName: function(){
        if ( this.customer.applicationPolicy.contingentBeneficiaryPerStirpes ){
            var name = this.firstName + (this.middleName ? " " + this.middleName : "") + " " + this.lastName;
            return name.length > 3 ? name + ", per stirpes" : "";
        } else {
            return this.firstName + (this.middleName ? " " + this.middleName : "") + " " + this.lastName;
        }
    },
    getFullName: function () {
        return this.firstName + (this.middleName ? " " + this.middleName : "") + " " + this.lastName;
    },
    getInitials: function(){
        return (this.firstName && this.lastName) ?
            this.firstName.charAt(0).toUpperCase() + this.lastName.charAt(0).toUpperCase() : "";
    },
    getIdExpires: function(){
        return this.idExpires;
    },
    getChooserDisplay: function () {
        if (!(this.firstName && this.lastName))
            return "";
        return this.getFullName()
    },

    gender:         {type: String, rule: "required", value: null},
	genderValues:   {isLocal: true, type: Array, value: ["1", "2"]},
    genderDescriptions: {isLocal: true, type: Object, value: {
        "1": "Male",
        "2": "Female"
    }},
    genderTrigger: function () {
        if (this.isPrimaryApplicant() && this.customer.applicationPolicy) {
            this.customer.applicationPolicy.waiverPremium = null;
        }
    },
    isMale: function() {
        return this.gender == '1';
    },

    SSN:            {type: String, rule: ["SSN"], value: null},
    SSNGetPart1:    function () {return this.SSN ? this.SSN.substr(0, 3) : ""},
    SSNGetPart2:    function () {return this.SSN ? this.SSN.substr(4, 2) : ""},
    SSNGetPart3:    function () {return this.SSN ? this.SSN.substr(7, 4) : ""},

    getTaxIdType:       function () {
        // Only Entity templates have tax ids
        // Person templates have SSNs
        if(this.SSN) {
            return 'SSN';
        } else if(this.EIN) {
            return 'EIN';
        } else {
            return 'Unknown';
        }
    },

    age: {type: Number, rule: ["required", "numericInt"], min: 18, max: 70, validate: "isWithin(18, 70)", value: null},
    ageTrigger: function () {
        /*this.dob = new Date();
        this.dob.setFullYear((new Date()).getFullYear() - this.age);*/
        this.customer.capitalNeeds.ageTrigger(this);
    },
    isPrimaryApplicant: function(){
        return (this.customer && this.customer.primaryCustomer.person === this);
    },

	dob:            {type: Date, rule: ["DOB", "required"], value: null},
    dobGetYear:     function(){return this.dob ? this.dob.getFullYear() : ""},
    dobGetMonth:    function(){return this.dob ? this.dob.getMonth() + 1 : ""},
    dobGetMonthPlusSlash:    function(){return this.dob ? this.dob.getMonth() + 1 + "/" : ""},
    dobGetDay:      function(){return this.dob ? this.dob.getDate() : ""},
    dobGetDayPlusSlash:      function(){return this.dob ? this.dob.getDate() + "/" : ""},
    dobTrigger:     function () {
        this.age = this.getAge();
        if(this.isPrimaryApplicant()) {
            if(this.customer.applicationPolicy)
                this.customer.applicationPolicy.waiverPremium = null;
        }
    },
    getAge:         function () {
        return this.dob ? Utils.yearsBetween(this.dob, Utils.now()) : null;
    },
    getInsuranceAge: function (asOfDate) {
        asOfDate = asOfDate || Utils.now();
        var insDate = this.getInsuranceAgeDate(asOfDate);
        return Utils.yearsBetween(this.dob, asOfDate) + (insDate <= asOfDate ? 1 : 0);
    },
    getInsuranceAgeDate: function(asOfDate) {
        asOfDate = asOfDate || Utils.now();
        return Utils.getCurrentMidYearDate(this.dob, asOfDate);
    },
    getDOB: function(){
        return Utils.dateToMdy(this.dob);
    },
    birthCountry:   {type: String, rule: ["required", "text"], value: 'US'},
    birthCountryValues:        {isLocal: true, type: Object, value: Assumptions.countryValues},

    birthState:     {type: String, rule: ["required", "text"]},
    birthStateValues:      {isLocal: true, type: Object, value: Assumptions.stateValues},

    getPlaceOfBirth: function () {
        return (this.birthCountry == 'US') ? this.birthStateValues[this.birthState] + ", United States"
                                           : this.birthCountryValues[this.birthCountry];
    },

    hasDriversLicense: {type: Boolean, value: true},
    hasDriversLicenseValues: {type: Array, isLocal: true, value: ['true', 'false']},
    hasDriversLicenseDescriptions: {type: Object, isLocal: true, value: {'true': 'Yes', 'false': 'No'}},
    hasDriversLicenseTrigger: function () {
        if (this.hasDriversLicense === false) {
            this.idNumber = this.idState = this.idExpires = null;
        }
    },


    idType:         {type: String, value: 'drivers'},
    idTypeValues:   {isLocal: true, type: Array, value: ['drivers', 'passport', 'stateID', 'other']},
    idTypeDescriptions:   {isLocal: true, type: Object, value: {
        drivers: 'US Drivers License', passport: 'Passport', stateID: 'State ID', other: 'Other'}},

    idNumber:        {type: String, rule:['text']},

    idOtherType:            {type: String},
    idOtherTypeDependsOn:   function () {return this.idType == 'other'},

    idCountry:              {type: String, value: null, rule: "required"},
    idCountryValues:        {isLocal: true, type: Object, value: Assumptions.countryValues},
    idCountryDependsOn:     function () {return this.idType != 'drivers'},

    idState:            {type: String, value: null},
    idStateValues:      {isLocal: true, type: Object, value: Assumptions.stateValues},
    idStateDependsOn:   function () {return this.idType == 'drivers'},

    idExpires:              {type: Date, value: null, rule: ["futuredate"]},
    idExpiresGetYear:       function(){return this.idExpires ? this.idExpires.getFullYear() : ""},
    idExpiresGetMonth:      function(){return this.idExpires ? this.idExpires.getMonth() + 1 : ""},
    idExpiresGetDay:        function(){return this.idExpires ? this.idExpires.getDate() : ""},

    idIssuedDate:               {type: Date, rule:["required"]},
    idIssuedDateGetYear:        function(){return this.idIssuedDateDate ? this.idIssuedDate.getFullYear() : ""},
    idIssuedDateGetMonth:       function(){return this.idIssuedDateDate ? this.idIssuedDate.getMonth() + 1 : ""},
    idIssuedDateGetDay:         function(){return this.idIssuedDateDate ? this.idIssuedDate.getDate() : ""},

    getDriversLicenseNumber:    function () {return this.idType == 'drivers' ? this.idNumber : ""},
    getDriversLicenseState:     function () {return this.idType == 'drivers' ? this.idState : ""},
    getDriversLicenseExpMonth:  function () {return this.idType == 'drivers' ? this.idExpiresGetMonth() : ""},
    getDriversLicenseExpDay:    function () {return this.idType == 'drivers' ? this.idExpiresGetDay() : ""},
    getDriversLicenseExpYear:   function () {return this.idType == 'drivers' ? this.idExpiresGetYear() : ""},

    getAlternateIDNumber:    function () {return this.idType != 'drivers' ? this.idNumber : ""},
    getAlternateIDState:     function () {return this.idType != 'drivers' ? this.idState : ""},
    getAlternateIDCountry:   function () {return this.idType != 'drivers' ? this.idState : ""},
    getAlternateIDExpMonth:  function () {return this.idType != 'drivers' ? this.idExpiresGetMonth() : ""},
    getAlternateIDExpDay:    function () {return this.idType != 'drivers' ? this.idExpiresGetDay() : ""},
    getAlternateIDExpYear:   function () {return this.idType != 'drivers' ? this.idExpiresGetYear() : ""},

    residencyStatus: {type: String, value: null, rule: "required"},
    residencyStatusValues: {isLocal: true, type: Array, value: ['citizen', 'none']}, //TODO to add 'residentAlien'
    residencyStatusDescriptions: {isLocal: true, type: Object, value: {'citizen': 'US Citizen & Resident', 'none': 'Other'}},
    isResidentAlien: function(){
        return this.residencyStatus === 'residentAlien'; //TODO currently for valora
    },

    getResidencyOtherForDS: function(){
        return this.residencyStatus != 'citizen' ? 'Other' : '';
    },

    /*
    residencyStatusValues: {isLocal: true, type: Object,
        value: {'citizen':'Citizen', 'nrcitizen':'Non-resident citizen','i90': "Resident alien",
            'none':"non-resident alien"}},
    */

    visaType:           {type: String, rule:["required", "text"]},
    visaTypeDependsOn: function () {return this.residencyStatus && this.residencyStatus != 'citizen';},
    citizenCountry:     {type: String, rule:["required", "text"]},
    citizenCountryDependsOn: function () {return this.residencyStatus && this.residencyStatus != 'citizen';},


    /**
     *     Property of valoraPerson.js
     */

    residencyContinuous: {type: String},

    residencyContinuousDetail: {type: String, value: ''},

    residencyYears: {type: Number, value: 0},
    getResidencyYears: function () {
      return this.residencyYears + ' years';
    },

    residencyStatus: {type: String},
    getResidencyStatus: function () {
      return this.residencyStatus === 'none' || this.residencyStatus === 'residentAlien' ? 'No' : 'Yes';
    },

    citizenshipCountry: {type: String},
    getCitizenshipCountry: function () {

        var country = _.find(_.keys(this.citizenshipCountryValues), function (key) {
            return key === this.citizenshipCountry;
        }.bind(this));

        return this.citizenshipCountryValues[country];
    },

    childrenResident: {type: Boolean, value: false},
    parentResident: {type: Boolean, value: false},
    partnerResident: {type: Boolean, value: false},
    siblingResident: {type: Boolean, value: false},
    noResident: {type: Boolean, value: false},

    getRelativeResidents: function () {

        var residents = '';

        residents += this.noResident ? 'None' : '';
        residents += this.childrenResident ? 'Children  ': '';
        residents += this.parentResident ? 'Parent  ': '';
        residents += this.partnerResident ? 'Partner   ': '';
        residents += this.siblingResident ? 'Sibling ': '';

        return residents;
    },

    residencyAsset: {type: String, value: ''},
    getResidencyAsset: function () {
        var assets = 'I own ';

        assets += this.residentialProperty ? 'Residential Property ' : '';
        assets += this.commercialProperty ? 'Commercial Property ': '';
        assets += this.investmentAccount ? 'Investment Accounts ': '';
        assets += this.bankAccount ? 'Bank Accounts ': '';
        assets += this.otherProperty ? 'and Other Property ': '';

        return assets;
    },

    residentialProperty: {type: Boolean, value: false},
    commercialProperty: {type: Boolean, value: false},
    investmentAccount: {type: Boolean, value: false},
    bankAccount: {type: Boolean, value: false},
    otherProperty: {type: Boolean, value: false},


    assetValue: {type: Number, value: 0},

    residencyPlans: {type: String, value: ''},

    hasVisa: {type: String, value: ''},

    visaNumber: {type: String, value: ''},

    visaExpirationDate: {type: String, value: ''},

    dateResidentLeaving : {type: String, value: ''},

    documentationDetail: {type: String, value: ''},

    TIN: {type: String, value: ''},

    noSSN: {type: Boolean, value: false}

    // Property of valoraPerson.js


});

var Phone = objectTemplate.create("Phone",
{
    init:           function (customer, type) {
        if (customer) {
            this.customer = customer;
            this.customer.phones.push(this);
        }
        this.type = type || Phone.TYPES.mobile;
    },
    bucket:         {type: String},  // Used temporarily to ensure master list in customer is accurate
    number:       {type: String, rule: ["required", "telephone"]},
    numberValues: function () {
        if (!this.customer) { return []; }

        return _.uniq(_.filter(_.map(this.customer.phones, function (phone) {
            if (phone.number) {
                return {
                    listValue: phone.getFormatted(phone.number).replace(/[()]/g, ''),
                    fieldValue: phone.getFormatted(phone.number).replace(/[()]/g, ''),
                    unformattedValue: phone.number,
                    type: phone.type
                }
            } else
                return null;
        }.bind(this)),function(o){return o ? true: false}));
    },
    numberTypeaheadTrigger: function (obj) {
        this.number = obj.unformattedValue;
        this.type = obj.type;
    },
    //type:           {type: String, value: '12'},
    type:           {type: String, rule: ["required"]},
    typeValues:   {isLocal: true, type: Array, value: ["1","2", "12"]},
    typeDescriptions:   {isLocal: true, type: Object, value: {
        "1": "Home",
        "2": "Work",
        "12": "Mobile"
    }},
    typeTrigger: function(){
        this.type = this.type || Phone.TYPES.mobile;
    },
    getAreaCode: function () {return this.number && this.number.length >= 10 ? this.number.substr(0,3) : ""},
    getExchange: function () {return this.number && this.number.length >= 10 ? this.number.substr(3,3) : ""},
    getLine: function () {return this.number && this.number.length >= 10 ? this.number.substr(6,4) : ""},
    getExtension: function () {return this.number && this.number.length > 10 && this.number.substr(10) != 0 ? this.number.substr(10) : ""},
    getFormatted: function (number) {
        number = number || this.number;
        if (!number)
            return "";
        var parts = number.split(" ");
        if (parts.length < 2 || parts[0].length < 10)
            return number;
        return "(" + parts[0].substr(0,3) + ") " + parts[0].substr(3,3) + "-" + parts[0].substr(6, 4) +
            (parts[1] > 0 ? " x" + parts[1] : "");
    },
    getChooserDisplay: function () {
        if (!(this.number))
            return "";
        return this.getFormatted()
    },
    isMobile: function() {
        return this.type == '12';
    },
    isHome: function() {
        return this.type == '1';
    },
    isWork: function() {
        return this.type == '2';
    }
});
Phone.TYPES = {mobile: '12', home: '1', work: '2'};

var Digit = objectTemplate.create("Digit",
{
    init: function (str) {
        this.str = str;
    },
    str: {type: String}
});

var Entity = objectTemplate.create("Entity",
{
    init: function (customer) {
        this.customer = customer;
        this.legalAddress = new Address(this.customer);
        this.mailingAddress = new Address(this.customer);
        this.phone = new Phone(this.customer);
    },

    type:       {type: String, value: 'trust'},
    typeValues: {isLocal: true, type: Object, value:["trust", "inc", "noninc"]},
    typeDescriptions:  {isLocal: true, type: Object, value: {
            "trust" : "Trust",
            "inc" : "Incorporated business",
            "noninc": "Unincorporated business"}},

    specificType: {type: String},
    specificTypeDependsOn: function () {return this.type == 'noninc'},

    name:               {type: String, rule: ["nameSupportComma", "required"]},
    getFullName: function () {
        return this.name;
    },

    legalAddress:       {type: Address},
    mailingAddress:     {type: Address},
    phone:              {type: Phone},
    email:              {type: String, rule: ["email"]},

    citizenship:        {type: String},
    citizenshipValues:  {isLocal: true, type: Object, value: {us: "US", foreign: "Foreign"}},

    taxId:              {type: String, rule: ["EINSSN", "required"]},
    getTaxIdType:       function () {
        if (!this.taxId) { return 'Unknown'; }
        if (this.taxId.substr(2, 1) === '-') { return 'EIN'; }
        return 'SSN'
    },
    //ssnoreinGet:       function() {
    //    if (this.taxId) {
    //        return this.getTaxIdType();
    //    } else {
    //        return this.ssnToggle || "EIN";
    //    }
    //},
    ssnToggle: {isLocal: true, type: String, value: null},
    //ssnoreinSet:       function(string) {
    //    var id = this.taxId || '';
    //    this.ssnToggle = string;
    //    if (string == "EIN"){
    //        if (id != null){
    //            id = id.replace(/-/g, "")
    //            id = id.replace(/(\d{2})(\d{7})/, "$1-$2");
    //        }
    //    }
    //    if (string == "SSN"){
    //        if (id != null){
    //            id = id.replace(/-/g, "")
    //            id = id.replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
    //        }
    //    }
    //    this.taxId = id;
    //    return Q(true);
    //},
    ssnorein: {type: String, rule: ['required']},
    ssnoreinValues: {isLocal: true, type: Array, value: ['EIN', 'SSN']},
    ssnoreinDescriptions: {isLocal: true, type: Object, value: {'EIN': 'EIN', 'SSN':'SSN'}},

    trustSitus:         {type: String},
    trustSitusDependsOn: function () {return this.type == 'trust'},

    formed:             {type: Date, rule: ['DOB', 'required']},
    formedDependsOn:    function () {return this.type == 'trust' || this.type == 'trustwill'},

    trustType:          {type: String, rule: ["required"]},
    trustTypeValues:       {isLocal: true, type: Array, value: ['revocable', 'irrevocable']},
    trustTypeDescriptions: {isLocal: true, type: Object,
        value: {'revocable': "Revocable", 'irrevocable':"Irrevocable"}}
});
        
// New application model uses these beneficary mappings

Beneficiary.mixin(
{
    // Can be person or Entity (for trust)
	person:     {type: Person},
    personDependsOn: function () {return this.type == 'individual'},

    entity:     {type: Entity},
    entityDependsOn: function () {return this.type == 'trust'},

    address:    {type: Address},
    addressDependsOn: function () {return this.type != 'estate'},

    phone:      {type: Phone},
    phoneDependsOn: function () {return this.type != 'estate'},

    isPrimary: function() {
        return this.partyProperty == 'primaryBeneficiary';
    },

    isContingent: function() {
        return this.partyProperty == 'contingentBeneficiary';
    },

    isTrust: function() {
        return (this.isPrimary() && this.policy.beneficiaryType == '7') ||
            (this.isContingent() && this.policy.contingentBeneficiaryType == '7');
    },

    getFullName: function () {
        if ( this.isTrust() ){
            if (this.entity.trustType == "revocable"){
                return this.entity.getFullName() + ", revocable";
            } else {
                return this.entity.getFullName() + ", irrevocable";
            }
        } else {
            return this.person.getFullName();
        }
    },

    getGovtId: function() {
        return this.isTrust() ? this.entity.taxId : this.person.SSN;
    },

    getGovtIdType: function() {
        return this.isTrust() ? this.entity.getTaxIdType() : this.person.getTaxIdType();
    },


    getDob: function() {
        return this.isTrust() ? this.entity.formed : this.person.dob;
    },

    getAddress: {type: Address, body: function() {
        return this.isTrust() ? this.entity.legalAddress : this.address;
    }},

    getPhone: {type: Phone, body: function() {
        return this.isTrust() ? this.entity.phone : this.phone;
    }},

    getPerStirpes: function() {
        if (!this.policy) { return; }
        return this.isPrimary() ? this.policy.beneficiaryPerStirpes : this.policy.contingentBeneficiaryPerStirpes;
    }

});
return {
    UniversalBeneficiary: UniversalBeneficiary,
	Beneficiary: Beneficiary,
    Person: Person,
    PersonQuery: PersonQuery,
    Entity: Entity,
    Address: Address,
    Phone: Phone,
    SplitParty: SplitParty,
    Digit: Digit
}
}
module.exports.Person_mixins = function (objectTemplate, requires)
{
    var Policy = requires.Policy.Policy;
    var SplitParty = requires.Person.SplitParty;

    SplitParty.mixin(
        {
            policy:    {type: Policy}
        });
};
