/*global RangeSliders, AnimatedScrolling, MailChimp, StickySidebars */
module.exports.quoteController = function (objectTemplate, _getTemplate) {

    var Product = {
        Term: 'ValoraTerm',
        Rop: 'ValoraROP'
    };

    var FormProgress = {
        init : function(controller) {
            this.controller = controller;
            this.settings = {
                $quoteForm: $('.js-has-progress-bar'),
                formGroups: '.js-validate-group',
                fields: {
                    'age': {
                        isSet: function(){
                            return this.controller.customer.primaryCustomer.person.age;
                        }
                    },
                    'familyStatus': {
                        isSet: function(){
                            return this.controller.customer.profile.familyStatusGet();
                        }
                    },
                    'gender':{
                        isSet: function(){
                            return this.controller.customer.primaryCustomer.person.gender;
                        }
                    },
                    'healthClassNumber': {
                        isSet: function(){
                            return this.controller.customer.primaryCustomer.healthClassNumber in this.controller.customer.primaryCustomer.healthClassValues;
                        }
                    },
                    'income': {
                        isSet: function(){
                            return this.controller.customer.capitalNeeds.earnedIncome[0].amount;
                        }
                    },
                    'monthlyBudget': {
                        isSet: function(){
                            return this.controller.customer.monthlyBudget;
                        }
                    },
                    'texasResident': {
                        isSet: function(){
                            return this.controller.customer.primaryCustomer.address.state;
                        }
                    },
                    'smoke':{
                        isSet: function(){
                            return !(this.controller.customer.primaryCustomer.smoker === null);
                        }
                    }
                }
            };
        },

        fieldsToWatch: function(){
            return Object.keys(FormProgress.settings.fields);
        },

        numOfFieldsToWatch: function(){
            return Object.keys(this.fieldsToWatch()).length;
        },

        fieldsCompleted: function(){
            var fieldsCompleted = [];
            _.each( FormProgress.settings.fields, function( val, key ) {
                if ( val.isSet.apply(FormProgress) ) {
                    fieldsCompleted.push(key);
                }
            });
            return fieldsCompleted;
        },

        numOfFieldsCompleted: function(){
            return this.fieldsCompleted().length;
        }
    };


    var QuoteController = objectTemplate.create('QuoteController', {
        init: function(controller) {
            this.controller = controller;
            this.formProgress = FormProgress;

            FormProgress.init(controller);
        },
        routeExited: function() {
            this.destroyClientLibraries();
        },
        routeEntered: function() {
            var initializeClientLibraries = function() {
                this.initializeClientLibraries();
                return Q();
            }.bind(this);

            var initializeBudgetSlider = function() {
                this.initializeBudgetSlider();
                return Q();
            }.bind(this);

            var restoreInputs = function() {
                if(this.controller.customer.primaryCustomer) {
                    this.customerTexasResident = this.controller.customer.primaryCustomer.address.state == 'TX';
                }
                if(this.controller.customer.primaryCustomer.person.age) {
                    this.customerAge = this.controller.customer.primaryCustomer.person.age;
                }
                if(this.controller.customer.capitalNeeds.earnedIncome[0].amount) {
                    this.customerIncome = this.controller.customer.capitalNeeds.earnedIncome[0].amount;
                }

                this.monthlyBudget = this.controller.customer.monthlyBudget;
                if (this.monthlyBudget) { this.setBudgetSliderValue(this.monthlyBudget); }

                return Q();
            }.bind(this);

            var routeEntered = function() {
                this.sanitizeInputs();
                this.quoteMatchedReset();

                initializeClientLibraries()
                    .then(initializeBudgetSlider)
                    .then(restoreInputs)
                    .then(function(){
                        this.controller.refresh();
                    }.bind(this));
            }.bind(this);

            setTimeout(routeEntered, 100);
        },
        initializeClientLibraries: function() {
            // Still need to proceed given something wrong when init client library
            try {
                RangeSliders.init();
                AnimatedScrolling.init();
                StickySidebars.init();
                MailChimp.init();
            } catch(e){
                console.log(e);
            }
        },
        destroyClientLibraries: function() {
            RangeSliders.destroy();
            AnimatedScrolling.destroy();
            StickySidebars.destroy();
            MailChimp.destroy();
        },
        initializeBudgetSlider: function() {
            this.budgetSlider = $('.js-range')[0];
            this.budgetSlider.noUiSlider.on('change', function(values, handle) {
                this.setMonthlyBudget(values[handle]);
                this.controller.fireAnalyticsEvents('QuoteBudget', values[handle]);
                this.controller.analyticsController.preSave();
            }.bind(this));
        },
        sanitizeInputs: function() {
            this.monthlyBudgetIsDirty             = false;
            this.customerAgeIsDirty               = false;
            this.customerStateIsDirty             = false;
            this.customerIncomeIsDirty            = false;
            this.customerTexasResidentIsDirty     = false;
            this.customerFamilyStatusDirty        = false;
            this.customerHealthClassNumberIsDirty = false;
            this.customerSmokerIsDirty            = false;
        },
        makeDirtyInputs: function() {
            this.monthlyBudgetIsDirty             = true;
            this.customerAgeIsDirty               = true;
            this.customerStateIsDirty             = true;
            this.customerIncomeIsDirty            = true;
            this.customerTexasResidentIsDirty     = true;
            this.customerFamilyStatusDirty        = true;
            this.customerHealthClassNumberIsDirty = true;
            this.customerSmokerIsDirty            = true;
        },
        customerHealthClassNumberIsDirty: {
            type: Boolean,
            value: false
        },
        updateCustomerHealthClass: function() {
            this.controller.customer.primaryCustomer.healthClassNumberTrigger();
            
            this.controller.analyticsController.addCustomData('QuoteHealth', this.controller.customer.primaryCustomer.healthClassNumber);
            this.controller.analyticsController.addDataChangeEvent('QuoteHealth', this.controller.customer.primaryCustomer.healthClassNumber);
        },
        customerAge: {
            type: Number,
            rule: ['required', 'numeric'],
            validate: 'isWithin(18, 44)'
        },
        customerIncome: {
            type: Number,
            rule: ['required', 'currency'],
            validate:'isWithin(1, 10000000)'
        },
        customerAgeTrigger: function() {
            this.controller.customer.primaryCustomer.person.age = Number(this.customerAge);
        },
        customerIncomeTrigger: function() {

            this.controller.customer.capitalNeeds.earnedIncome[0].amount = Number(this.customerIncome);
        },
        customerAgeIsDirty: {
            type: Boolean,
            value: false
        },
        customerSmokerIsDirty: {
            type: Boolean,
            value: false
        },
        customerGenderTrigger: function () {
            this.controller.analyticsController.addCustomData('QuoteGender', this.controller.customer.primaryCustomer.person.gender);
            this.controller.analyticsController.addDataChangeEvent('QuoteGender', this.controller.customer.primaryCustomer.person.gender);
        },
        customerFamilyStatusError: function() {
            return this.customerFamilyStatusDirty && this.controller.customer.profile.familyStatusGet() === '';
        },
        customerHealthClassNumberError: function() {
            return this.customerHealthClassNumberIsDirty && !this.controller.customer.primaryCustomer.healthClassNumber;
        },
        customerSmokerError: function() {
            return this.customerSmokerIsDirty && this.controller.customer.primaryCustomer.smoker === null;
        },
        customerStateError: function() {
            if (this.singleStateOnly()) {
                return this.controller.customer.primaryCustomer.address.state !== 'TX';
            } else {
                if (this.customerStateIsDirty) {
                    return !this.controller.customer.primaryCustomer.address.state;
                }
            }
            return false;
        },
        customerStateIsDirty: {
            type: Boolean,
            value: false
        },
        customerFamilyStatusDirty: {
            type: Boolean,
            value: false
        },
        customerIncomeIsDirty: {
            type: Boolean,
            value: false
        },
        customerTexasResident: {
            type: Boolean,
            value: false
        },
        customerTexasResidentIsDirty: {
            type: Boolean,
            value: false
        },
        customerTexasResidentError: function() {
            if (this.customerTexasResidentIsDirty) {
                return !this.controller.customer.primaryCustomer.address.state;
            }
            return false;
        },
        customerTexasResidentTrigger: function() {
            var primaryCustomer = this.controller.customer.primaryCustomer;
            this.customerTexasResidentIsDirty   = true;

            if (this.customerTexasResident) {
                primaryCustomer.address.state = 'TX';
            } else {
                primaryCustomer.address.state = '';
            }

            this.controller.analyticsController.addCustomData('QuoteState', this.controller.customer.primaryCustomer.address.state);
            this.controller.analyticsController.addDataChangeEvent('QuoteState', this.controller.customer.primaryCustomer.address.state);

        },
        customerSmokerTrigger: function() {
            this.controller.customer.primaryCustomer.healthClassNumberTrigger();

            this.controller.analyticsController.addCustomData('QuoteSmoker', this.controller.customer.primaryCustomer.smoker);
            this.controller.analyticsController.addDataChangeEvent('QuoteSmoker', this.controller.customer.primaryCustomer.smoker);
        },
        singleStateOnly: function() {
            return true; //Only In Texas for the moment
        },
        setMonthlyBudget: function(budget) {
            this.monthlyBudget          = Number(budget);
            this.monthlyBudgetIsDirty   = true;
            this.controller.customer.monthlyBudget = this.monthlyBudget;
            
            this.controller.analyticsController.addCustomData('QuoteBudget', this.controller.customer.monthlyBudget);
            this.controller.analyticsController.addDataChangeEvent('QuoteBudget', this.controller.customer.monthlyBudget);
            this.controller.publicSave();
        },
        setFamilyStatus: function(relationShipStatus, familyStatus){
            this.customerFamilyStatusDirty = true;
            this.controller.customer.profile.relationship = relationShipStatus;
            this.controller.customer.profile.familyStatus = familyStatus;
            this.controller.publicSyncSession();
        },
        monthlyBudget: {
            type: Number,
            value: 0,
            rule: 'required'
        },
        monthlyBudgetIsDirty: {
            type: Boolean,
            value: false
        },
        monthlyBudgetError: function() {
            if (this.monthlyBudgetIsDirty && this.monthlyBudget == 0) { return true; }
            return false;
        },
        setBudgetSliderValue: function (value) {
            this.monthlyBudgetIsDirty = true;
            this.budgetSlider.noUiSlider.set(value);
        },
        assignCustomerQuote: function () {
            var maxTerm = 30;
            var minTerm = 20;
            var minFace = 100000;


            // Try to get quote in order:
            // 1. 30 years term
            // 2. 20 years term if 30 years term not found
            // 3. Minimum quote policy we can get ( currently it is 10k under 20 years term)
            return this.getHavenQuoteByPremium(maxTerm, Product.Term)
                .then(function(termQuote) {

                    var termOptions = {
                        term: minTerm,
                        face: minFace,
                        product: Product.Term

                    };

                    var plusOptions = {
                        face: termQuote ? termQuote.policies[0].face : termOptions.face,
                        term: termQuote ? termQuote.policies[0].term : termOptions.term,
                        product: Product.Rop
                    };

                    var getMinimumQuote = function () {

                        var getMinQuoteByPremium = function (term, product) {
                            return this.getHavenQuoteByPremium(term, product);
                        }.bind(this);

                        var getMinQuoteByCoverage = function (options) {
                            return this.getHavenQuoteByCoverageAmount(options);
                        }.bind(this);

                        var getTermQuotes = function () {

                            var evaluateQuote = function (quote) {
                                return quote ? Q(quote) : getMinQuoteByCoverage(termOptions);
                            };

                            return getMinQuoteByPremium(minTerm, Product.Term)
                                .then(evaluateQuote);
                        };

                        var getPlusQuotes = function () {

                            var evaluateQuote = function (quote) {
                                return quote ? Q(quote) : getMinQuoteByCoverage(plusOptions);
                            };

                            return getMinQuoteByPremium(minTerm, Product.Rop)
                                .then(evaluateQuote);
                        };

                        return Q.all([getTermQuotes(), getPlusQuotes()])
                            .then(function (quotes) {
                                var termQuote = quotes[0].policies[0];
                                var plusQuote = quotes[1].policies[0];

                                this.controller.customer.selectedQuote = {
                                    policies: [termQuote, plusQuote]
                                };

                                return Q(this.controller.customer.selectedQuote);
                            });

                    }.bind(this);

                    // If no quotes are found based on user selection
                    // Find quote with lowest possible term and face amount
                    if (!termQuote) {
                        return getMinimumQuote();
                    }

                    // Now that we have values for term
                    // Plug them into equation for term plus
                    return this.getHavenQuoteByCoverageAmount(plusOptions)
                        .then(function (plusQuote) {

                            this.controller.customer.selectedQuote = {
                                policies: [termQuote.policies[0], plusQuote.policies[0]]
                            };

                            return Q(this.controller.customer.selectedQuote);

                        }.bind(this));

                }.bind(this));

        },
        getHavenQuoteByPremium: {
            on: 'server',
            body: function(term, product) {
                // Attention: when integer parameter get passed from client side to server side, it
                // automatically get converted to string
                return this.controller.quoteResultsController.getHavenQuoteByPremium(term, product);
            }
        },
        getHavenQuoteByCoverageAmount: {
            on: 'server',
            body: function( overridesOptions ) {
                // Original object get converting to template, so we need to convert it back
                var convertedOverridesOptions = {};
                for ( var key in overridesOptions ){
                    if ( overridesOptions.hasOwnProperty( key ) ){
                        convertedOverridesOptions[key] = overridesOptions[ key ].valueOf();
                    }
                }
                return this.controller.quoteResultsController.getHavenQuoteByCoverageAmount(convertedOverridesOptions );
            }
        },
        quoteMatched: {
            type: Boolean,
            value: null
        },
        quoteMatchedReset: function () {
            this.quoteMatched = null;
        },
        showQuoteMatchedErrorMessage: function () {
            return _.isNull(this.quoteMatched) ? false: true;
        },
        quoteMatchedErrorMessage: function() {
            if (!this.quoteMatched) { return 'NO QUOTE MATCHED'; }
            return '';
        },
        errorMessageFor: function(property) {
            var errorMessages = {
                'age':              'Please fill in this field with an age between 18 and 44.',
                'budget':           'Please enter a budget.',
                'family':           'Please choose a family situation.',
                'gender':           'Please choose a gender.',
                'health':           'Please choose a level of health.',
                'income':           'Please input an income greater than 0.',
                'smoking':          'Please indicate your smoking status.',
                'state':            'Please select a state from the list.',
                'texasResident':    'Please confirm your residency.'
            };

            return errorMessages[property] || '';
        },
        customerAgeError: function () {
            return this.controller.isError('quoteController.customerAge');
        },
        customerIncomeError: function () {
            return this.controller.isError('quoteController.customerIncome');
        },
        validateQuoteProps: function() {
            if (this.customerAgeError()) { this.controller.scrollSet('.question-age', {offset: -150}); return false; }
            if (this.customerStateError()) { this.controller.scrollSet('.question-state', {offset: -150}); return false; }
            if (this.customerFamilyStatusError()) { this.controller.scrollSet('.question-family', {offset: -150}); return false; }
            if (this.customerIncomeError()) { this.controller.scrollSet('.question-income', {offset: -150}); return false; }
            if (this.monthlyBudgetError()) { this.controller.scrollSet('.question-budget', {offset: -150}); return false; }
            if (this.customerHealthClassNumberError()) { this.controller.scrollSet('.question-health', {offset: -150}); return false; }
            if (this.customerSmokerError()) { this.controller.scrollSet('.question-smoking', {offset: -150}); return false; }
            return true;
        },
        viewQuote: function() {
            this.makeDirtyInputs();
            //bindster validate
            if (!controller.validate()) { return; }
            //validate props with amended rules/requirements
            if (!this.validateQuoteProps()) { return; }
            this.controller.isLoading = true;
            //calculate quote value - use existing function in quote engine
            this.assignCustomerQuote().then(function(quote){
                //if quote, then route to quoteResults
                if (quote) {
                    this.quoteMatched = true;
                    this.controller.routeTo('quoteResults');
                    this.controller.scrollSet('top');
                } else {
                    this.quoteMatched = false;
                    console.log('ALERT: NO HAVEN QUOTE MATCHED');
                }
            }.bind(this));
        }
    });

    return {
        QuoteController: QuoteController
    };
};
