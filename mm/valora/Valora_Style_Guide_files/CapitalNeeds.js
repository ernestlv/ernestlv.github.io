module.exports.CapitalNeeds = function (objectTemplate, getTemplate)
{
    var CashFlow = getTemplate('./needs/CashFlow.js').CashFlow;
    var Income  = getTemplate('./needs/CashFlow.js').Income;
    var Expense  = getTemplate('./needs/CashFlow.js').Expense;
    var Asset  = getTemplate('./needs/CashFlow.js').Asset;
    var Insurance  = getTemplate('./needs/CashFlow.js').Insurance;
    var Liability  = getTemplate('./needs/CashFlow.js').Liability;
    var ReplacementIncome = getTemplate('/needs/Expense.js').ReplacementIncome;
    var	Children = getTemplate('./needs/Expense.js').Children;
    var	HealthCare = getTemplate('./needs/Expense.js').HealthCare;
    var	ChildCare = getTemplate('./needs/Expense.js').ChildCare;
    var	EarnedIncome = getTemplate('./needs/Income.js').EarnedIncome;
    var	SSN = getTemplate('./needs/Income.js').SSN;
    var	Retirement401K = getTemplate('./needs/Income.js').Retirement401K;
    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;

var Profile = objectTemplate.create("Profile",
{
	personality:      {type: String, value: 'none'},
	numberOfChildren: {type: Number, value: 0, rule:["required", "numericInt"], validate: "isWithin(0, 20)"},
	numberOfChildrenTrigger: function () {
		this.customer.capitalNeeds.replaceIncome = this.numberOfChildren > 0 || this.relationship != 'single';
        this.customer.capitalNeeds.adjustChildren();
	},
	numberOfChildrenValues: {isLocal: true, type: Object, value:
						{0: 'None', 1:'1', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9'}},
	zipCode:		  {type: Number, value: 10028, rule: ["numeric"]},
	state:            {type: String, value: 'NY'},
	stateValues:      {isLocal: true, type: Object, value: Assumptions.stateValues},
	livingMethod:	  {type: String, value: "rent"},
	relationship:	  {type: String, value: "single"},
	relationshipTrigger: function () {
		if (this.relationship == 'single')
			this.customer.capitalNeeds.deleteAlternate();
		this.customer.capitalNeeds.replaceIncome = this.numberOfChildren > 0 || this.relationship != 'single';
		this.customer.customerSelection = 0;
	},
	relationshipValues:  {isLocal: true, type: Object, value: {'single':'Single', 'married':'Married', 'partner':'Have a partner'}},
    // virtual property with 4 possible values: single, married, marriedwithchildren, singleparent
    familyStatusGet: function(){
        if(this.numberOfChildren === 0){
            return this.relationship;
        }
        else {
            if(this.relationship === "single") {
                return "singleparent";
            }
            else{
                return "marriedwithchildren";
            }
        }
    },
    familyStatusSet: function(status){
        if(status === 'marriedwithchildren'){
            this.numberOfChildren = 1;
            this.relationship = 'married';
            this.relationshipTrigger();
        }
        else if(status === "singleparent"){
            this.numberOfChildren = 1;
            this.relationship = 'single';
            this.relationshipTrigger();
        }
        else{
            this.relationship = status;
            this.relationshipTrigger();
            this.numberOfChildren = 0;
        }
        this.numberOfChildrenTrigger();
        return Q(true);
    },
    familyStatusValues: {isLocal: true, type: Object, value: {'single': 'Single', 'singleparent':'Single Parent', 'married':'Married', 'marriedwithchildren': 'Married with Kids'}},
	savingsRate:      {type: Number, value: 0},
	savingsRate401K:  {type: Number, value: 0},
	collegeType:      {type: String, value: 'inState4yr'},
	collegeTypeValues: {isLocal: true, type: Object, value: {
		none: "none",	community2yr: "2 year community", inState4yr: "4 year public (in-state)",
		outState4yr: "4 year public (out-of-state)",	private4yr:  "4 year private"}},
	collegeTypeTrigger: function () {
			this.customer.capitalNeeds.sendKidsToCollege = this.collegeType != 'none';
	},
	includeBoard:     {type: Boolean, value: true},
	includeLiving:    {type: Boolean, value: false},
    collegeMaxYears: {type: Number, value: 4},
	collegePercent:   {type: Number, value: 1},
	collegePercentValues:        {isLocal: true, type: Object, value:
	{0:'None', 0.1:"10%", 0.2:"20%", 0.3:"30%", 0.4:"40%", 0.5:"50%",
		0.6:"60%", 0.7:"70%", 0.8:"80%", 0.9:"90%", 1: "100%"}},
	collegePercentOrder:        {isLocal: true, type: Array, value:
		[1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0]},

	policyType:         {type: String, value: ""},
	notifyPermanent:  {type: Boolean, value: null},
	childCareGiver:   {type: String, value: 'other'},

    // Annual college costs
	getCollegeCost:  function() {
		if (this.collegeType == 'none')
			return 0;
		var costs = this.customer.assumptions.collegeCosts[this.collegeType];
		return (costs.tuition * this.collegePercent + costs.books +
			   (this.includeBoard ? costs.board : 0) +  (this.includeLiving ? costs.living : 0));
	},
	getAverageCostPerChild: function () {
		var kidCount = this.customer.capitalNeeds.children.length;
		return this.getTotalCollegeCost() / (kidCount > 0 ? kidCount : 1);
	},
	getTotalCollegeCost: function () {
		var kidCount = this.customer.capitalNeeds.children.length;
		var cost = 0;
		for (var ix = 0; ix < kidCount; ++ ix)
			cost += this.customer.capitalNeeds.children[ix].getFutureValue();
		return cost;
	},
	init: function(customer) {
		this.customer = customer;
	},
    // Create a new copy, linking it to a new customer
    createCopyWithCustomer:   function(newCustomer)
    {
        return this.createCopy(function (obj, prop, template) {
            switch(template.__name__) {
                case 'Assumptions': return Assumptions;
                case 'Customer': return [newCustomer]; // Don't traverse
				case 'HavenCustomer': return [newCustomer]; // Don't traverse
            }
        }.bind(this));
    }

});

var CapitalNeeds = objectTemplate.create("CapitalNeeds",
{
	expenses:			{type: Array, of: Expense, subClasses: [HealthCare, ChildCare], value: [], applicationOmit: true},
	income:				{type: Array, of: Income, subClasses: [SSN], value: [], applicationOmit: true},
	children:           {type: Array, of: Children, value: []},
	childrenTrigger:    function () {
	},
	earnedIncome:       {type: Array, of: EarnedIncome, value: [], applicationOmit: true},
	replacementIncome:  {type: Array, of: ReplacementIncome, value: [], applicationOmit: true},
	assets:				{type: Array, of: Asset, subClasses:[Insurance, Retirement401K, Asset], value: [], applicationOmit: true},
	liabilities:		{type: Array, of: Liability, value: [], applicationOmit: true},
	discountRate:		{type: Number, value: .04},
	assetTypes:		    {isLocal: true, type: Object, value:
							{"savings":"Savings", "investments":"Investments", "Other":"Other"}},
	liabilityTypes:	    {isLocal: true, type: Object,
							value: {"cards":"Credit card", "loan":"Loan", "mortgage":"Home Mortgage",
							"final":"Final expense", "other":"Other"}},
	liabilityTypeList:	{isLocal: true, type: Array, of: String,
							value: ["cards", "loan", "mortgage", "other"]},
	incomeOptionTypes:  {isLocal: true, type: Object,
							value: {"none":"not work", "work": "earn another amount", "same":"earn the same"}},
	expenseTypes:       {isLocal: true, type: Object,
							value: {"health":"Health insurance"}},
    haveAnyDebtsGet: function(){
      return !this.payOffMortgage && !this.payOffDebts;
    },

    getProp: function(prop){
        var descriptions = this.getBiggestFlow().descriptions;
        // if(!descriptions) return null;
        if(!descriptions) return null;

        var propVal = 0;
        descriptions.map(function(currDesc, index){
            if(currDesc.indexOf(prop) === 0){
                propVal += this.getBiggestFlow().npvs[index];
            }
        }.bind(this));

        return propVal;

    },



    haveAnyDebtsSet: function(noDebts){
        if(noDebts) {
            this.payOffMortgage = false;
            this.payOffMortgageTrigger();
            this.payOffDebts = false;
            this.payOffDebtsTrigger();
        }

        return Q(true);
    },
	payOffDebts:        {type: Boolean, value: false},
	payOffDebtsTrigger: function () {
		if (!this.payOffDebts)
			this.getLiabilityLoan().amount = 0;
	},
	payOffDebtsValues:  {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},
	payOffDebtsPercent: {type: Number, value: 1},
	payOffMortgage:     {type: Boolean, value: false},
	payOffMortgageTrigger: function () {
		if (!this.payOffMortgage)
			this.getLiabilityMortgage().amount = 0;
	},
	payOffMortgageValues:  {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},
	sendKidsToCollege:  {type: Boolean, value: true},
	sendKidsToCollegeValues: {isLocal: true, type: Object, value: {"false":"not paying for college", "true": "paying for college"}},
	sendKidsToCollegeTrigger: function () {
		this.customer.profile.collegeType = this.sendKidsToCollege ? 'inState4yr' : 'none';
	},

	replaceIncome:      {type: Boolean, value: false},
	considerRetirement: {type: Boolean, value: false},
	cache:              {type: Object, value: {}, isLocal: true},

    includeImputedSavings: {type: Boolean, value: false},
    // Scenarios
    currentScenario:    {type: Number, value: 1}, // Gold
    currentStandardScenario:    {type: Number, value: 1}, // Gold
    scenarioDescriptions: {type: Object, value: {}},
    incomeDescription: {type: Object, value: {}},

    scenarioNPVReplacementIncome: {type: Object, value: {}},
    customReplacementIncome1:   {type: Number, value: 1},
    customReplacementIncome1Values: {isLocal: true, type: Object, value: {0:"none of my salary", 0.25:"some of my salary (25%)",0.5:"half of my salary",0.75:"most of my salary (75%)",1:"all of my salary"}},
    customReplacementIncome2:   {type: Number, value: 0.5},
    customReplacementIncome2Values: {isLocal: true, type: Object, value: {0:"none of my salary", 0.25:"some of my salary (25%)",0.5:"half of my salary",0.75:"most of my salary (75%)",1:"all of my salary"}},
    customLeaveTheNestAge:      {type: Number, value: 21},
    customLeaveTheNestAgeValues: {isLocal: true, type: Object, value: {18:"the kids are 18",19:"the kids are 20",21:"the kids are 21",25:"the kids are 25",30:"the kids are 30"}},
    customCollegeMaxYears:      {type: Number, value: 2},
    customCollegeMaxYearsValues: function () {
        var ret = {}
        if(this.sendKidsToCollege) {
            ret[1] = "1 year of college";
            if (this.customer.assumptions.collegeCosts[this.customer.profile.collegeType].period >= 2)
                ret[2] = "2 years of college";
            if (this.customer.assumptions.collegeCosts[this.customer.profile.collegeType].period >= 3)
                ret[3] = "3 years of college";
            if (this.customer.assumptions.collegeCosts[this.customer.profile.collegeType].period >= 4)
                ret[4] = "4 years of college";
        }
        return ret;
    },
    customPayOffDebtsPercent:   {type: Number, value: 1},
    customPayOffDebtsPercentValues: {isLocal: true, type: Object, value: {0: "none of my debt", 0.25:"a quarter of my debt",0.5:"half of my debt",1:"all of my debt"}},
    customRetirementAge:        {type: Number, value: 65 },
    customRetirementAgeValues: function () {
        var ret = {};
        if (this.customer.alternateCustomer.person.age < (this.customRetirementAge - 20))
            ret[this.customRetirementAge - 20] = "my spouse is " + (this.customRetirementAge - 20);
        if (this.customer.alternateCustomer.person.age < (this.customRetirementAge - 10))
            ret[this.customRetirementAge - 10] = "my spouse is " + (this.customRetirementAge - 10);
        if (this.customer.alternateCustomer.person.age < (this.customRetirementAge))
            ret[this.customRetirementAge] = "my spouse is " + this.customRetirementAge;
        if (this.customer.alternateCustomer.person.age < (this.customRetirementAge + 10))
            ret[this.customRetirementAge + 10] = "my spouse is " + (this.customRetirementAge + 10);
        return ret;
    },
    customYearsToPayDebt:       {type: Number, value: 20},
    customYearsToPayDebtValues: {type: Object, value: {10:"10 years", 15:"15 years", 20: "20 years"}},

	marriedWithChildrenRule: 	{isLocal: true, type: String}, // One of singleparent or marriednokids in effect if the
	                                                           // customer has spouse and kids

    init: function (customer) {

		this.customer = customer;
		this.earnedIncome[0] = new EarnedIncome(this.customer, this.customer.primaryCustomer, 0);
		this.earnedIncome[1] = new EarnedIncome(this.customer, this.customer.alternateCustomer, 0);
		this.replacementIncome.push(new ReplacementIncome(this, 1,.8, "Kids at home"));
		this.replacementIncome.push(new ReplacementIncome(this, 2,.6, "Kids grown"));
		this.replacementIncome.push(new ReplacementIncome(this, 3, 1, "Retirement"));
		this.assets.push(new Retirement401K(this.earnedIncome[0], 0, 0));
		this.assets.push(new Retirement401K(this.earnedIncome[1], 0, 0));

		for (var assetType in this.assetTypes)
			this.addAsset(assetType);
		this.income.push(new SSN(this.earnedIncome[0], this.customer.primaryCustomer));
		this.income.push(new SSN(this.earnedIncome[1], this.customer.alternateCustomer));
		this.addLiability('mortgage');
		this.addLiability('cards');
		this.addLiability('loan');
		this.addLiability('other');
		this.addLiability('final', 20000);
		this.expenses.push(new HealthCare(this.customer));
		this.clientInit();
	},

	deleteAlternate: function () {
		//this.customer.alternateCustomer = new (this.customer.alternateCustomer.__template__)("", null, 32, this.customer);
		//this.customer.alternateCustomer.addressSameAsPrimary = true;
		this.earnedIncome[1].reset(); // = new EarnedIncome(this.customer, this.customer.alternateCustomer, 0);
		//this.earnedIncome[2] = new EarnedIncome(this.customer, this.customer.alternateCustomer, 0);
		this.assets[1].reset(); // = new Retirement401K(this.earnedIncome[1], 0, 0);
		//this.income[1].reset(); // = new SSN(this.earnedIncome[1], this.customer.alternateCustomer);
	},

	clientInit: function () {
		// New cash flow items need to be added here to account for old data that may not have them;
		if (this.getExpenses('childcare').length == 0)
			this.expenses.push(new ChildCare(this.customer));

		this.resetOrder();
	},
	resetOrder: function () {

		// If this is related to a policy that has been submitted don't do this because
		// we won't be displaying or using the info and it is a violation to do so
		// However admin needs to do this to display stuff so we have an override
		// where admin sets a flag to allow this to happen since it won't save.
		if (!this.allowOrdering && this.customer.applicationPolicy && this.customer.applicationPolicy.workflowState)
			return;

		// Hack because we now only have earned income for primary
		if (this.earnedIncome[1].amount) {
			var primary = this.earnedIncome[1];
			var alternate = this.earnedIncome[0];
			this.earnedIncome[0] = primary;
			this.earnedIncome[1] = alternate;
		}

		// Account for lack of guarnteed order
		if (this.income[0].earnedIncome != this.earnedIncome[0]) {
			var primary = this.income[1];
			var alternate = this.income[0];
			this.income[0] = primary;
			this.income[1] = alternate;
		}
		this.replacementIncome.sort(function(a,b){return a.title > b.title ? 1 : -1});
	},
    // Create a new copy, linking it to a new customer
    createCopyWithCustomer:   function(newCustomer)
    {
        var capitalNeeds = this.createCopy(function (obj, prop, template) {
            switch(template.__name__) {
                case 'Assumptions': return Assumptions;
                case 'Customer': return [newCustomer]; // Don't traverse
				case 'HavenCustomer': return [newCustomer]; // Don't traverse
                case 'Applicant': return [newCustomer.primaryCustomer]; // Don't traverse
            }
        }.bind(this));

        capitalNeeds.earnedIncome[1].applicant = newCustomer.alternateCustomer;
        capitalNeeds.income[1].applicant = newCustomer.alternateCustomer;
        return capitalNeeds;
    },
	compute: function() {
		this.cache = {};
		this.adjustChildren();
		this.adjustAssetsLiabilities();
	},

	// Financial calculation functions

	getScenarioCoverage: function (alternateDeceased, scenario) {
        var coverage = this.getCoverage(alternateDeceased, scenario, true);
        this.adjustScenario(scenario);
        if (coverage == 0)
            this.scenarioDescriptions[scenario] = null;
        return coverage;
    },
    getCoverage: function(alternateDeceased, scenario, getMaxIncome)
	{

		alternateDeceased = (typeof(alternateDeceased) != 'undefined') ? alternateDeceased :
			this.customer.customerSelection > 0 ? true : false;

		return this.getFace(alternateDeceased, scenario, getMaxIncome);
	},
	increaseCoverage: function (amount, justTesting) {
		var cover1 = this.replacementIncome[0].covered;
		var cover2 = this.replacementIncome[1].covered;
		amount = amount ? amount : 0.1;
		if (this.customer.profile.numberOfChildren > 0)
			this.replacementIncome[0].covered =
				Math.round(Math.min(Math.max(this.replacementIncome[0].covered * 1 + amount, 0), 1.5) * 10) / 10;
		if (this.customer.profile.relationship != 'single') {
			var covered = this.replacementIncome[1].covered * 1;
			var increment = covered > .6  ? amount
									      : (covered ==.6 ? (amount < 0 ? amount * 3 : amount) : amount * 3);
			this.replacementIncome[1].covered =	Math.round(Math.min(Math.max(covered + increment, 0), 1.5) * 10) / 10;
		}
		if (!justTesting) {
			this.cache = {};
			if (!this.needsCoverage()) {
				this.replacementIncome[0].covered = cover1;
				this.replacementIncome[1].covered = cover2;
			}
		}
		if (justTesting) {
			var canChange = (cover1 != this.replacementIncome[0].covered || cover2 != this.replacementIncome[1].covered);
			this.replacementIncome[0].covered = cover1;
			this.replacementIncome[1].covered = cover2;
			return canChange;
		}
	},
	decreaseCoverage: function (justTesting) {
		return this.increaseCoverage(-0.1, justTesting);
	},
	canIncreaseCoverage: function () {
		return this.increaseCoverage(null, true);
	},
	canDecreaseCoverage: function () {
		return this.decreaseCoverage(true);
	},
	needsCoverage: function () {
		return this.getCoverage(false) > 0 || this.getCoverage(true) > 0
	},
	getGrossPay: function () {
		return this.earnedIncome[0].amount + this.earnedIncome[1].amount;
	},
	hasAsset: function(asset) {
		for (var ix=0; ix < this.assets.length; ++ ix)
			if (this.assets[ix].subtype == asset && this.assets[ix].amount > 0)
				return true;
		return false;
	},
	getAssetSavings: function() {return this.getAsset('savings');},
	getAssetInsurance: function() {return this.getAsset('insurance');},

    existingInsurance:	{type: Number, rule:["currency"], validate:"isWithin(0, 10000000)" },
	getExistingInsurance: function (isAlternateCustomer) {
		var total = 0;
		for (var ix = 0; ix < this.getAssets('insurance').length; ++ix)
			if (this.getAssets('insurance')[ix].forAlternate == isAlternateCustomer)
				total += this.getAssets('insurance')[ix].amount;
		return total;
	},
    // virtual property to get/set existing insurance
    existingInsuranceGet: function(){
        return this.getExistingInsurance(false);
    },
    existingInsuranceSet: function(valueStr){
        var value;
        try{
            value = parseInt(valueStr);

            //if(value > 0){
                var policyCount = this.getAssets('insurance').length;
                if(policyCount === 0){
                    this.addPolicy();
                }
                // Set the amount of the first to the given value?
                this.getAssets('insurance')[0].amount = value;
            //}


            return Q(true);
        }
        catch(e){
            return Q(false);
        }
    },
	getAsset: function(subtype) {
		return this.getAssets(subtype)[0];
	},
	getAssets: function(subtype) {
		var assets = [];
		for (var ix = 0; ix < this.assets.length; ++ix)
			if (this.subTypeMatch(this.assets[ix].subtype, subtype))
				assets.push(this.assets[ix]);
		return assets;
	},
	subTypeMatch: function(a, b) {
		if (!b)
			return true;
		if (b instanceof Array) {
			for (var ix = 0; ix < b.length; ++ ix)
				if (a == b[ix])
					return true;
		} else
			if (a == b)
				return true;
		return false;
	},
	sumAssets: function(subtype) {
		var assets = this.getAssets(subtype);
		var sum = 0;
		for (var ix = 0; ix < assets.length; ++ix)
			sum += assets[ix].amount;
		return sum;
	},
	getLiabilityMortgage: function () {return this.getLiability('mortgage')},
	getLiabilityOther: function () {return this.getLiability('other')},
	getLiabilityLoan: function () {return this.getLiability('loan')},
	getLiabilityFinal: function () {return this.getLiability('final')},
	getLiability: function(subtype) {
		return this.getLiabilities(subtype)[0];
	},
	getLiabilities: function(subtype) {
		var liability = [];
		for (var ix = 0; ix < this.liabilities.length; ++ix)
			if (!subtype || this.liabilities[ix].subtype == subtype)
				liability.push(this.liabilities[ix]);
		return liability;
	},
	sumLiabilities: function(subtype) {
		var liabilities = this.getLiabilities(subtype);
		var sum = 0;
		for (var ix = 0; ix < liabilities.length; ++ix)
			sum += liabilities[ix].amount;
		return sum;
	},
    getDebt: function () {
        return this.sumLiabilities - this.getLiabilityFinal().amount;
    },
	getExpenseHealthCare: function() {
		return this.getExpenses('healthcare')[0];
	},
	isHealthCareNeeded: function() {
		return (this.children.length > 0 || this.customer.profile.relationship != 'single') &&
			   (!this.earnedIncome[0].hasHealthCare  && this.getCoverage(true) ||
				!this.earnedIncome[1].hasHealthCare  && this.getCoverage(false));
	},
	getExpenseChildCare: function() {
		return this.getExpenses('childcare')[0];
	},
	bothCovered: function () {
		return this.getCoverage(false) > 0 && this.getCoverage(true) > 0;
	},
	isChildCareNeeded: function() {
		return this.children.length > 0 &&
			(this.earnedIncome[0].needsChildCare && this.getCoverage(true) ||
			 this.earnedIncome[1].needsChildCare && this.getCoverage(false));
	},
	getExpenses: function(subtype) {
		var expenses = [];
		for (var ix = 0; ix < this.expenses.length; ++ix)
			if (this.expenses[ix].subtype == subtype)
				expenses.push(this.expenses[ix]);
		return expenses;
	},

	//  Time calculation functions

	getLastYear: function(deceased)
	{
		// No kids and single no cash flow
		if (this.children.length == 0 && this.customer.profile.relationship == 'single')
			return 0;

		// Kids and single only kids are relavent
		if (this.children.length > 0 && this.customer.profile.relationship == 'single')
			return Math.max(this.getFinishCollegeYear(), this.getLeaveTheNestYear());

		var retirementMax = 0;
		if (this.replacementIncome[2].amount)
			retirementMax = this.customer.settings.mortalityAge - this.customer.getSurvivor(deceased).person.age;
		else
			retirementMax = this.customer.settings.retirementAge - this.customer.getSurvivor(deceased).person.age;

		// With kids cover until they leave the nest or until they finish college
		if (this.children.length > 0)
			return Math.max(this.getFinishCollegeYear(), Math.max(retirementMax, this.getLeaveTheNestYear()));
		else
			return retirementMax;

	},
	getOldestPerson: function () {
		return this.customer.profile.relationship == 'single' ? this.customer.primaryCustomer.person.age :
			Math.max(this.customer.primaryCustomer.person.age, this.customer.alternateCustomer.person.age);
	},
	getYoungestPerson: function () {
		return this.customer.profile.relationship == 'single' ? this.customer.primaryCustomer.person.age :
			Math.min(this.customer.primaryCustomer.person.age, this.customer.alternateCustomer.person.age);
	},
	getAgeOfYoungestChild: function () {
		var age = 99;
		for (var ix = 0; ix < this.children.length; ++ix)
			if (this.children[ix].age < age)
				age = this.children[ix].age;
		return age;
	},
    getAgeOfOldestChild: function () {
        var age = 0;
        for (var ix = 0; ix < this.children.length; ++ix)
            if (this.children[ix].age > age)
                age = this.children[ix].age;
        return age;
    },
	getLeaveTheNestYear: function () {
		return Math.max(0, this.customer.settings.leaveTheNestAge - this.getAgeOfYoungestChild());
	},
	getFinishCollegeYear: function () {
		var costs = this.customer.assumptions.collegeCosts[this.customer.profile.collegeType];
		return this.getStartCollegeYear() + (costs ? costs.period : 4);
	},
	getStartCollegeYear: function () {
		return Math.max(this.customer.assumptions.startCollege - this.getAgeOfYoungestChild(), 0);
	},
	getRetirementYear: function (deceased) {
		return Math.max(0, this.customer.settings.retirementAge - this.customer.getSurvivor(deceased).person.age);
	},
	getMedicareYear: function (deceased) {
		return Math.max(0, this.customer.assumptions.medicareYear - this.customer.getSurvivor(deceased).person.age);
	},
	// related entity management functions

	addAsset:		function(subtype, amount) {
		this.assets.push(new Asset(this.customer, subtype, 0, this.assetTypes[subtype]));
	},
	addPolicy:		function(customer) {
		this.assets.push(new Insurance(this.customer, 0, customer ? customer : this.customer.primaryCustomer));
	},
	getPolicies:    function (customer, onlyReplacements) {
		var policies = [];
		var forAlternate = customer == this.customer.alternateCustomer;
		var allPolicies = this.getAssets('insurance');
		for (var ix = 0; ix < allPolicies.length; ++ix)
			if (allPolicies[ix].forAlternate == forAlternate &&
                (!onlyReplacements || allPolicies[ix].willReplace))
				policies.push(allPolicies[ix]);
		return policies;
	},
	removeAsset:    function(asset) {
		for (var ix = 0; ix < this.assets.length; ++ix)
			if (asset == this.assets[ix])
				this.assets.splice(ix, 1);
	},
	addLiability:		function(subtype, amount) {
		this.liabilities.push(new Liability(this.customer, subtype, amount ? amount : 0, this.liabilityTypes[subtype]));
	},
	removeLiability:    function(asset) {
		for (var ix = 0; ix < this.liabilities.length; ++ix)
			if (asset == this.liabilities[ix])
				this.liabilities.splice(ix, 1);
	},
	addChildren:	function(age) {
		this.children.push(new Children(this.customer, age || 2, 'children'));
	},
	ageTrigger: function(person) {
		// this.earnedIncome[person == this.customer.primaryCustomer ? 0 : 1].ageTrigger(person.person.age);
		this.earnedIncome[person.isPrimaryApplicant() ? 0 : 1].ageTrigger(person.age);
	},
	adjustAssetsLiabilities: function() {
		/*
		 if (this.assets[this.assets.length - 1].amount != 0)
		 this.addAsset("savings", 0);
		 if (this.liabilities[this.liabilities.length - 1].amount != 0)
		 this.addLiability("loan", 0);
		 */
	},
	adjustChildren: function() {
        var oldest = this.getAgeOfOldestChild || 2;
        while (this.children.length < this.customer.profile.numberOfChildren)
            this.addChildren(oldest++);
		while (this.children.length > this.customer.profile.numberOfChildren)
			this.children.splice(this.children.length -1, 1);
	},

    saveScenario: function () {
        this.savedScenario = {
            retirementAge: this.customer.settings.retirementAge,
            leaveTheNestAge: this.customer.settings.leaveTheNestAge,
			overrideAmount: this.customer.primaryCustomer.overrideAmount,
			overrideTerm: this.customer.primaryCustomer.overrideTerm
		};
    },

    restoreScenario: function () {
		this.customer.settings.retirementAge = this.savedScenario.retirementAge;
        this.customer.settings.leaveTheNestAge = this.savedScenario.leaveTheNestAge;

		this.customer.primaryCustomer.overrideAmount = this.savedScenario.overrideAmount;
		this.customer.primaryCustomer.overrideTerm = this.savedScenario.overrideTerm;
    },

    hasKids: function () {return this.customer.profile.numberOfChildren > 0},
    hasIncome: function () {return this.customer.capitalNeeds.earnedIncome[0].amount >  0},
    hasSpouse: function () {return this.customer.profile.relationship != 'single'},
    hasDebt: function () { return (this.getLiabilityMortgage().amount + this.getLiabilityLoan().amount) > 0},
    hasTimeFrame: function () {
        if (!this.hasKids() && !this.hasSpouse())
            return false;
        if (this.customer.capitalNeeds.earnedIncome[0].amount > 0 &&
            ((this.hasKids() ? this.customReplacementIncome1 : 0) +  (this.hasSpouse() ? this.customReplacementIncome2 : 0)) > 0)
            return true;
        if (this.hasKids() && this.sendKidsToCollege && this.customCollegeMaxYears > 0)
            return true;
        return false;
    },

    setScenario: function (scenario)
    {
		this.resetOrder();
        this.customer.primaryCustomer.overrideTerm = null;
        this.customer.primaryCustomer.overrideAmount = null;
        var overrideTerm = null;

        if (typeof(scenario) == 'undefined')
            scenario = this.currentScenario;

        // -------- If they have kids and spouse ---------

		//	If youngest child < 11
		//	  Use single parent rules - SILVER
		//	  Use single parent rules - GOLD
		//	  Use single parent rules- PLAT

		// If youngest child > 10
		//   Use single parent rules - SILVER
		//   Use married no kids rules with 2 years college - GOLD
		//	 Use married no kids rules with 4 years college - PLAT
		if (this.hasSpouse() && this.hasKids())
        {
            // Custom
            // * Variable percent of coverage for a variable time and variable mortgage payment

            if (scenario != 3)
            {
				if(this.getAgeOfYoungestChild() < 10){
					this.singleParentSettings(scenario);

					// Remember this rule
					this.marriedWithChildrenRule = 'singleparent';
				}
				else{
					this.marriedNoKidsSettings(scenario);

					// Use single parent rules for calculating college years
					this.customer.profile.collegeMaxYears = this.adjustCollegeYears([0, 2, 4])[scenario];

					// Remember this rule
					this.marriedWithChildrenRule = 'marriednokids';
				}

              } else {
                this.replacementIncome[0].covered = this.customReplacementIncome1 * 1;
                this.replacementIncome[1].covered = this.customReplacementIncome2 * 1;
                this.replacementIncome[2].covered = 0;
                if (this.hasTimeFrame()) {
                    this.customer.settings.leaveTheNestAge = this.customLeaveTheNestAge * 1;
                    this.customer.settings.retirementAge = this.customRetirementAge * 1;
                    this.customer.profile.collegeMaxYears = this.customCollegeMaxYears * 1;
                    this.customer.profile.payOffDebtsPercent = this.customPayOffDebtsPercent * 1;
                    this.customer.profile.payOffMortgagePercent = this.customPayOffDebtsPercent * 1;
                } else {
                    this.customer.profile.payOffDebtsPercent = this.customPayOffDebtsPercent * 1;
                    this.customer.profile.payOffMortgagePercent = this.customPayOffDebtsPercent * 1;
                    this.customer.primaryCustomer.overrideTerm = this.customYearsToPayDebt * 1;
                    this.customer.primaryCustomer.overrideAmount = this.customer.profile.payOffDebtsPercent * this.getLiabilityMortgage().amount +
                        this.customer.profile.payOffMortgagePercent * this.getLiabilityLoan().amount + this.getLiabilityFinal().amount;
                }
            }

        }
        else if (!this.hasSpouse() && this.hasKids())
        {
            if (scenario != 3)
            {
				this.singleParentSettings(scenario);

            } else {
                this.replacementIncome[0].covered = this.customReplacementIncome1 * 1;
                this.replacementIncome[1].covered = 0;
                this.replacementIncome[2].covered = 0;
                if (this.hasTimeFrame()) {
                    this.customer.profile.collegeMaxYears = this.customCollegeMaxYears * 1;
                    this.customer.settings.leaveTheNestAge = this.customLeaveTheNestAge * 1;
                    this.customer.settings.retirementAge =  this.customRetirementAge * 1;
                    this.customer.profile.payOffDebtsPercent = this.customPayOffDebtsPercent * 1;
                    this.customer.profile.payOffMortgagePercent = this.customPayOffDebtsPercent * 1;
                } else {
                    this.customer.profile.payOffDebtsPercent = this.customPayOffDebtsPercent * 1;
                    this.customer.profile.payOffMortgagePercent = this.customPayOffDebtsPercent * 1;
                    this.customer.primaryCustomer.overrideTerm = this.customYearsToPayDebt * 1;
                    this.customer.primaryCustomer.overrideAmount = this.customer.profile.payOffDebtsPercent * this.getLiabilityMortgage().amount +
                    this.customer.profile.payOffMortgagePercent * this.getLiabilityLoan().amount  + this.getLiabilityFinal().amount;
                }
            }
        }
        else if (this.hasSpouse() && !this.hasKids())
        {
            if (scenario != 3)
            {
				this.marriedNoKidsSettings(scenario);

            } else {
                this.replacementIncome[0].covered = this.customReplacementIncome2 * 1;
                this.replacementIncome[1].covered = this.customReplacementIncome2 * 1;
                this.replacementIncome[2].covered = 0;
                if (this.hasTimeFrame()) {
                    overrideTerm = this.customRetirementAge - this.customer.alternateCustomer.person.age;
                    this.customer.settings.retirementAge = this.customRetirementAge * 1;
                    this.customer.profile.payOffDebtsPercent = this.customPayOffDebtsPercent * 1;
                    this.customer.profile.payOffMortgagePercent = this.customPayOffDebtsPercent * 1;
                } else {
                    this.customer.profile.payOffDebtsPercent = this.customPayOffDebtsPercent * 1;
                    this.customer.profile.payOffMortgagePercent = this.customPayOffDebtsPercent * 1;
                    this.customer.primaryCustomer.overrideTerm = this.customYearsToPayDebt * 1;
                    this.customer.primaryCustomer.overrideAmount = this.customer.profile.payOffDebtsPercent * this.getLiabilityMortgage().amount +
                        this.customer.profile.payOffMortgagePercent * this.getLiabilityLoan().amount  + this.getLiabilityFinal().amount;
                }
            }
        }

        else if (!this.hasSpouse() && !this.hasKids() && (this.payOffDebts || this.payOffMortgage))
        {
            this.replacementIncome[0].covered = 0;
            this.replacementIncome[1].covered = 0;
            this.replacementIncome[2].covered = 0;
            this.customer.primaryCustomer.overrideAmount = this.customer.profile.payOffDebtsPercent * this.getLiabilityMortgage().amount +
                this.customer.profile.payOffMortgagePercent * this.getLiabilityLoan().amount  + this.getLiabilityFinal().amount;
            if (scenario != 3) {
                this.customer.primaryCustomer.overrideTerm = [10, 20, 30][scenario];
                this.customer.profile.payOffDebtsPercent = 1;
                this.customer.profile.payOffMortgagePercent = 1;
            } else {
                this.replacementIncome[0].covered = 0;
                this.replacementIncome[1].covered = 0;
                this.replacementIncome[2].covered = 0;
                this.customer.profile.payOffDebtsPercent = this.customPayOffDebtsPercent;
                this.customer.profile.payOffMortgagePercent = this.customPayOffDebtsPercent;
                this.customer.primaryCustomer.overrideTerm = this.customYearsToPayDebt;
            }
        }

        overrideTerm = overrideTerm || this.customer.primaryCustomer.overrideTerm;
        if (overrideTerm == 25)
            overrideTerm = 30;

        var sameTerm = this.replacementIncome[0].covered == this.replacementIncome[1].covered;
        if (this.replacementIncome[0].covered > 0)
            if (overrideTerm)
                this.incomeDescription[scenario] =
                        this.getFriendlyPercent(this.replacementIncome[0].covered) + " your income " +
                        "for " + overrideTerm + " years"
            else
                this.incomeDescription[scenario] =
                        (sameTerm ? "" :
                            (this.getFriendlyPercent(this.replacementIncome[0].covered) + " your income " +
                                (this.customer.profile.numberOfChildren > 0 ? "for " + (this.customer.settings.leaveTheNestAge-this.getAgeOfYoungestChild()) + " years." : ""))) +
                        (this.replacementIncome[1].covered > 0 ?
                            (this.customer.profile.numberOfChildren > 0 && !sameTerm? " And then " : "") +
                            this.getFriendlyPercent(this.replacementIncome[1].covered) + " of your income " +
                            "for " + (this.customer.settings.retirementAge-this.customer.alternateCustomer.person.age) + " years" : "")

        // Generate descriptions
        this.scenarioDescriptions[scenario] = [];
        var BGH = ["baseline", "healthy", "generous"];

        if (this.replacementIncome[0].covered > 0)
            this.scenarioDescriptions[scenario].push("A " + BGH[scenario] + " amount of income replacement");

        if ((this.payOffDebts || this.payOffMortgage) && this.customer.profile.payOffDebtsPercent)
            this.scenarioDescriptions[scenario].push(this.capitalize(
                this.getFriendlyPercent(this.customer.profile.payOffDebtsPercent) + " your " +
                (this.payOffMortgage ? ("mortgage" + (this.payOffDebts ? " and " : "")) : "") +
                (this.payOffDebts ? "debts" : "")
            ));

        if (this.customer.profile.numberOfChildren > 0 && this.sendKidsToCollege &&
            this.customer.profile.collegeType != 'none' && this.customer.profile.collegeMaxYears)
            if (this.customer.profile.collegeMaxYears >= this.customer.assumptions.collegeCosts[this.customer.profile.collegeType].period)
                this.scenarioDescriptions[scenario].push("All college costs");
            else
                this.scenarioDescriptions[scenario].push("Half of college costs");

		// Healthcare childcare description
		var isHealthCareNeeded = (this.children.length > 0 || this.customer.profile.relationship != 'single') &&
								  !this.earnedIncome[1].hasHealthCare;
		var isChildCareNeeded = ( this.children.length > 0 && this.earnedIncome[1].needsChildCare) &&
            ( this.getExpenseChildCare().youngCost > 0) &&
            ( this.getExpenseChildCare().youngCost > 0);
		if(isHealthCareNeeded || isChildCareNeeded) {
				this.scenarioDescriptions[scenario].push((isChildCareNeeded ? "Childcare" : "") +
			(isHealthCareNeeded ? (isChildCareNeeded ? " and health care" : "Health care") : "") + " costs");
		}


        // Other sundry items
        var hasSavings = this.customer.capitalNeeds.getAssetSavings().amount > 0;
        var hasInsurance = this.customer.capitalNeeds.existingInsurance > 0;
        var hasSocialSecurity = ( this.customer.capitalNeeds.getLeaveTheNestYear() > 5
            && this.customer.profile.familyStatusGet() == "marriedwithchildren")
            || this.customer.profile.familyStatusGet() == "singleparent";

        var financialSundry =   (hasSavings || hasInsurance || hasSocialSecurity ? "Your " : '' ) +
            (hasSavings ? "savings" : "") +
            (hasInsurance ? (hasSavings ? ", " : "") + " existing insurance" : "") +
            (hasInsurance && hasSocialSecurity || hasSavings && hasSocialSecurity ? " and " : "") +
            (hasSocialSecurity ? "Social Security benefits" : "");

        if ( financialSundry.length > 0 ){
            this.scenarioDescriptions[scenario].push(financialSundry);
        }


        //
        //// Other sundry items
        //var hasSavings = this.customer.capitalNeeds.getAssetSavings().amount > 0;
        //var hasInsurance = this.customer.capitalNeeds.existingInsurance > 0;
        //this.scenarioDescriptions[scenario].push("Your " +
        //    (hasSavings ? "savings" : "") +
        //    (hasInsurance ? (hasSavings ? ", " : "") + " existing insurance" : "") +
        //    (hasInsurance || hasSavings ? " and " : "") +
        //    "Social Security benefits"
        //);
    },

	getLeaveTheNestAge: function(scenario){
		if(scenario === 3)
			return this.customLeaveTheNestAge;

		if(this.hasDebt() || this.sendKidsToCollege) {
			return [21, 25, 25][scenario];
		}
		else {
			return [21, 25, 30][scenario];
		}
	},

	// -------- If they have kids and no spouse ---------
	// Silver:
	// * All your income until the kids are 21
	// * 2 years of private college
	// Gold:
	// * All your income until the kids are 25
	// * 2 years of private college
	// * Half your mortgage and debt
	// Platinum
	// * All your income until the kids are 25 (if debt or college)
	// * All your income until the kids are 30 (if no debts or no college)
	// * 4 years of private college
	// * All your mortgage and debt
	// Exceptions:
	// If youngest child > 11 years old make these changes:
	// * Silver:  Half your income until your kids are 25
	// If youngest child > 18 years old make these changes:
	// * Silver:  All your income until your kids are 25
	// * Gold:    All your income until the kids are 25 and then half your income until your spouse is 50
	// * Platinum: All your income till the kids are 30 if no debt or college
	singleParentSettings: function(scenario){
		this.customer.settings.leaveTheNestAge = this.getLeaveTheNestAge(scenario);

		this.replacementIncome[0].covered = 1;
		this.replacementIncome[1].covered = 0;
		this.replacementIncome[2].covered = 0;
		this.customer.profile.collegeMaxYears = this.adjustCollegeYears([2, 2, 4])[scenario];
		this.customer.profile.payOffDebtsPercent = [0, .5, 1][scenario];
		this.customer.profile.payOffMortgagePercent = [0, .5, 1][scenario];
	},

	adjustCollegeYears: function (scenarios) {
		var costs = this.customer.assumptions.collegeCosts[this.customer.profile.collegeType];
		if (costs && costs.period == 2)
			for (var ix = 0; ix < scenarios.length; ++ix)
				scenarios[ix] = scenarios[ix] / 2;
		return scenarios;
	},

	// -------- If they have spouse but no kids ---------
	/*
	 Spouse < 36
	 Some of your income for 20 years

	 Some of your income for 30 years
	 Half your mortgage and debts

	 Half your income for 30 years
	 Half your mortgage and debt

	 Spouse < 46
	 Some of your income for 20 years

	 Half of your income for 20 years
	 Half your mortgage and debts

	 Half of your income for 30 years
	 Half your mortgage and debt

	 Spouse >45 & <56
	 Half your income for 10 years

	 Some of your income for 20 years
	 Half your mortgage and debt

	 Half of your income for 20 years
	 Half your mortgage and debt

	 Spouse >55
	 Some of your income for 10 years

	 Half of your income for 10 years
	 Half your mortgage and debt

	 Half of your income for 20 years
	 Half your mortgage and debt
	 */
	marriedNoKidsSettings: function(scenario){
		var yearsOfIncome = null;
		if(this.customer.alternateCustomer.person.age < 36){
			yearsOfIncome = [20, 30, 30][scenario];

			this.replacementIncome[0].covered = [0.25, 0.25, 0.5][scenario];
			this.replacementIncome[1].covered = [0.25, 0.25, 0.5][scenario];
		}
		else if(this.customer.alternateCustomer.person.age < 46){
			yearsOfIncome = [20, 20, 30][scenario];

			this.replacementIncome[0].covered = [0.25, 0.5, 0.5][scenario];
			this.replacementIncome[1].covered = [0.25, 0.5, 0.5][scenario];
		}
		else if(this.customer.alternateCustomer.person.age > 45 && this.customer.alternateCustomer.person.age < 56){
			yearsOfIncome = [10, 15, 20][scenario];

			this.replacementIncome[0].covered = [0.5, 0.5, 0.5][scenario];
			this.replacementIncome[1].covered = [0.5, 0.5, 0.5][scenario];
		}
		else if(this.customer.alternateCustomer.person.age > 55){
			yearsOfIncome = [10, 10, 20][scenario];

			this.replacementIncome[0].covered = [0.25, 0.5, 0.5][scenario];
			this.replacementIncome[1].covered = [0.25, 0.5, 0.5][scenario];
		}

		this.replacementIncome[2].covered = 0;
		this.customer.settings.retirementAge = this.customer.alternateCustomer.person.age + yearsOfIncome;
		this.customer.profile.payOffDebtsPercent = [0, .5,.5][scenario];
		this.customer.profile.payOffMortgagePercent = [0, .5,.5][scenario];
	},

    getFriendlyPercent: function(percent) {
        var friendly = {0.25: "one quarter", 0.5: "half", 0.75: "most of", 1: "all"};
        return friendly[percent] || percent + "% of";
    },
    capitalize: function (str) {
        return str.substr(0, 1).toUpperCase() + str.substr(1);
    },
    getKey: function () {
        var key = "";
        var sep = "";
        for (var ix = 0; ix < arguments.length; ++ix) {
            key += (sep + JSON.stringify(arguments[ix]));
            sep = "-";
        }
        return key;
    },
    adjustScenario: function (scenario) {
        if (scenario > 0 && this.scenarioDescriptions[scenario - 1]) {
            this.scenarioDescriptions[scenario - 1][0].match(/A ([A-Za-z]+) amount/);
            var bghPrevious = RegExp.$1;
            if (this.scenarioNPVReplacementIncome[scenario]  == this.scenarioNPVReplacementIncome[scenario - 1])
                this.scenarioDescriptions[scenario][0] =
                    this.scenarioDescriptions[scenario][0].replace(/A ([A-Za-z]+) amount/, "A " + bghPrevious + " amount");
        }
    },
	/**
	 * Return a cashflow matrix with rows as follows:
	 * 0
	 *
	 * @param deceased
	 * @param groupItems
	 * @param suppressIncome
	 * @return {Object}
	 */
	getCashFlow: function(alternateDeceased, groups, suppressIncome, allowSurplus, yearOfDeath, override, scenario)
	{
		yearOfDeath = yearOfDeath ? yearOfDeath : 0;
		var key = this.getKey("getCashFlow", alternateDeceased, groups, suppressIncome, allowSurplus, yearOfDeath,
            override, scenario, this.customer.primaryCustomer.overrideAmount, this.customYearsToPayDebt,
            this.customReplacementIncome1, this.customReplacementIncome2,
            this.customLeaveTheNestAge, this.customCollegeMaxYears, this.customPayOffDebtsPercent, this.customRetirementAge);
   		if (this.cache[key])
			return this.cache[key];

		this.resetOrder();

		var years = [];
		var types = [];
		var npvs = [];
		var incomes = [];
		var details = {};
		var descriptions = [];
		var deceased = alternateDeceased ?
			this.customer.alternateCustomer : this.customer.primaryCustomer;
		this.startTime = (new Date()).getTime();

		// Set scenario only if face and term need to be computed.
		this.saveScenario();
        var quickQuote = this.customer.primaryCustomer.overrideAmount > 0;
		if(!this.customer.primaryCustomer.overrideAmount) {
			this.setScenario(scenario);
		}

        // Add up total liabilities
        var liabilities = 0

        for (var ix = 0; ix < this.liabilities.length; ++ix) {
            var liability = this.liabilities[ix];
            liabilities += this.liabilities[ix].getStartingFlow(deceased).amount;
        }
        // Add up your assets
        var assets = 0;
        for (var ix = 0; ix < this.assets.length; ++ix)
            if (!this.assets[ix].inCashFlow() && this.assets[ix].isActive(deceased))
                assets += this.assets[ix].getStartingFlow(deceased).amount;

        // Handle overrides
		var amount = override || this.customer.primaryCustomer.overrideAmount;
		if (amount) {
			if (yearOfDeath >= this.customer.primaryCustomer.overrideTerm)
				amount = 0;
            if (!quickQuote) {
                amount -= assets;
                //amount += liabilities;
            }

            // Override amount should be rounded to the nearest 1K, otherwise
            // round to nearest 50k
            var insuranceNeededRounded;
            if(this.customer.primaryCustomer.overrideAmount) {
                insuranceNeededRounded = Math.round((Math.max(0, amount)) / 1000) * 1000;
            }else{
                insuranceNeededRounded = Math.round((Math.max(0, amount)) / 50000) * 50000;
            }

			var flow = {
				enabled: false,
                incomeReplacement: 0,
				insuranceNeeded: alternateDeceased ? 0 : amount,
				insuranceNeededRounded :  alternateDeceased ? 0 : insuranceNeededRounded,
				overrideTerm: this.customer.primaryCustomer.overrideTerm,
                assets: quickQuote ? 0 : assets,
                liabilities: quickQuote ? 0 : liabilities,
                cashNeeded: 0
			}
			this.cache[key] = flow;

			this.restoreScenario();
			return flow;
		}

        // Get each cashflow group
		var flowGroups = [
			{group: "children", title: "College", flow: this.sendKidsToCollege ? this.children : []},
			{group: "income", title: "Salary", flow: this.earnedIncome},
			{group: "living", title: "Money to live on", flow: [this.replacementIncome[0],this.replacementIncome[1]]},
			{group: "retirement", title: "Money for retirement", flow: [this.replacementIncome[2]]},
			{group: "extraincome", title: "Extra Income", flow: this.income},
			{group: "extraexpenses", title: "Extra Expenses", flow: this.expenses},
			{group: "assets", title: "401K", flow: this.getAssets('401K')}
		];

		// Remove empty/inactive cashflowss
		for (var ix = 0; ix < flowGroups.length; ++ix)
			if (flowGroups[ix].flow.length == 0)
				flowGroups.splice(ix, 1);
			else {
				var active = false;
				for (var jx = 0; jx < flowGroups[ix].flow.length; ++jx) {
					var flow = flowGroups[ix].flow[jx];
					if (flow.isActive(deceased) && flow.inCashFlow(deceased) && !(suppressIncome && flow.isIncome()))
						active = true;
				}
				if (!active)
					flowGroups.splice(ix, 1);
			}

		// Walk through cash flow groups and accumulate amounts
		var amounts = [];
        var maxGroup = {};
		for (var gx = 0; gx < flowGroups.length; ++gx)
		{
			var flows = flowGroups[gx].flow;          // Array of cash flow items
			amounts[gx] = [];

			// Walk through cash flow items
			for (var sgx = 0; sgx < flows.length; ++sgx)
			{
				var flow = flows[sgx].getFlow(deceased, yearOfDeath);
                amounts[gx][sgx] = flow.amounts;
                // See if we have groups for finding max value
                if (flows[sgx].maxGroup) {
                    if (!maxGroup[flows[sgx].maxGroup])
                        maxGroup[flows[sgx].maxGroup] = [];
                    maxGroup[flows[sgx].maxGroup].push(amounts[gx][sgx])
                }

				if (!details[flows[sgx].type])
					details[flows[sgx].type] = {}
				if (!details[flows[sgx].type][flows[sgx].subtype])
					details[flows[sgx].type][flows[sgx].subtype] = [];
				details[flows[sgx].type][flows[sgx].subtype].push(flow.details);
			}
		}
        // Process any groups where you have to take the maximum within the group
        for (var groupKey in maxGroup) {
            var groupItems = maxGroup[groupKey];
            // Go through each year
            for (var ix = 0; ix < groupItems[0].length; ++ix) {
                // Find maximum value of any item
               var max = 0;
               for (var jx = 0; jx < groupItems.length; ++jx)
                   max = Math.max(groupItems[jx][ix], max);
                // Kill anything lower than the max
               for (var jx = 0; jx < groupItems.length; ++jx)
                   groupItems[jx][ix] = groupItems[jx][ix] < max ? 0 : groupItems[jx][ix];
            }
        }

		// Walk through cashflow groups
		for (var yix = 0; yix < this.getLastYear(deceased); ++yix)
		{
			// Walk through cash flow groups
			var ix = 0;
			var items = [];                   // Cash flow item amounts
			for (var gx = 0; gx < flowGroups.length; ++gx)
			{
				var flows = flowGroups[gx].flow;   // Array of cash flow items

				var groupItems = groups && groups.match(flowGroups[gx].group);

				if (groupItems)
					items[ix] = 0;       // Zero total if grouping
				var groupFound = false;

				// Walk through cash flow items
				for (var sgx = 0; sgx < flows.length; ++sgx)
				{
					var flow = flows[sgx];      // cash flow item
					if (flow.isActive(deceased) && flow.inCashFlow(deceased) && !(suppressIncome && flow.isIncome()))

					// Total by group or just add to result
						if (groupItems) {
							types[ix] = flow.type;
							incomes[ix] = flow.inCashFlow();
							items[ix] += amounts[gx][sgx][yix];
							descriptions[ix] = flowGroups[gx].title;
							groupFound = true;
						} else {
							types[ix] = flow.type;
							items[ix] = amounts[gx][sgx][yix];
							incomes[ix] = flow.inCashFlow();
							descriptions[ix] = flow.getDescription(deceased);
							++ix;
						}
				}
				if (groupItems && groupFound)
					++ix;
			}
			var deficit = 0;
			for (var dix = 0; dix < items.length; ++dix)
				deficit += items[dix];
			if (Assumptions.allowSurplus)
				years[yix] = {items: items, deficit: deficit, year: yix};
			else
				years[yix] = {items: items, deficit: Math.min(0, deficit), year: yix};
		}

		// Get imputed savings
		var earnedIncome = this.earnedIncome[alternateDeceased ? 1 : 0];
		var age = earnedIncome.applicant.person.age;
		var retirementAge = this.customer.settings.retirementAge;
		var savings = 0;

		// Go back in time using salary increase rate
		var earnings = earnedIncome.amount;
		var currentYear = (new Date()).getFullYear();
		var firstYearWorking = currentYear - earnedIncome.yearsWorked + yearOfDeath;
		while (currentYear-- >= firstYearWorking) {
			earnings = earnings - earnings * earnedIncome.increase;
		}

		// Go forward to the year of death
        if (this.includeImputedSavings) {
            var earnings = earnedIncome.amount;
            for (; currentYear < (new Date()).getFullYear() + yearOfDeath; ++currentYear) {
                earnings = earnings + earnings * earnedIncome.increase;
                savings += earnings * this.customer.assumptions.savingsRate;
                savings += savings * this.customer.settings.discountRate;
            }
        }

		// Calculate NPVs
		var npvs = [];
		for (var nix = 0; nix <= types.length; ++nix)
			npvs[nix] = 0;
		for (var yix = yearOfDeath; yix < this.getLastYear(deceased); ++yix) {
			var yearsPassed = yix - yearOfDeath;
			for (var nix = 0; nix < types.length; ++nix)
				npvs[nix] += years[yix].items[nix] /
					         Math.pow((1 + this.customer.settings.discountRate), yearsPassed + 1);
			npvs[nix] += years[yix].deficit /
				         Math.pow((1 + this.customer.settings.discountRate), yearsPassed + 1);
		}
        var need = 0;
        for (var ix = 0; ix < descriptions.length; ++ix)
            if (descriptions[ix].match(/need/i))
                need = npvs[ix] * -1;

		this.endTime = (new Date()).getTime();
		this.flows = (this.flows ? this.flows + 1 : 1);

		// Start with NPV of income needs
		var cashPosition = npvs[npvs.length - 1];
		var adjustedCashPosition = cashPosition;

		adjustedCashPosition -= liabilities;

		adjustedCashPosition += assets;
        if (this.includeImputedSavings)
		    adjustedCashPosition += savings;
/**
		// No work no deficit
		if (this.customer.profile.relationship != 'single' || this.customer.profile.numberOfChildren > 0) {
			if (this.earnedIncome[alternateDeceased ? 1 : 0].amount == 0)
				adjustedCashPosition = 0;
		} else {
			if (alternateDeceased)
				adjustedCashPosition = 0;
		}
**/		var flow = {
			enabled: true,
            incomeReplacement: need,
			types: types,
			years: years,
			npvs: npvs,
			isActive: incomes,
			descriptions: descriptions,
			amounts: amounts,
			insuranceNeeded: deceased.policyHidden ? 0 : Math.max(0, 0 - adjustedCashPosition),
			insuranceNeededRounded : deceased.policyHidden ? 0 : Math.round((Math.max(0, 0 - adjustedCashPosition)) / 50000) * 50000,
			cashNeeded: cashPosition,
			assets: assets + (this.includeImputedSavings ? savings : 0),
			liabilities: liabilities,
			details: details
		}
		this.cache[key] = flow;
        this.restoreScenario();

        return flow;
	},
	getFace: function (isAlternate, scenario, setMaxIncomeReplacement) {
		var face = 0;
        var replacement = 0;
		for (var ix = 0; ix < this.customer.assumptions.maxTermLength; ++ix) {
            var cashFlow = this.getCashFlow(isAlternate, null, null, null, ix, null, scenario);
            if (face < cashFlow.insuranceNeededRounded) {
                face = cashFlow.insuranceNeededRounded;
                replacement = cashFlow.incomeReplacement;
            }
        }
        if (setMaxIncomeReplacement)
            this.scenarioNPVReplacementIncome[scenario] = replacement;
		return face;
	},
	getOverTime: function (interval, face, scenario) {
		if (this.cache["getOverTime" + interval + face])
			return this.cache["getOverTime" + interval]
		var series = [];
		for (var ix = 0; ix < 2; ++ix) {
			series[ix] = {
				label: (ix == 0) ? this.customer.primaryCustomer.firstName :
								   this.customer.alternateCustomer.firstName,
				data: []
			};
			for (var jx = 0; jx < 31; jx += (interval ? interval : 1))
				series[ix].data[jx] =
					this.getCashFlow(ix == 0 ? false : true, null, null, null, jx, face, scenario).insuranceNeededRounded;
		}
		this.cache["getOverTime" + interval] = series;
		return series;
	},
	getTerm: function (alternateDeceased, scenario) {
		alternateDeceased = (typeof(alternateDeceased) != 'undefined') ? alternateDeceased :
			this.customer.customerSelection > 0 ? true : false;
		if (this.cache["getTerm" + alternateDeceased + scenario])
			return this.cache["getTerm" + alternateDeceased + scenario]
		var terms = [];
		var maxCost = 0;
		// Find the amount needed in future years
		var cx = 0;
		for (var jx = 0; jx < this.customer.assumptions.maxTermLength; jx += 5) {
			var cost = 0;
			for (var kx = jx; kx < jx + 5; ++ kx) {
				var flow = this.getCashFlow(alternateDeceased, null, null, null, kx, null, scenario);
				if(flow.overrideTerm){
					return flow.overrideTerm;
				}
				cost = Math.max(cost, (flow.insuranceNeeded - flow.liabilities));
			}
			terms[cx++] = {term: jx + 5, amount: cost};
			if (cost > maxCost)
				maxCost = cost;
		}
		if (maxCost == 0)
			return 0;
		var term = 5;
		for (var ix = 0; ix < terms.length;  ++ix) {
			if (terms[ix].amount > 0 && terms[ix].term > term)
				term = terms[ix].term;
		}

		// From needs spec - If 5 year recommended and any amount $100k or greater round to 10 years.
		// 5/27/2015 - If 5 year recommended round to 10 years period.
		//var maxCostRound = Math.round((Math.max(0, maxCost)) / 50000) * 50000;
		//if(term == 5 && maxCostRound >= 100000){
		//	term = 10;
		//}
		var maxCostRound = Math.round((Math.max(0, maxCost)) / 50000) * 50000;
		if(term == 5){
			term = 10;
		}
		if (term == 25)
			term = 30;
		this.cache["getTerm" + alternateDeceased + scenario] = term;

		return term;
	},
	getPercents: function()
	{
		var result = [];
		var cashflows = [this.getCashFlow(true, "children|living|retirement", true),
						 this.getCashFlow(false, "children|living|retirement", true)];
		var total = 0;
		var totals = {};
		var liabilityGroups = {};

		// Start with debt
		for (var ix = 0; ix < this.liabilities.length; ++ix) {
			var liability = this.liabilities[ix];
			total += liability.amount;
			liabilityGroups[liability.subtype] = liabilityGroups[liability.subtype] ?
				liabilityGroups[liability.subtype] + liability.amount : liability.amount;
		}

		// Total up other nvps and catagorize them
		for (var cx = 0; cx < 2; ++cx)
		{
			var cashflow = cashflows[cx];

			// Get total combined coverage
			for (var ix = 0; ix < cashflow.descriptions.length; ++ix)
			{
				total += Math.abs(cashflow.npvs[ix]);

				// Slot in various metrics
				var metric = cashflow.descriptions[ix];
				totals[metric] = totals[metric] ? totals[metric] + cashflow.npvs[ix] : cashflow.npvs[ix];
			}

		}

		// Get percents for each metric of total
		for (var metric in totals)
			result.push({
				label: metric,
				amount: totals[metric],
				percent: Math.abs(totals[metric]) * 100 / total});


		// Sum up the liabilities
		var debt = 0;

		for (liability in liabilityGroups)
			if (liabilityGroups[liability] > 0)
				debt += Math.abs(liabilityGroups[liability]);

		if (debt > 0)
			result.push({
				label: "Pay Debts",
				amount: debt,
				percent: 100 * debt / total});

		return result;
	},

    // Detailed diagnostic cash flow
	flowYear:       {isLocal: true, type: Number, value: 0},
    biggestFlowYear:       {isLocal: true, type: Number, value: 0},
    isPrimary:      {type: Boolean, value: true},
    getFlow: function() {
        return this.isPrimary ?
            this.getCashFlow(false, null, null, null, this.flowYear) :
            this.getCashFlow(true, null, null, null, this.flowYear);
    },
    getBiggestFlow: function () {
        var face = this.getFace(!this.isPrimary)
        for (var ix = 0; ix < this.customer.assumptions.maxTermLength; ++ix) {
            var flow = this.getCashFlow(!this.isPrimary, null, null, null, ix);
            if (face == flow.insuranceNeededRounded) {
                this.biggestFlowYear = ix;
                return flow;
            }
        }
        return [];
    }
});
return {
		CapitalNeeds: CapitalNeeds,
		Profile: Profile,
		CapitalNeeds: CapitalNeeds
	}
};


