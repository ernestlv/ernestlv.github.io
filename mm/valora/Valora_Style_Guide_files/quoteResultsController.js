/*global RangeSliders, ResponsiveTables*/
module.exports.quoteResultsController = function (objectTemplate, getTemplate) {

    var Product = {
        Term: 'ValoraTerm',
        Rop: 'ValoraROP'
    };

    var QuoteResultsController = objectTemplate.create('QuoteResultsController', {
        init: function(controller) {
            this.controller = controller;
        },
        routeEntered: function() {
            if(!this.checkRoutePermission()) { return this.controller.routeTo('quote');}

            var routeEntered = function () {
                this.initializeClientLibraries();
                this.initializeCoverageAmountSlider();
                this.setFaceAmountSliderValue(this.quoteFaceAmount);
                this.controller.isLoading = false;
            }.bind(this);

            var termQuote = this.controller.customer.selectedQuote.policies[0];
            var plusQuote = this.controller.customer.selectedQuote.policies[1];

            this.setCalculatedQuotes([termQuote, plusQuote]);

            if (this.selectedQuoteIsStale()) {
                return this.getHavenQuotesTrigger()
                    .then(routeEntered);
            } else {
                setTimeout(routeEntered, 100);
            }
        },
        checkRoutePermission: function () {

            var quoteQuestionsAnswered = function () {

                var answers = [this.controller.customer.primaryCustomer.person.age,
                    this.controller.customer.monthlyBudget,
                    this.controller.customer.profile.familyStatusGet(),
                    this.controller.customer.primaryCustomer.person.gender,
                    this.controller.customer.primaryCustomer.healthClassNumber,
                    this.controller.customer.capitalNeeds.earnedIncome[0].amount,
                    this.controller.customer.primaryCustomer.address.state];

                return _.every(answers, _.identity);

            }.bind(this);

            if(!this.controller.customer.selectedQuote || !quoteQuestionsAnswered() ) {
                return false;
            }

            return true;
        },
        initializeClientLibraries: function() {
            RangeSliders.init();
            ResponsiveTables.init();
        },
        destroyClientLibraries: function() {
            RangeSliders.destroy();
            ResponsiveTables.destroy();
        },
        routeExited: function() {
            this.destroyClientLibraries();
        },
        getHavenQuotesTrigger: function () {
            return this.getHavenQuoteByCoverageAmount().then(function(termQuote) {

                var plusOptions = {
                    face: termQuote.policies[0].face,
                    term: termQuote.policies[0].term,
                    maxPremium: termQuote.policies[0].monthly,
                    product: Product.Rop
                };

                return this.getHavenQuoteByCoverageAmount(plusOptions).then(function (plusQuote) {
                    this.setCustomerSelectedQuotes({
                        policies: [termQuote.policies[0], plusQuote.policies[0]]
                    });
                    this.setCalculatedQuotes([termQuote.policies[0], plusQuote.policies[0]]);
                }.bind(this));
            }.bind(this));
        },
        initializeCoverageAmountSlider: function() {
            var $slider = RangeSliders.settings.$target[0];
            $slider.noUiSlider.on('change', function(values, handle) {
                this.quoteFaceAmount = Number(values[handle]);
                return this.getHavenQuotesTrigger();
            }.bind(this));
        },
        selectedQuoteIsStale: function () {
            var policy = this.controller.customer.selectedQuote.policies[0];
            if (policy.face === 0) { return false; }
            if (policy.face !== this.quoteFaceAmount) { return true; }
            if (policy.term !== this.quoteTermLength) { return true; }
            if (policy.monthly !== this.quotePremiumAmount[0]) { return true; }
            return false;
        },
        setFaceAmountSliderValue: function (value) {
            var $slider = RangeSliders.settings.$target[0];
            $slider.noUiSlider.set(value);
        },
        setCustomerSelectedQuotes: function(quotes) {
            this.controller.customer.selectedQuote = quotes;
            this.controller.publicSyncSession();
        },
        setCalculatedQuotes: function(policies) {

            this.quoteTermLength = Number(policies[0].term) || Number(policies[1].term);
            this.quoteFaceAmount = Number(policies[0].face) || Number(policies[1].face);
            this.quotePremiumAmount = [Number(policies[0].monthly), Number(policies[1].monthly)];
            this.quotePremiumYearCost = [this.quotePremiumAmount[0] * 12, this.quotePremiumAmount[1] * 12];
            this.quotePremiumFiveYearCost = [this.quotePremiumYearCost[0] * 5, this.quotePremiumYearCost[1] * 5];
            this.quotePremiumFifteenYearCost = [this.quotePremiumYearCost[0] * 15, this.quotePremiumYearCost[1] * 15 ];
            this.quotePremiumTotalCost = [this.quotePremiumYearCost[0] * this.quoteTermLength, this.quotePremiumYearCost[1] * this.quoteTermLength ];

            this.controller.fireAnalyticsEvents('QuoteCoverageAmount', this.quoteFaceAmount);
            this.controller.fireAnalyticsEvents('QuoteTermLength', this.quoteTermLength);
            this.controller.analyticsController.preSave();
            this.controller.publicSave();
        },
        productType: {
            type: String
        },
        apply: function (policyProduct) {

            var createPolicy = function  () {
                return this.controller.createPolicy(policyProduct);
            }.bind(this);

            var handleCustomerGender = function () {
                var gender = this.controller.customer.primaryCustomer.person.gender;
                this.controller.customer.primaryCustomer.gender = gender === '1' ? 'male' : 'female';
            }.bind(this);

            var goToApplication = function () {
                return this.controller.routeToPrivate('application');
            }.bind(this);

            var goToCreateAccount = function () {
                return this.controller.routeTo('createAccount');
            }.bind(this);

            this.productType = policyProduct;

            this.controller.fireAnalyticsEvents('ApplicationPolicyType', policyProduct);
            this.controller.analyticsController.preSave();

            if (this.controller.isLoggedIn()) {
                this.controller.isLoading = true;
                return Q()
                    .then(handleCustomerGender)
                    .then(createPolicy)
                    .then(goToApplication);
            } else {
                return goToCreateAccount();
            }
        },
        quoteTermLength: {
            type: Number,
            value: 30
        },
        quoteTermLengthTrigger: function () {
            return this.getHavenQuotesTrigger();
        },
        quoteFaceAmount: {
            type: Number,
            value: 0
        },
        quoteFaceAmountDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quoteFaceAmount).format('$0,0') :
                numeral(this.quoteFaceAmount).format('$0,0');
        },
        quotePremiumAmount: {
            type: Array,
            of: Number,
            value: []
        },
        quotePremiumAmountDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quotePremiumAmount[0]).format('$0,0.00') + '/month'
                : numeral(this.quotePremiumAmount[1]).format('$0,0.00') + '/month';
        },
        quotePremiumYearCost: {
            type: Array,
            of: Number,
            value: []
        },
        quotePremiumYearCostDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quotePremiumYearCost[0]).format('$0,0.00') + ''
                : numeral(this.quotePremiumYearCost[1]).format('$0,0.00') + '';
        },
        quotePremiumFiveYearCost: {
            type: Array,
            of: Number,
            value: []
        },
        quotePremiumFiveYearCostDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quotePremiumFiveYearCost[0]).format('$0,0.00')
                : numeral(this.quotePremiumFiveYearCost[1]).format('$0,0.00') ;
        },
        quotePremiumFifteenYearCost: {
            type: Array,
            of: Number,
            value: []
        },
        quotePremiumFifteenYearCostDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quotePremiumFifteenYearCost[0]).format('$0,0.00')
                : numeral(this.quotePremiumFifteenYearCost[1]).format('$0,0.00');
        },
        quotePremiumTotalCost: {
            type: Array,
            of: Number,
            value: []
        },
        quotePremiumTotalCostDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quotePremiumTotalCost[0]).format('$0,0.00')
                : numeral(this.quotePremiumTotalCost[1]).format('$0,0.00');
        },

        quotePremiumTotalReturnDisplay: function (policyType) {
            var policyTypeIndex = policyType === Product.term ? 0 : 1;
            var termLength      = this.quoteTermLength;
            var yearlyFee       = 72;
            var totalFee        = yearlyFee * termLength;
            var totalReturn     = this.quotePremiumTotalCost[policyTypeIndex] - totalFee;

            return numeral(totalReturn).format('$0,0.00');
        },

        getHavenQuoteByPremium: {
            on: 'server',
            body: function(term, product) {
                var customer    = this.controller.customer;
                var gender      = customer.primaryCustomer.person.gender === '1' ? 'male' : 'female';
                var healthClass = customer.primaryCustomer.healthClass;
                var smoker      = customer.primaryCustomer.smoker;
                var age         = customer.primaryCustomer.person.age;
                var maxPremium  = this.controller.quoteController.monthlyBudget;

                //TO BE REFACTORED/REMOVED ONCE CLASS REFACTORING IS COMPLETE
                //-----------------------------
                healthClass     = healthClass.split('S')[0];
                if (healthClass === 'Rg') { healthClass = 'R+'; }
                if (healthClass === 'P+' && smoker) { healthClass = 'Pf'; }
                //------------------------------
                var options = {
                    gender: gender,
                    healthClass: healthClass,
                    smoker: smoker,
                    age: age,
                    term: term,
                    maxPremium: maxPremium,
                    product: product
                };

                options.term = parseInt(options.term, 10);
                options.maxPremium = parseInt(options.maxPremium, 10);

                var QuoteEngine = getTemplate('QuoteEngine.js', {app: 'lib/quotesengine', client: false}).QuoteEngine;
                var quoteEngine = new QuoteEngine();

                return quoteEngine.getQuoteByPremium(options);
            }
        },
        getHavenQuoteByCoverageAmount: {
            on: 'server',
            body: function(overridesOptions ) {
                var face = this.quoteFaceAmount;
                var term = this.quoteTermLength;
                var customer    = this.controller.customer;
                var gender      = customer.primaryCustomer.person.gender === '1' ? 'male' : 'female';
                var healthClass = customer.primaryCustomer.healthClass;
                var smoker      = customer.primaryCustomer.smoker;
                var age         = customer.primaryCustomer.person.age;
                var maxPremium  = this.controller.quoteController.monthlyBudget;

                //TO BE REFACTORED/REMOVED ONCE CLASS REFACTORING IS COMPLETE
                //-----------------------------
                healthClass     = healthClass.split('S')[0];
                if (healthClass === 'Rg') { healthClass = 'R+'; }
                if (healthClass === 'P+' && smoker) { healthClass = 'Pf'; }
                //------------------------------
                var options = {
                    gender: gender,
                    healthClass: healthClass,
                    smoker: smoker,
                    age: age,
                    term: term,
                    face: face,
                    maxPremium: maxPremium,
                    product: Product.Term
                };

                // Merge overrides_options map into options map
                for ( var key in overridesOptions ) {
                    options[key] = overridesOptions[key];
                }

                options.term = parseInt(options.term, 10);
                options.maxPremium = parseInt(options.maxPremium, 10);
                options.face = parseInt(options.face, 10);

                var QuoteEngine = getTemplate('QuoteEngine.js', {app: 'lib/quotesengine', client: false}).QuoteEngine;
                var quoteEngine = new QuoteEngine();

                return quoteEngine.getQuote(options);
            }
        }

    });

    return {
        QuoteResultsController: QuoteResultsController
    };
};
