module.exports.Expense = function (objectTemplate, getTemplate)
{

	var Expense = getTemplate('./CashFlow.js').Expense;
	var CashFlow = getTemplate('./CashFlow.js').CashFlow;

var ReplacementIncome = Expense.extend("ReplacementIncome",
	{
		stage:              {type: Number, value: 1},
		amount:             {type: Number, value: 0},
		covered:            {type: Number, value: 1, rules: ["percent"]},
		coveredValues:      {isLocal: true, type: Array, value:
			[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1,1.1,1.2,1.3,1.4,1.5]},
		coveredDescriptions: {isLocal: true, type: Object, value:
					{0:'None', 0.1:"10%", 0.2:"20%", 0.3:"30%", 0.4:"40%", 0.5:"50%", 0.6:"60%", 0.7:"70%", 0.8:"80%",
					 0.9:"90%", 1: "100%", 1.1: "110%", 1.2: "120%", 1.3: "130%", 1.4: "140%", 1.5: "150%"}},
		coveredOrder:        {isLocal: true, type: Array, value:
		[1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0]},

		init: function(capitalNeeds, stage, ratio, title) {
			Expense.call(this, capitalNeeds.customer, 0, 'replacement', title);
			this.stage = stage;
			this.capitalNeeds = capitalNeeds;
			this.covered = ratio;
		},
		isActive: function () {
			return this.covered > 0;
		},
		getStartingFlow: function (deceased)
        {
            var flow = CashFlow.prototype.getStartingFlow.call(this, deceased);

            var deceasedIncomeIx = deceased == this.customer.primaryCustomer ? 0 : 1;
            var survivorIncomeIx = deceasedIncomeIx ? 0 : 1;
            var deceasedIncome = this.capitalNeeds.earnedIncome[deceasedIncomeIx].amount * .66;
            var survivorIncome = this.capitalNeeds.earnedIncome[survivorIncomeIx].amount * .66;

            if (this.customer.assumptions.percentIsOfBothIncomes)
                flow.amount = (deceasedIncome + survivorIncome) * this.covered;
            else
                flow.amount = deceasedIncome * this.covered + survivorIncome;
			return flow;
		},
		getAmount: function (flow, year, deceased, yearOfDeath) {

			if (year < yearOfDeath)
				return 0;

			var assumptions = this.customer.assumptions;
			var stage = 0; // default nothing
			if (this.capitalNeeds.children.length > 0) {
				if (year < this.capitalNeeds.getLeaveTheNestYear())
					stage = 1;
				else if (year < this.capitalNeeds.getRetirementYear(deceased))
					stage = this.customer.profile.relationship == 'single' ? 0 : 2;
				else
					stage = 3;
			} else {
				if (year < this.capitalNeeds.getRetirementYear(deceased))
					stage = 2;
				else
					stage = 3;
			}
			if (stage == this.stage)
				return  0 - flow.amount;
			else
				return 0;
		},
			getDescription: function() {
                var stages = ["", "w/kids", "after", "retired"]
			return "Need " + stages[this.stage];
		}
	});


var Children = Expense.extend("Children",
{
	age:				{type: Number, value: 2, rule: ["numeric"], validate:"isWithin(0, 21)"},
	name:               {type: String, value: ""},

	init: function(customer, age) {
		Expense.call(this, customer, 'children', 1, "College");
		this.age = age;
	},
	isActive: function () {
		return this.customer.profile.collegeType != 'none';
	},

	getEndYear: function() {
		var costs = this.customer.assumptions.collegeCosts[this.customer.profile.collegeType];
		return this.getStartYear() + Math.min(this.customer.profile.collegeMaxYears, costs.period) - 1;
	},
	calculateCost: function () {
		if (this.customer.profile.collegeType == 'none') {
			this.period = 4;
			this.amount = 0;
			return;
		}
		var costs = this.customer.assumptions.collegeCosts[this.customer.profile.collegeType];
		var profile = this.customer.profile;
		this.period = costs.period;
		this.amount = profile.getCollegeCost();
	},

	getStartYear: function() {
		return Math.max(this.customer.assumptions.startCollege - this.age, 0);
	},
	getDescription: function() {
		return "College<br />" + this.getChildSequence();
	},
	getChildSequence: function() {
		for (var ix = 0; ix < this.customer.capitalNeeds.children.length; ++ix)
			if (this.customer.capitalNeeds.children[ix] == this)
				return "chld" + (ix+1);
	},
	getFutureValue: function () {
		this.calculateCost();
		if (this.amount == 0)
			return 0;
		var total = 0;
		for (var year = this.getStartYear(); year <= this.getEndYear(); ++year)
			total += this.amount * Math.pow(1 + this.customer.settings.collegeInflation, year);
		return total
	},
	getStartingFlow: function (deceased) {
		this.calculateCost();
		return CashFlow.prototype.getStartingFlow.call(this, deceased);
	},
	adjustFlow: function (flow) {
		flow.amount += flow.amount * this.customer.settings.collegeInflation;
	}
});

var HealthCare = Expense.extend("HealthCare",
{
	singleCost: {type: Number, rule: ["currency"]},
	familyCost: {type: Number, rule: ["currency"]},
	init: function (customer) {
		Expense.call(this, customer, 'healthcare', 0, "Health Care");
		this.calculateCosts();
	},
	isActive: function (deceased) {
		return this.inCashFlow(deceased);
	},
	inCashFlow: function (deceased) {
		return !this.customer.capitalNeeds.earnedIncome[deceased == this.customer.primaryCustomer ? 1 : 0].hasHealthCare;
	},
	resetCosts:      function () {
		this.calculateCosts(true)
	},
	calculateCosts: function (force) {
		if (force || this.singleCost == null || typeof(this.singleCost) == 'undefined') {
			this.singleCost = this.customer.assumptions.healthCareCosts[this.customer.profile.state][0];
			this.familyCost = this.customer.assumptions.healthCareCosts[this.customer.profile.state][1];
		}
	},
	getSingleCost: function () { this.calculateCosts();return this.singleCost;},
	getFamilyCost: function () { this.calculateCosts();return this.familyCost},
	getStartingFlow: function (deceased) {
		var flow = CashFlow.prototype.getStartingFlow.call(this, deceased);
		this.calculateCosts();
		flow.amount = [this.singleCost, this.familyCost ];
		return flow
	},
	getAmount: function (flow, year, deceased, yearOfDeath) {
		if (year < yearOfDeath)
			return 0;
		if (year > flow.endYear)
			return 0;
		return 0 - (flow.amount[year > this.customer.capitalNeeds.getLeaveTheNestYear() ? 0 :
			(this.customer.capitalNeeds.children.length > 0 ? 1 : 0)]);
	},
	adjustFlow: function (flow) {
		flow.amount[0] *= (1 + this.customer.settings.inflation);
		flow.amount[1] *= (1 + this.customer.settings.inflation);
	},
	getEndYear: function (deceased) {
		return this.customer.capitalNeeds.getMedicareYear(deceased);
	}
});
var ChildCare = Expense.extend("ChildCare",
	{
		youngCost:      {type: Number, rule: ["currency"], validate:"isWithin(0, 200000)"},
		oldCost:        {type: Number, rule: ["currency"], validate:"isWithin(0, 200000)"},
		youngAge:       {type: Number},
		youngAgeValues:   {isLocal: true, type: Object, value:
						{2: '2', 3: '3', 4: '4', 5: '5', 6: '6'}},
		oldAge:         {type: Number},
		oldAgeValues:   {isLocal: true, type: Object, value:
						{12: '12', 13: '13', 14: '14', 15: '15', 16: '16', 17: '17', 18: '18'}},

		init: function (customer) {
			Expense.call(this, customer, 'childcare', 0, "Child Care");
			this.calculateCosts();
		},
		isActive: function (deceased) {
			return this.inCashFlow(deceased);
		},
		inCashFlow: function (deceased) {
			return this.customer.capitalNeeds.earnedIncome[deceased == this.customer.primaryCustomer ? 1 : 0].needsChildCare;
		},
		resetCosts:      function () {
			this.calculateCosts(true)
		},
		calculateCosts:  function (force) {
			if (force || !this.youngAge) {
				var costs = this.customer.assumptions.childCareCosts;
				var range = this.customer.assumptions.childCareCostStates[this.customer.profile.state];
				this.youngCost = costs[0].range[range];
				this.oldCost = costs[1].range[range];
				this.youngAge = costs[0].maxAge;
				this.oldAge = costs[1].maxAge;
			}
		},
		getYoungCost: function () {this.calculateCosts(); return this.youngCost},
		getOldCost: function () {this.calculateCosts(); return this.oldCost},
		getYoungAge: function () {this.calculateCosts(); return this.youngAge},
		getOldAge: function () {this.calculateCosts(); return this.oldAge},
		getStartingFlow: function (deceased)
		{
			var flow =  CashFlow.prototype.getStartingFlow.call(this, deceased);
			this.calculateCosts();
			flow.kids = [];
			for (var ix = 0; ix < this.customer.capitalNeeds.children.length; ++ ix) {
				flow.kids[ix] = [];
				flow.kids[ix][0] = this.youngCost;
				flow.kids[ix][1] = this.oldCost;
			}
			return flow;
		},
		getAmount: function (flow, year, deceased, yearOfDeath) {
			if (year < yearOfDeath)
				return 0;
			var ageRange = this.customer.assumptions.childCareCosts;
			var total = 0;
			for (var ix = 0; ix < flow.kids.length; ++ ix)
				for (var jx = 0; jx < flow.kids[ix].length; ++jx) {
					var minAge = jx == 0 ? 0 : this.youngAge;
					var maxAge = jx == 0 ? this.youngAge : this.oldAge;
					if (year + this.customer.capitalNeeds.children[ix].age > minAge &&
						year + this.customer.capitalNeeds.children[ix].age <= maxAge)
						total -= Math.floor(flow.kids[ix][jx]);
				}
			return total;
		},
		adjustFlow: function (flow) {
			for (var ix = 0; ix < flow.kids.length; ++ ix)
				for (var jx = 0; jx < flow.kids[ix].length; ++jx)
					flow.kids[ix][jx] += flow.kids[ix][jx] * this.customer.settings.inflation;
		}
	});

	return {
		ReplacementIncome: ReplacementIncome,
		Children: Children,
		HealthCare: HealthCare,
		ChildCare: ChildCare
}
};
