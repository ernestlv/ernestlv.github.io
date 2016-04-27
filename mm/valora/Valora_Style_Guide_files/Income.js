module.exports.Income = function (objectTemplate, getTemplate)
{
	var Income = getTemplate('./CashFlow.js').Income;
	var Asset  = getTemplate('./CashFlow.js').Asset;
	var Applicant = getTemplate('./customer/Applicant.js').Applicant;
	var CashFlow = getTemplate('./CashFlow.js').CashFlow;


	var EarnedIncome = Income.extend("EarnedIncome",
{
	amount:		        {type: Number, rule:["currency"], validate:"isWithin(0, 10000000)" },
	potential:		    {type: Number, rule:["currency"], validate:"isWithin(0, 10000000)", value: 0},
	incomeOption:       {type: String, value: 'none'},
	incomeOptionValues: {isLocal: true, type: Array, of: String, value: ["none", "work", "same"]},
	incomeOptionDescriptions: {isLocal: true, type: Object,
		value: {"none":"Not work at all", "work": "Earn a different amount ...",	"same":"Earn the same amount"}},
    works:              {type: Boolean, value: false},
    worksValues:        {isLocal: true, type: Object, value: {'true': "Yes", 'false': 'No'}},
	deceasedAmount:     {type: Number,  rule:["currency"], validate:"isWithin(0, 10000000)", value: 0},
	increase:		    {type: Number, value: 0},
	yearsWorked:        {type: Number, value: 1},
	applicant:			{type: Applicant},
	hasHealthCare:      {type: Boolean, value: false},
	/*hasHealthCareValues:    {isLocal: true, type: Object,
							value: {'false' : 'Need money for healthcare', 'true': 'Get healthcare from work'}},*/
    hasHealthCareValues:    {isLocal: true, type: Object,
                            value: {'false' : 'will need to buy health insurance', 'true': 'won\'t need to buy health insurance'}},
	needsChildCare:       {type: Boolean, value: false},
	needsChildCareValues:   {isLocal: true, type: Object,
							value: {'false' : 'Not need money for childcare', 'true': 'Need money for childcare'}},

	init: function(customer, person, amount) {
		Income.call(this, customer, amount, 'earnings');
		this.applicant = person;
		this.ageTrigger();
		this.potentialTrigger();

	},
	reset: function (){
		this.amount = 0;
		this.potential = 0;
		this.incomeOption = 'none';
		this.works = false;
		this.hasHealthCare = false;
		this.needsChildCare = false;
	},
	isActive: function(deceased) {
		return this.inCashFlow(deceased);
	},
	inCashFlow: function(deceased) {
		return this.getIncome(deceased) > 0;
	},
	ageTrigger: function() {
		this.yearsWorked = Math.max(1, this.applicant.person.age - 25);
	},
    worksTrigger: function () {
        if (this.works) {
            this.needsChildCare = true;
            this.hasHealthCare = true;
        } else {
            this.needsChildCare = false;
            this.hasHealthCare = false;
        }
    },
	deceasedAmountTrigger: function () {
		if (!controller.previous_value && controller.value || controller.previous_value && !controller.value)
			this.hasHealthCare =  this.deceasedAmount > this.customer.assumptions.healthCareSalaryThreshold;
	},
	incomeOptionTrigger: function () {
		this.hasHealthCare =  (this.amount > this.customer.assumptions.healthCareSalaryThreshold);
		this.needsChildCare = this.incomeOption != 'none';
	},
	defaultIncomeOptions: function () {
		if (this.amount > 0) {
			if (this.incomeOption != 'work')
				this.incomeOption = "same";
		} else
			this.incomeOption = 'none';
		this.deceasedAmount = this.amount;
	},
	defaultCaregiver: function () { // Tobe obsolete
		if (this.customer.capitalNeeds.children.length == 0)
			return;
		var values = {
			"00": 'both',
			"10": 'alternate',
			"01": 'primary',
			"11": 'other'
		};
		if (this.customer.profile.relationship == 'single')
			var matrix = (this.customer.capitalNeeds.earnedIncome[0].amount > 0 ? "1" : "0") + "1";
		else
			var matrix = (this.customer.capitalNeeds.earnedIncome[0].amount > 0 ? "1" : "0") +
				(this.customer.capitalNeeds.earnedIncome[1].amount > 0 ? "1" : "0");
		this.customer.profile.childCareGiver = values[matrix];
	},

	potentialTrigger: function() {
		if (this.amount > 0)
			this.increase = this.getSalaryIncrease(this.amount, this.potential, 10);
	},
	getStartingFlow: function (deceased) {
		var flow = CashFlow.prototype.getStartingFlow.call(this, deceased);
		flow.amount = this.getIncome();
		return flow;
	},
	getIncome: function (deceased) {
		if (deceased == this.applicant)
			return 0;
		return this.incomeOption == 'same' ? this.amount : this.incomeOption == 'none' ? 0 : this.deceasedAmount;
	},
	getAmount: function (flow, year, deceased, yearOfDeath) {
		return ((year < yearOfDeath) || ((this.applicant.person.age + year) < this.customer.settings.retirementAge)) ?
			flow.amount * (1 - this.taxRate) : 0;
	},

	getDescription: function () {
		return this.applicant == this.customer.primaryCustomer ? 'Your income' : 'Spouse Income';
	},

	getSalaryIncrease: function(presentAmount, futureAmount, years) {
		return Math.pow(futureAmount / presentAmount, 1 / years) - 1;
	},
	getSalaryPotential: function (presentAmount, increase, years) {
		var total = presentAmount;
		for (var ix = 0; ix <= years; ++ix)
			total += total * increase;
		return total;
	}

});

var SSN = Income.extend("SSN",
{
	earnedIncome: {type: EarnedIncome},
	applicant:       {type: Applicant},

	init: function(earnedIncome, person) {
		Income.call(this, earnedIncome.customer, 0, 'ssn')
		this.applicant = person;
		this.earnedIncome = earnedIncome;
		this.calculationDetails = {};
        this.maxGroup = "SSN";  // Only take max when two people's at play
	},

	isActive: function() {
		return this.earnedIncome.amount > 0;
	},
	getStartingFlow: function(deceased, yearOfDeath) {

		/*
			This is my best guess at how to calculate this based on the various SSA web site pages
			There are some assumptions about inflating bend points and the index and ratios used
			to compute PIA that all assume an SSN COLA rate
		 */


		// Earned income for survivor that will reduce family benefit


		var survivorEarnedIncome = (deceased == this.customer.primaryCustomer) ?
			this.customer.capitalNeeds.earnedIncome[1] : this.customer.capitalNeeds.earnedIncome[0];
		/*
		var ei = this.customer.capitalNeeds.earnedIncome;
		if (!ei)
			alert('earned income missing');
		if (deceased == this.customer.primaryCustomer)
			var survivorEarnedIncome = ei[1];
		else
			var survivorEarnedIncome = ei[0];
		*/
		// http://www.ssa.gov/pubs/10070.html#a0=0 and http://www.ssa.gov/oact/cola/Benefits.html
		var age = this.earnedIncome.applicant.person.age;
		var retirementAge = this.customer.settings.retirementAge;
		var earningsHistory = [];

		// Bend points for benefit and max calculation http://www.ssa.gov/oact/cola/bendpoints.html
		var PIABendPoints = [];
		for (var ix = 0; ix < this.customer.assumptions.PIABendPoints.length; ++ix)
			PIABendPoints[ix] = this.customer.assumptions.PIABendPoints[ix];
		var FMBendPoints = [];
		for (var ix = 0; ix < this.customer.assumptions.FMBendPoints.length; ++ix)
			FMBendPoints[ix] = this.customer.assumptions.FMBendPoints[ix];

        // Inflate them in case we don't update the table in subsequent years
        var year = this.customer.assumptions.bendPointYear;
        while(year++ < (new Date()).getFullYear()) {
            this.inflateBendPoints(PIABendPoints);
            this.inflateBendPoints(FMBendPoints);
        }

		// Go back in time using salary increase rate and compute as per http://www.ssa.gov/pubs/10070.html#a0=0
		var earnings = this.earnedIncome.amount;
		var currentYear = (new Date()).getFullYear();
		var firstYearWorking = currentYear - this.earnedIncome.yearsWorked + yearOfDeath;
		while (currentYear-- >= firstYearWorking) {
			earningsHistory.splice(0, 0, Math.min(this.customer.assumptions.ssnTable[currentYear][0], earnings) *
				this.customer.assumptions.ssnTable[currentYear][1]);
			earnings = earnings - earnings * this.customer.settings.inflation;
		}

		// Go forward to the year of death
		var earnings = this.earnedIncome.amount;
		for (var currentYear = currentYear = (new Date()).getFullYear();
		     currentYear < (new Date()).getFullYear() + yearOfDeath; ++currentYear)
		{
			earningsHistory.push(Math.min(this.customer.assumptions.ssnTable[currentYear][0], earnings) *
					this.customer.assumptions.ssnTable[currentYear][1]);
			earnings = earnings + earnings * this.customer.settings.inflation;
			this.inflateBendPoints(PIABendPoints);
			this.inflateBendPoints(FMBendPoints);
		}

		// Take up to the last 35 years and compute PIA and get family maximum
		var totalIndexedAmount = 0;
        var totalMonths = 0;
		for (var ix = earningsHistory.length - 1; ix >= Math.max(0, earningsHistory.length - 35); --ix) {
            totalIndexedAmount += earningsHistory[ix];
            totalMonths += 12;
        }
		var PIA  = this.getWithBendPoints(totalMonths ? totalIndexedAmount / totalMonths : 0, PIABendPoints, [.90,.32,.15])
		var familyMaximum =  this.getWithBendPoints(PIA, FMBendPoints, [1.5, 2.72, 1.34, 1.75]);

		// Go forward to retirement if you ain't dead
		if (deceased != this.applicant) {
			var currentYear = (new Date()).getFullYear() + yearOfDeath;
			var retirementYear = currentYear + Math.max(0, retirementAge - age);
			while (++currentYear < retirementYear) {
				earningsHistory.push(Math.min(this.customer.assumptions.ssnTable[currentYear][0], earnings) *
					this.customer.assumptions.ssnTable[currentYear][1]);
				earnings = earnings + earnings * this.customer.settings.inflation;
				this.inflateBendPoints(PIABendPoints);
			}
		}

		// Take last 35 years to get benefit amount at retirement (PIA)
		var totalIndexedAmount = 0;
        var totalMonths = 0;
		for (var ix = earningsHistory.length - 1; ix >= Math.max(0, earningsHistory.length - 35); --ix) {
            totalIndexedAmount += earningsHistory[ix];
            totalMonths += 12;
        }
		var PIA  = this.getWithBendPoints(totalMonths ? totalIndexedAmount / totalMonths : 0, PIABendPoints, [.90,.32,.15])

		return {
			amount: PIA,
			startYear: this.getStartYear() + (yearOfDeath ? yearOfDeath : 0),
			endYear: this.getEndYear(),
			age: age,
			retirementAge: this.customer.assumptions.SSNAge,
			earnedIncome: survivorEarnedIncome,
			earnedIncomeFlow: survivorEarnedIncome.getStartingFlow(deceased),
			familyMaximum: familyMaximum
		};
	},
	getDescription: function () {
		return this.earnedIncome.applicant == this.customer.primaryCustomer ? 'Your SSN' : 'Spouse SSN';
	},
	inflateBendPoints: function (points) {
		for (var ix = 0; ix < points.length; ++ix)
			points[ix] += points[ix] * this.customer.assumptions.ssnCOLA;
	},
	getWithBendPoints: function (amount, points, percent) {
		var sum = 0;
		var point = 0;
		for (var ix = 0; ix < percent.length; ++ix) {
			sum += Math.max(0, (Math.min((points[ix] ? points[ix] : 99999999), amount) - point)) * percent[ix];
			point = points[ix];
		}
		return sum;
	},
	getAmount: function(flow, year, deceased, yearOfDeath)
	{
		if (year < yearOfDeath)
			return 0;

		var retirementBenefit = (flow.age + year) < flow.retirementAge ? 0 : flow.amount;

		// If deceased determine survivor benefits http://www.ssa.gov/pubs/10084.html#a0=2
        var survivor = deceased == this.customer.primaryCustomer ? this.customer.alternateCustomer : this.customer.primaryCustomer;
		if (deceased == this.earnedIncome.applicant) {

			// Find total children under the age of 19
			var kidsUnder19 = 0;
			for (var ix = 0; ix < this.customer.capitalNeeds.children.length; ++ ix)
				if (year + this.customer.capitalNeeds.children[ix].age < 19)
					kidsUnder19 ++;

            // Find total children under the age of 19
            var kidsUnder16 = 0;
            for (var ix = 0; ix < this.customer.capitalNeeds.children.length; ++ ix)
                if (year + this.customer.capitalNeeds.children[ix].age < 16)
                    kidsUnder16 ++;

            // 75% of benefit for each kid under 19
			var childBenefit = (flow.amount * .75) * kidsUnder19;

            // When you turn 60 or more you are elegible for a survivor benefit that is prorated 7% for each year you retire
            // before the social security retirement age
            var yearEligibleForSurvivorBenefit = Math.max(0, 60 - survivor.person.age);
            var ageStartCollectingSurvivorBenefit = yearEligibleForSurvivorBenefit + survivor.person.age;
            var earlySurvivorBenefitReduction = Math.max(0, this.customer.assumptions.SSNAge - ageStartCollectingSurvivorBenefit) * .07;
			var survivorSpousalBenefit = (this.customer.profile.relationship == 'married' && year >= yearEligibleForSurvivorBenefit) ?
                flow.amount - flow.amount * earlySurvivorBenefitReduction : 0;

            // With dids under 16 you get at least 75% of your benefit no matter what age
            var survivorBenefitWithYoungKids = (this.customer.profile.relationship == 'married' && kidsUnder16) ? flow.amount * .75 : 0;
            survivorSpousalBenefit += survivorBenefitWithYoungKids;

			// Reduce amount by 50 cents of every dollar of income over threshold for survivor (but not kids)
			var income = flow.earnedIncome.getAmount(flow.earnedIncomeFlow, year, deceased);
			var income = Math.max(0, income - this.customer.assumptions.ssnMaxIncome[year + (new Date()).getFullYear()]);
			survivorSpousalBenefit = Math.max(0, survivorSpousalBenefit - income  / 2);

            var deceasedEarnedIncome = (deceased == this.customer.primaryCustomer) ?
                this.customer.capitalNeeds.earnedIncome[0] : this.customer.capitalNeeds.earnedIncome[1];
            var survivorEarnedIncome = (deceased == this.customer.primaryCustomer) ?
                this.customer.capitalNeeds.earnedIncome[1] : this.customer.capitalNeeds.earnedIncome[0];

			// Family maximum is between 160% and 180% of deceased benefit http://www.ssa.gov/oact/cola/familymax.html
            /*
             - If spouse works full time do not include ssn survivor income for spouse in model (but do include children one).
             - If spouse does not work full time do include ssn survivor income for spouse in model (as well as children survivor)
             - Do not include SSN retirement in any case

             Note if you are single with kids then your kids get the survivor benefits
             */
            if (!survivorEarnedIncome.works || this.customer.assumptions.useSSNSurvirorBenefits)
                var familyBenefit = Math.min(survivorSpousalBenefit + childBenefit, flow.familyMaximum);
            else
                var familyBenefit = Math.min(childBenefit, flow.familyMaximum);
           return familyBenefit * 12;


		} else
			return retirementBenefit * (1 - this.taxRate) * 12;
	},
	adjustFlow: function (flow) {
		flow.familyMaximum += flow.familyMaximum * this.customer.assumptions.ssnCOLA;
		flow.amount += flow.amount * this.customer.assumptions.ssnCOLA;
		flow.earnedIncome.adjustFlow(flow.earnedIncomeFlow);
	}
});0

// Not currently used.  Would have to be modified to assume a pension method
// maximum contributions etc.

var Retirement401K = Asset.extend("Retirement401K",
{

	earnedIncome:  {type: EarnedIncome},
	monthly:	   {type: Number, value: 0},
	taxRate:       {type: Number, value: 0.40},

	init: function(earnedIncome, amount, monthly) {
		Asset.call(this, earnedIncome.customer, '401K', amount);
		this.earnedIncome = earnedIncome;
		this.monthly = monthly;
	},
	reset: function () {
		this.monthly = 0;
		this.amount = 0;
	},

	inCashFlow: function() {
		return true
	},

	isActive:   function() {
		return (this.amount > 0 || this.monthly > 0);
	},

	isIncome:   function() {
		return true;
	},

	getStartingFlow: function (deceased, yearOfDeath) {
		var flow = {
			amount: this.amount,
			startYear: 0,
			endYear: this.getEndYear(),
			retirementAge: this.customer.settings.retirementAge,
			contribution: this.monthly * 12,
			residualValue: 0,
			withdrawalAmount: 0,
			initialWithdrawalAmount: 0,
			valueWhenDrawnDown: 0,
			forcedDrawdown: false
		};

		// Non-married beneficiaries must start collecting immediatly
		if (deceased == this.applicant && this.customer.profile.relationship != 'married') {
			flow.withdrawalAge = this.applicant.person.age;
			flow.forcedDrawdown = true;
		} else
			flow.withdrawalAge = flow.retirementAge;

		flow.withdrawalYear = Math.max(0, flow.withdrawalAge - this.earnedIncome.applicant.person.age);
		flow.retirementYear = Math.max(0, flow.retirementAge - this.earnedIncome.applicant.person.age);
		return flow;
	},

	adjustFlow: function (flow, year,  deceased, yearOfDeath) {
		var withdrawalAmount = year >= flow.withdrawalYear ? Math.min(flow.amount, flow.withdrawalAmount) : 0;
		flow.amount -= withdrawalAmount;     // Asset drawn down
		flow.amount += flow.amount * this.customer.settings.retirementRate; // Asset earns
		if (year < yearOfDeath || (deceased != this.earnedIncome.applicant && year < flow.retirementYear))
			flow.amount += flow.contribution;  // Contribution if still working and prior to retirement
		flow.contribution  += flow.contribution * this.earnedIncome.increase;
		flow.residualValue = flow.amount;
	},
	getAmount: function(flow, year, deceased) {

		// Compute withdrawal amount on first year of withdrawals
		if (year == flow.withdrawalYear) {
			flow.withdrawalAmount = flow.forcedDrawdown ?
				flow.amount / this.customer.assumptions.requiredWithdrawls[flow.withdrawalAge] :
				flow.amount / (this.customer.settings.mortalityAge - flow.withdrawalAge);
			flow.initialWithdrawalAmount = flow.withdrawalAmount;
			flow.valueWhenDrawnDown = flow.amount;
		}

		var withdrawalAmount = 0;
		if (year >= flow.withdrawalYear) {
			withdrawalAmount =  Math.min(flow.amount, flow.withdrawalAmount);
			flow.withdrawalAmount += flow.withdrawalAmount * this.customer.settings.inflation;
		}
		flow.residualValue = flow.amount;
		return withdrawalAmount * (1 - this.taxRate);
	},
	getDescription: function () {
		return this.earnedIncome.applicant.firstName + "'s 401K";
	}
});

return {
		EarnedIncome: EarnedIncome,
		SSN: SSN,
		Retirement401K: Retirement401K
}
}

