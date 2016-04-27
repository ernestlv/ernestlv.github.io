module.exports.CashFlow = function (objectTemplate, getTemplate)
{
	var Applicant = getTemplate('./customer/Applicant.js').Applicant;

	/**
 * CashFlow is the main root for the components of an overall cash flow
 *
 * @type {*}
 */
var CashFlow = objectTemplate.create("CashFlow",
	{
		type:				{type: String},
		bucket:				{type: String},
		subtype:            {type: String},
		title:				{type: String},
		amount:		        {type: Number, rule:["currency"], validate:"isWithin(0, 10000000)"},
        maxGroup:           {type: String},  // Group to take only maximum value

		init: function(customer, type, subtype, amount, title) {
			this.customer = customer;
			this.type = type;
			this.subtype = subtype || '';
			this.amount = amount || 0;
			this.title = title || '';
		},

		/**
		 * Determine whether subclasses should be included in the cash flow.
		 * Some liabilities can be treated as a cash flow vs one-time
		 *
		 * @return {Boolean}
		 */
		inCashFlow:     function() {
			return true
		},

		/**
		 * Determine whether subclasses should be included at all (has value)
		 *
		 * @return {Boolean}
		 */
		isActive: function () {
			return this.amount != 0;
		},

		/**
		 * Determine whether the item should be excluded in non-income flows
		 *
		 * @return {Boolean}
		 */
		isIncome: function () {
			return this.type == "income"
		},

		/**
		 * Get a description for the cash flow
		 *
		 * @return {String}
		 */
		getDescription: function() {
			return this.title;
		},

		/**
		 * Get the first year of the cash flow
		 *
		 * @return {Number}
		 */
		getEndYear: function(deceased) {
			return this.customer.capitalNeeds.getLastYear(deceased);
		},

		/**
		 * Get the last year of the cash flow
		 * @return {Number}
		 */
		getStartYear: function() {
			return 0;
		},

		/**
		 *
		 * Run through the cash flow and determine an array of amounts
		 *
		 * @param deceased - the person that died
		 * @return {Object} amount: array of amounts, detail: details of cash flow
		 */
		getFlow: function(deceased, yearOfDeath)
		{
			yearOfDeath = yearOfDeath ? yearOfDeath : 0;
			var amounts = [];
			var npv = 0;
			this.flow = this.getStartingFlow(deceased, yearOfDeath);
			for (var year = 0; year < this.customer.capitalNeeds.getLastYear(deceased); ++year) {
				amounts[year] = Math.floor(this.getAmount(this.flow, year, deceased, yearOfDeath));
				this.adjustFlow(this.flow, year, deceased,yearOfDeath);
			}
	    	return {
				amounts: amounts,
				details: this.flow
			}
		},

		/**
		 * Get a data structure that will contain an amount property that is cycled
		 * through the years of the cash flow
		 *
		 * @return {Object}
		 */
		getStartingFlow: function (deceased) {
			return {
				amount: this.amount,
				startYear: this.getStartYear(deceased),
				endYear: this.getEndYear(deceased)
			}
		},

		/**
		 * Inflate or deflate the flow
		 *
		 * @param flow
		 * @param year
		 * @param deceased - person that died
		 */
		adjustFlow: function (flow, year, deceased) {
			// Abstract
		},

		/**
		 * Compute the annual amount for the flow
		 *
		 * @param flow
		 * @param year
		 * @param deceased - person that died
		 */
		getAmount: function(flow, year, deceased, yearOfDeath) {
			if (year < yearOfDeath)
				return 0;
			return  (year >= flow.startYear && year <= flow.endYear) ? flow.amount : 0;
		}
	});

/**
 * A CashFlow that increases in value based on the inflation rate and is the
 * base class for more complex income abstrations
 *
 * @type {*}
 */
var Income = CashFlow.extend("Income",
{
	taxRate:			{type: Number, value: .33},

	init: function(customer, amount, subtype, title) {
		CashFlow.call(this, customer, "income", subtype || 'general', amount || 0, title || "");
	},

	getAmount:	function(flow, year, deceased, yearOfDeath) {
		return flow.amount - flow.amount * this.taxRate;
	},

	adjustFlow: function (flow) {
		flow.amount += flow.amount * this.customer.settings.inflation;
	}
});

var Expense = CashFlow.extend("Expensee",
{
	init: function(customer, subtype, amount, title) {
		CashFlow.call(this, customer, "expense", subtype, amount ? (0 - amount) : 0, title);
	},

	getAmount: function(flow, year, deceased, yearOfDeath)
	{
		if (year < yearOfDeath)
			return 0;

		return 0 - (year >= flow.startYear && year <= flow.endYear ? flow.amount : 0);
	},


	adjustFlow: function (flow) {
		flow.amount += flow.amount * this.customer.settings.inflation;
	}
});

var Asset = CashFlow.extend("Asset",
{
	init: function(customer, subtype, amount) {
		CashFlow.call(this, customer, "asset", subtype, amount);
	},

	subtype:            {type: String, value: "savings"},
	monthly:            {type: Number, value: 0},
	description:		{type: String},

	inCashFlow:     function() {
		return false
	}
});

var Insurance = Asset.extend("Insurance",
{
	years:              {type: Number, value: 20,  rule:["required"], validate: "isWithin(1, 100)"},

	type:               {type: String, value: 'term'},
	typeValues:         {isLocal: true, type: Object,
						 value: {"perm":"Permanent", "term":"Term", "work":"Work"}},
	year:               {type: Number, value: (new Date()).getFullYear(),  rule:["required", "numeric"],
		                 validate: "isWithin(1900, " + (new Date()).getFullYear() + ")" },

	forAlternate:       {type: Boolean, value: false},
	forAlternateValues: function() {
		return this.customer.profile.relationship == 'single' ? ['false'] : ['false', 'true'];
	},
	forAlternateDescriptions: function () {
		return {'false': this.customer.primaryCustomer.firstName,
			    'true':this.customer.alternateCustomer.firstName}
	},

	isPortable:         {type: Boolean, value: false},
	isPortableValues:  {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

	willReplace:        {type: Boolean, value: false},
	willReplaceValues:  {isLocal: true, type: Object, value: {"false":"No", "true": "Yes"}},

	company:            {type: String, rules:["text"], value: null},
	policyNumber:       {type: String, length: 20, rules:["text"], value: null},
	init: function(customer, amount, insured) {
		Asset.call(this, customer,  "insurance", amount);
		this.insured = insured;
	},
	isActive:         function(deceasedPerson) {
		return deceasedPerson == this.customer.alternateCustomer ? this.forAlternate : !this.forAlternate;
	}
});

// Liabilities are never in cash flow
var Liability = CashFlow.extend("Liability",
	{
		subtype:            {type: String, value: "loan"},
		amount:				{type: Number, value: 0, rule:["currency"]},

		init: function(customer, subtype, amount, title) {
			CashFlow.call(this, customer, "liability", subtype, amount, title);
		},

		inCashFlow:         function() {
			return false;
		},
        getStartingFlow: function () {
            if (this.subtype == 'mortgage')
                return {amount: this.amount * this.customer.profile.payOffDebtsPercent}
            if (this.subtype == 'loan')
                return {amount: this.amount * this.customer.profile.payOffMortgagePercent}
            return {amount: this.amount}
        }

});

return {
		CashFlow: CashFlow,
		Income: Income,
		Expense: Expense,
		Asset: Asset,
		Insurance: Insurance,
		Liability: Liability
}
};
