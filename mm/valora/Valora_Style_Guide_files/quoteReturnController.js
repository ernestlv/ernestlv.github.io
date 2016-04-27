/*global RangeSliders, ResponsiveTables*/
module.exports.quoteReturnController = function (objectTemplate, getTemplate) {

    var Product = {
        Term: 'ValoraTerm',
        Rop: 'ValoraROP'
    };

    var QuoteReturnController = objectTemplate.create('QuoteReturnController', {
        init: function(controller) {
            this.controller = controller;
        },
        routeEntered: function() {

            var termQuote = this.controller.customer.selectedQuote.policies[0];
            var plusQuote = this.controller.customer.selectedQuote.policies[1];

            this.setSavedQuote([termQuote, plusQuote]);
            this.setCalculatedQuotes([termQuote, plusQuote]);

            this.selectedQuote = {
                policies: [termQuote, plusQuote]
            };

            var routeEntered = function() {
                this.initializeClientLibraries();
                this.initializeCoverageAmountSlider();
                this.setFaceAmountSliderValue(this.quoteFaceAmount);
            }.bind(this);

            setTimeout(routeEntered, 100);
        },
        initializeClientLibraries: function () {
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
        setSavedQuote: function(policies) {
            this.savedQuoteTermLength    = Number(policies[0].term) || Number(policies[1].term);
            this.savedQuoteFaceAmount    = Number(policies[0].face) || Number(policies[1].face);
            this.savedQuotePremiumAmount = [Number(policies[0].monthly), Number(policies[1].monthly)];
            this.controller.refresh();
        },
        setCalculatedQuotes: function(policies) {
            this.quoteTermLength = Number(policies[0].term) || Number(policies[1].term);
            this.quoteFaceAmount = Number(policies[0].face) || Number(policies[1].face);
            this.quotePremiumAmount = [Number(policies[0].monthly), Number(policies[1].monthly)];
            this.quotePremiumYearCost = [this.quotePremiumAmount[0] * 12, this.quotePremiumAmount[1] * 12];
            this.quotePremiumFiveYearCost = [this.quotePremiumYearCost[0] * 5, this.quotePremiumYearCost[1] * 5];
            this.quotePremiumFifteenYearCost = [this.quotePremiumYearCost[0] * 15, this.quotePremiumYearCost[1] * 15 ];
            this.quotePremiumTotalCost = [this.quotePremiumYearCost[0] * this.quoteTermLength, this.quotePremiumYearCost[1] * this.quoteTermLength ];

            this.controller.refresh();
        },
        setFaceAmountSliderValue: function (value) {
            var slider = $('.js-range')[0];
            slider.noUiSlider.set(value);
        },
        initializeCoverageAmountSlider: function() {
            var $slider = RangeSliders.settings.$target[0];
            $slider.noUiSlider.on('change', function(values) {
                this.quoteFaceAmount = Number(values[0]);
                return this.getHavenQuotesTrigger();
            }.bind(this));
        },
        welcomeMessageDisplay: function () {
            if (this.controller.firstLogin) { return 'We\'ve saved your quotes for you.'; }
            return 'Welcome back.';
        },
        savedQuoteTermLength: {
            type: Number,
            value: 30
        },
        savedQuoteFaceAmount: {
            type: Number,
            value: 0
        },
        savedQuoteFaceAmountDisplay: function () {
            return numeral(this.savedQuoteFaceAmount).format('$0,0');
        },
        savedQuotePremiumAmount: {
            type: Array,
            of: Number,
            value: []
        },
        savedQuotePremiumAmountDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.savedQuotePremiumAmount[0]).format('$0,0.00') + '/month'
                : numeral(this.savedQuotePremiumAmount[1]).format('$0,0.00') + '/month';
        },
        savedQuoteSummaryDisplay: function () {
            return this.savedQuoteFaceAmountDisplay() + ' / ' + this.savedQuoteTermLength + ' year term';
        },
        quoteTermLength: {
            type: Number,
            value: 30
        },
        selectedQuote: {
            type: Object,
            value: {}
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

                    this.selectedQuote = {
                        policies: [termQuote.policies[0], plusQuote.policies[0]]
                    };

                    this.setCustomerSelectedQuotes(this.selectedQuote);
                    this.setCalculatedQuotes([termQuote.policies[0], plusQuote.policies[0]]);

                }.bind(this));

            }.bind(this));
        },
        setCustomerSelectedQuotes: function(quotes) {
            this.controller.customer.selectedQuote = quotes;
            this.controller.publicSyncSession();
        },
        quoteTermLengthTrigger: function() {
            return this.getHavenQuotesTrigger();
        },
        quoteFaceAmount: {
            type: Number,
            value: 0
        },
        quoteFaceAmountDisplay: function() {
            return numeral(this.quoteFaceAmount).format('$0,0');
        },
        quotePremiumAmount: {
            type: Array,
            of: Number,
            value: []
        },
        quotePremiumAmountDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quotePremiumAmount[0]).format('$0,0.00')
                : numeral(this.quotePremiumAmount[1]).format('$0,0.00') + '/month';
        },
        quotePremiumYearCost: {
            type: Array,
            of: Number,
            value: []
        },
        quotePremiumYearCostDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quotePremiumYearCost[0]).format('$0,0.00')
                : numeral(this.quotePremiumYearCost[1]).format('$0,0.00');
        },
        quotePremiumFiveYearCost: {
            type: Array,
            of: Number,
            value: []
        },
        quotePremiumFiveYearCostDisplay: function (policyType) {
            return policyType === Product.Term ? numeral(this.quotePremiumFiveYearCost[0]).format('$0,0.00')
                : numeral(this.quotePremiumFiveYearCost[1]).format('$0,0.00');
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

        quoteSummaryDisplay: function() {
            return this.quoteFaceAmountDisplay() + ' / ' + this.quoteTermLength + ' year term';
        },

        apply: function (policyProduct) {
            this.controller.isLoading = true;
            // Set selected quote on customer to current selected quote
            this.controller.customer.selectedQuote = this.selectedQuote;

            var handleCustomerGender = function () {
                var gender = this.controller.customer.primaryCustomer.person.gender;
                this.controller.customer.primaryCustomer.gender = gender === '1' ? 'male' : 'female';
            }.bind(this);

            var createPolicy = function  () {
                return this.controller.createPolicy(policyProduct);
            }.bind(this);

            var goToApplication = function () {
                return this.controller.routeToPrivate('application');
            }.bind(this);

            return Q()
                .then(handleCustomerGender)
                .then(createPolicy)
                .then(goToApplication);
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
        QuoteReturnController: QuoteReturnController
    };
};
