module.exports.Customer = function (objectTemplate, getTemplate) {
    // Non-Semotus modules
    if (typeof(require) != 'undefined') {
        Q = require('q');  // Don't use var or js - optimization will force local scope
        _ = require('underscore');
    }

    getTemplate('./static/Insurers.js').Insurers;
    getTemplate('./customer/Applicant.js').RiskFactors;

    var Applicant = getTemplate('./customer/Applicant.js').Applicant;
    var ApplicantQuery = getTemplate('./customer/Applicant.js').ApplicantQuery;
    var RiskFactors = getTemplate('./customer/Applicant.js').RiskFactors;
    var Person = getTemplate('./customer/Person.js').Person;
    var PersonQuery = getTemplate('./customer/Person.js').PersonQuery;
    var Entity = getTemplate('./customer/Person.js').Entity;
    var Address = getTemplate('./customer/Person.js').Address;
    var Phone = getTemplate('./customer/Person.js').Phone;
    var Quotes = getTemplate('./needs/Quotes.js').Quotes;
    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
    var Policy = getTemplate('./customer/Policy.js').Policy;
    var PolicyQuery = getTemplate('./customer/Policy.js').PolicyQuery;
    var PolicyDocQuery = getTemplate('./customer/Policy.js').PolicyDocQuery;
    var Referral = getTemplate('./customer/Referral.js').Referral;

    var FamilyHistory = getTemplate('./customer/Applicant.js').FamilyHistory;
    var FamilyCondition = getTemplate('./customer/Applicant.js').FamilyCondition;
    var PersonalHistory = getTemplate('./customer/Applicant.js').PersonalHistory;
    var DiagnosisShort = getTemplate('./customer/Applicant.js').DiagnosisShort;
    var RX = getTemplate('./customer/Applicant.js').RX;
    var Diagnosis = getTemplate('./customer/Applicant.js').Diagnosis;
    var Surgery = getTemplate('./customer/Applicant.js').Surgery;
    var Avocation = getTemplate('./customer/Applicant.js').Avocation;
    var AccidentAtFault = getTemplate('./customer/Applicant.js').AccidentAtFault;
    var SpeedingTicket = getTemplate('./customer/Applicant.js').SpeedingTicket;
    var RecklessTicket = getTemplate('./customer/Applicant.js').RecklessTicket;
    var OtherMovingViolation = getTemplate('./customer/Applicant.js').OtherMovingViolation;
    var DrivingWhileSuspendedCon = getTemplate('./customer/Applicant.js').DrivingWhileSuspendedCon;
    var TravelCountry = getTemplate('./customer/Applicant.js').TravelCountry;
    var ExistingPolicies = getTemplate('./customer/Applicant.js').ExistingPolicies;
    var ExistingPolicy = getTemplate('./customer/Applicant.js').ExistingPolicy;
    var Visitor = getTemplate('./customer/Analytics.js').Visitor;


    getTemplate('./customer/Policy.js').PolicyDoc;

    var Settings = objectTemplate.create('Settings', {});

    var Customer = objectTemplate.create('Customer', {
        channel:            {type: String, toServer: false, value: Assumptions.channels.Haven.code},
        language:           {type: String, toServer: false, value: Assumptions.languages.en},
        getChannelInfo: function () {
            return Assumptions.channels[this.channel];
        },
        email:              {toServer: false, type: String, value: '', length: 50, rule: ['email']},
        newEmail:           {toServer: false, type: String, value: '', length: 50, rule: ['email']},
        firstName:          {toServer: false, type: String, value: '', length: 40, rule: ['name', 'required']},
        lastName:           {toServer: false, type: String, value: '', length: 40, rule: ['name', 'required']},

        assumptions:        {isLocal: true, type: Assumptions},  // Probably should hang off of the controller

        // Master list connected to anything hanging off of off customer
        persons:            {type: Array, of: Person,  value: [], applicationOmit: true},
        addresses:          {type: Array, of: Address, value: [], applicationOmit: true},
        phones:             {type: Array, of: Phone,   value: [], applicationOmit: true},

        referral:           {toClient: false, type: Referral},

        selectedQuote:      {type: Object},             // Most recently selected quote
        progress:           {type: Number, value: 1},   // Current progress.
                                                        // 1->Needs analysis , 2->Select a quote...
        progressValues:      {isLocal: true, type: Object, value: {
            1 : 'Needs',
            2:  'Quotes listed',
            10:  'Introduction screen',
            11:  'Account registered',
            12:  'Apply form',
            13:  'Application completed'
        }},

        // The two individuals on whom we do needs analysis
        primaryCustomer:    {type: Applicant},
        alternateCustomer:  {type: Applicant},
        policies:           {type: Array, of: Policy, value: [], toServer: false},
        visitors:           {type: Array, of: Visitor, value: []},
        applicationPolicy:  {type: Policy, fetch: true, toServer: false},

        reapplyTokensLeft:  {toServer: false, type: Number, value: 0},
        reapplyTokensUsed:  {toServer: false, type: Number, value: 0},
        hlQuotes:           {isLocal: true, type: Object, value: {}},
        percentFilled:      {type: Number, value: 0},

        addReapplyToken: function() {
            this.reapplyTokensLeft++;
            return this.persistSave();
        },

        removeReapplyToken: function() {
            if (this.reapplyTokensLeft > 0) {
                this.reapplyTokensLeft--;
                return this.persistSave();
            }
        },

        applyTokenUsed: function() {
            if (this.reapplyTokensLeft > 0) {
                this.reapplyTokensLeft--;
                this.reapplyTokensUsed++;
            }
        },

        // Marketing Metrics
        lastPageVisited:    {type: String, value: 'home'},
        variations:         {type: String, value: ''},
        referrers:          {type: String, value: ''},
        primaryReferrer:    {type: String, value: ''},
        metrics:            {type: Object, value: {}},

        originalReferrer:   {toServer: false, type: String, value: ''},
        currentReferrer:    {toServer: false, type: String, value: ''},
        timeOfFirstVisit:   {toServer: false, type: Number, value: 0},
        visitorId:          {toServer: false, type: String, value: ''},

        click2callSawPopup:      {type: Boolean, value: false},
        click2callFirstTime:     {type: Boolean, isLocal: true, value: true},
        click2callAction:        {type: String, isLocal: true},
        click2callPhone:         {type: String, isLocal: true, rule: ["required", "telephone"]},
        click2callName:          {type: String, isLocal: true},
        click2callDate:          {type: String, isLocal: true, rule: ["required"]},
        click2callDateValues: function() {
            var values = [];
            var d = new Date();
            var hoursBehindET = (d.getTimezoneOffset() - 240)/60; //240 is for EDT.  Fix this before November!
            var businessHours = {start:9 - hoursBehindET, end:18 - hoursBehindET};
            var isWorkday = function(d) {
                /*var holidays = ['5/30/2016', '7/4/2016', '9/5/2016', '11/24/2016', '12/26/2016'];
                if (holidays.indexOf(controller.formatDate(d)) > -1) {
                    return false;
                }*/
                var dayOfWeek = d.getDay();
                return dayOfWeek !== 0 && dayOfWeek !== 6;
            };
            var time = (d.getHours()+hoursBehindET)*100 + d.getMinutes();
            if (isWorkday(d) && time < (businessHours.end - 1)*100 + 30) {
                values.push(d.toISOString().slice(0, 10));
            }
            for (var i = 1; i < 8; i++) {
                d = new Date();
                d.setDate(d.getDate() + i);
                if (isWorkday(d)) {
                    values.push(d.toISOString().slice(0, 10));
                }
            }
            return values;
        },
        click2callDateDescriptions: function(){
            var obj = {};
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (var i = -1; i <= 8; i++) {
                var d = new Date();
                d.setDate(d.getDate() + i);
                var dateStr = days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate();
                dateStr += (i===0 ? ' (Today)' : '') + (i===1 ? ' (Tomorrow)' : '');
                obj[d.toISOString().slice(0, 10)] = dateStr;
            }
            return obj;
        },

        click2callTime:          {type: String, isLocal: true, rule: ["required"]},
        click2callTimeValues: function() {
            var values = ['900', '930', '1000', '1030', '1100', '1130', '1200', '1230', '1300', '1330', '1400', '1430', '1500', '1530', '1600', '1630', '1700', '1730'];
            var d = new Date();
            if (this.click2callDate === d.toISOString().slice(0, 10)) {
                var hoursBehindET = (d.getTimezoneOffset() - 240)/60; //240 is for EDT.  Fix this before November!
                d.setMinutes(d.getMinutes()+15); //add a little cushion
                var minCallTime = (d.getHours()+hoursBehindET)*100 + d.getMinutes();
                while (values.length > 1 && Number(values[0]) < minCallTime) {
                    values.shift();
                }
            }
            return values;
        },
        click2callTimeDescriptions: {type: Object, isLocal: true, value: {'900':'9:00 AM', '930':'9:30 AM', '1000':'10:00 AM', '1030':'10:30 AM', '1100':'11:00 AM', '1130':'11:30 AM', '1200':'12:00 PM', '1230':'12:30 PM', '1300':'1:00 PM', '1330':'1:30 PM', '1400':'2:00 PM', '1430':'2:30 PM', '1500':'3:00 PM', '1530':'3:30 PM', '1600':'4:00 PM', '1630':'4:30 PM', '1700':'5:00 PM', '1730':'5:30 PM'}},

        submitClick2CallNow: function() {
            var name = this.click2callName,
                phone = controller.formatTelephone(this.click2callPhone);
            $zopim(function() {
                var isChatting = $zopim.livechat.isChatting();
                $zopim.livechat.setName(name || 'user');
                $zopim.livechat.addTags('outreach'); //to block the auto-response trigger
                $zopim.livechat.say('Call requested at ' + phone);
                if (!isChatting) {
                    $zopim.livechat.hideAll();
                }
            });
        },

        submitClick2CallLater: function() {
            var name = this.click2callName,
                phone = controller.formatTelephone(this.click2callPhone),
                date = this.click2callDateDescriptions()[this.click2callDate],
                time = this.click2callTimeDescriptions[this.click2callTime];
            controller.sendClick2CallEmail(name, phone, date, time);
        },

        setAnalytics: function(originalReferrer, currentReferrer, timeOfFirstVisit, visitorId) {
            if (!this.originalReferrer) { this.originalReferrer = originalReferrer; }
            if (!this.timeOfFirstVisit) { this.timeOfFirstVisit = timeOfFirstVisit; }
            this.visitorId = visitorId;
            this.currentReferrer = currentReferrer;
        },

        // Obsolete
        applyingFor:        {type: String, value: 'both'},
        termQuoteMode:      {type: String, value: 'all'},
        customerSelection:  {type: Number, value: 0},

        selectAll: function () {
            this.resetQuoteFiltering();
            this.termQuoteMode = 'all';
        },
        selectAPlusPlus: function () {
            this.resetQuoteFiltering();
            this.ratingSelection = 15;
            this.termQuoteMode = 'all';
        },
        selectConvertible: function () {
            this.termQuoteMode = 'convertible';
        },
        selectLadder: function () {
            this.resetQuoteFiltering();
            this.termQuoteMode = 'ladder';
        },
        resetQuoteFiltering: function() {
            this.ratingSelection = 10;
            this.paymentPerformanceSelection = 0;
            this.complaintSelection = 0;
        },

        // Local data never persisted
        quoteEngine:  {type: Quotes, persist: false},

        init: function() {
            this.reset();
        },

        clientInit: function () {
            this.assumptions = Assumptions;
            var year;
            for (year = 2014; year < 2150; ++year) {
                this.assumptions.ssnTable[year] = [this.assumptions.ssnTable[year - 1][0] * (1 + this.assumptions.ssnCOLA), 1];
            }

            for (year = 2015; year < 2150; ++year) {
                this.assumptions.ssnMaxIncome[year] = this.assumptions.ssnMaxIncome[year - 1] * (1 + this.assumptions.ssnCOLA);
            }

            if (this.primaryCustomer) { this.primaryCustomer.clientInit(); }
            if (this.alternateCustomer) { this.alternateCustomer.clientInit(); }

            this.quoteEngine = new Quotes(this);
        },
        reset: function() {
            this.clientInit();
            this.persons = [];
            this.addresses = [];
            this.phones = [];
            this.primaryCustomer = new Applicant('', null, '', this);
            this.alternateCustomer = new Applicant('', null, 32, this);
            this.alternateCustomer.addressSameAsPrimary = true;
        },
        getProposedInsured: function () {
            var customers = [];
            customers.push(this.primaryCustomer);
            return customers;
        },
        getCombinedCost: function () {
            return this.getEstimatedPolicyCost(false) +  this.getEstimatedPolicyCost(true);
        },
        getEstimatedPolicyTotal: function () {
            var quotes = this.quoteEngine.getQuote(false);
            var monthly = 0;
            if (quotes) {
                for (var ix = 0; ix < quotes.customers.length; ++ix) {
                    monthly += quotes.customers[ix].lowest.singleMonthly;
                }
            }
            return monthly;
        },
            /**
             * Get estimated cost of policy
             * @param alternate true if cost for alternate cutomer
             * @param face - used to override primary customer face amount
             * @returns {*}
             */
        getEstimatedPolicyCost: function (alternate) {
            var quotes = this.getQuote(false);
            if (quotes && quotes.customers && quotes.customers.length > (alternate ? 1 : 0)) {
                return quotes.customers[alternate ? 1 : 0].quotes.length > 0 ?
                    quotes.customers[alternate ? 1 : 0].lowest.singleMonthly : 0;
            }
            return 0;
        },
        /**
         * Returns 0 for primary insured and 1 for alternate
         * @returns {*}
         */
        getSelectedCustomerIndex: function () {
            return this.customerSelection;
        },
        /**
         * find the currently selected customer who needs insurance
         *
         * @param alternate
         * @returns {*} customer
         */
        getInsuredCustomer: function (alternate) {
            return this.getProposedInsured()[this.getInsuredCustomerIndex(alternate)];
        },
        /**
         * Get and index for use with getProposedInsured
         * @param alternate - true to force reverse
         * @returns {number} index
         */
        getInsuredCustomerIndex: function (alternate) {
            var insured = this.getProposedInsured();
            return insured.length == 1 ? 0 : (alternate ?
               (this.getSelectedCustomerIndex() == 0 ? 1: 0) : this.getSelectedCustomerIndex());
        },

        /**
         * Should be overridden in derived classes
         * @returns {{face: *, overTime: *, term: *, applicant: *, state: *, scnearioFace: *, scenarioTerm: *}}
         */
        getQuoteOptions: function(scenario){
            return {};
        },

        getQuote: function (showError, brand) {
            var quote = this.quoteEngine.getQuote(showError, brand, this.getQuoteOptions());
            return quote ? quote : this.getHLQuote([]);
        },
        getQuotes: function (type, max, ignoreFilters, brand) {
            max = max ? max : 20;
            var ratingSelection = ignoreFilters ? 10 : this.ratingSelection;
            var convertible = this.termQuoteMode;
            switch (type) {
                case 'A++': convertible = 'mix';ratingSelection=15;break;
                case 'all': convertible = 'mix';break;
                case 'ladder': convertible = 'ladder'; break;
                case 'convertible': convertible = 'convertible'; break;
            }
            var index  = this.getInsuredCustomerIndex();
            var filteredQuotes = brand == 'HAVE' ? [] :
            this.quoteEngine.filterQuotes(this.quoteEngine.getQuote(false, brand, this.getQuoteOptions()),
                max, index, convertible,
                ignoreFilters ? 9999 : this.complaintThresholds[this.complaintSelection],
                ignoreFilters ? 9999 : this.paymentPerformanceThresholds[this.paymentPerformanceSelection],
                ratingSelection,
                ignoreFilters ? {'All': {value: true} } : this.brandSelection);

            var rank = {'A++':2, 'A+': 1, 'A':0};
            filteredQuotes.sort(function (quotea, quoteb) {
                return rank[quoteb.policies[0].rating] > rank[quotea.policies[0].rating];
            }.bind(this));
            // Get Haven Life quote and add it to the top of the list
            return this.getHLQuote(filteredQuotes);
        },

        getBand: function(face){
            var band;
            if (face >= 100000 && face <= 249999) {
                band = '1';
            }
            else if (face >= 250000 && face <= 499999) {
                band = '2';
            }
            else if (face >= 500000 && face <= 1000000) {
                band = '3';
            }
            return band;
        },

        getHLQuote: function(filteredQuotes, scenario){

            // First check state of primary customer
            if(!this.isValidState(this.primaryCustomer.address.state)){
                return filteredQuotes;
            }

            var quoteOpts = this.getQuoteOptions(scenario);
            var face = typeof(scenario) == 'undefined' ? quoteOpts.face : quoteOpts.scenarioFace;
            var term = typeof(scenario) == 'undefined' ? quoteOpts.term : quoteOpts.scenarioTerm;

            if (face && term) {
                var gender = this.primaryCustomer.gender;
                var healthClass = this.primaryCustomer.healthClass.split('S')[0];
                if (healthClass === 'Rg') { healthClass = 'R+'; }

                var smoker = this.primaryCustomer.smoker ? 'yes' : 'no';
                // If health class is Pf+ and is smoker, drop the class to Pf
                if (healthClass === 'P+' && this.primaryCustomer.smoker) { healthClass = 'Pf'; }

                var age = this.primaryCustomer.person.age;
                if (age > 44) return filteredQuotes;

                return this.quoteEngine.fetchProductQuote(filteredQuotes, quoteOpts.product.quoteKey ,gender, healthClass, smoker, age, term, face);
            } else {
                return filteredQuotes;
            }
        },


        addHavenQuote: function(havenQuote, filteredQuotes){
            var quoteDataStructure = {};
            quoteDataStructure['costs'] = [{cost: havenQuote.policies[0].monthly}];
            quoteDataStructure['policies'] = havenQuote.policies;

            var allQuotes = filteredQuotes.slice(0, filteredQuotes.length);
            allQuotes.splice(0, 0, quoteDataStructure);

            return allQuotes;
        },

        setQuote: function (type, ix, count, brand) {
            var quote = JSON.parse(JSON.stringify(this.getQuotes(type, count, false, brand)[ix]));
            for (ix = 0; ix < quote.policies; ++ix) { delete quote.policies[ix].insurer; }
            quote.customer = this.getInsuredCustomer;
            this.getInsuredCustomer().selectedQuote = quote;
        },

        getPolicyTotal: function () {
            var customers = this.getSelectedQuote().customers;
            var monthly = 0;
            for (var ix = 0; ix < customers.length; ++ix) {
                for (var jx = 0; jx < customers[ix].policies.length; ++jx) {
                    monthly += customers[ix].policies[jx].monthly;
                }
                return monthly;
            }
        },
        createPolicy:{
            on: 'server', // SecReviewed
            body: function (selectedQuote) {
                if (this.applicationPolicy && this.applicationPolicy.isSubmitting()) {
                    throw 'Application in Progress - Cannot start a new one';
                }
                if (!this.applicationPolicy) {
                    this.applicationPolicy = new Policy(this);
                    this.policies.push(this.applicationPolicy);
                }
                this.applicationPolicy.setQuote(JSON.parse(JSON.stringify(selectedQuote)));
            }
        },

        cancelAndCreateNewPolicy: {
            on: 'server', // SecReviewed
            body: function () {

                /**
                 * If there is an policy in flight already, make sure it was canceled previously. If
                 * yes, clone the current application policy and mark it as the in flight one.
                 * At the end of this we should have:
                 *  - The original policy and all of it's related objects intact and now part of policies
                 *  - A deep copy (minus customer) of the original policy as applicationPolicy
                 *  - Any other related objects such as capital needs adjusted to point to the new applicant
                 */

                if (this.applicationPolicy && this.applicationPolicy.wasCanceledDeclinedRejected()) {
                    console.log('Reapplying...');

                    // Clone the policy excluding workflow
                    var oldPolicy = this.applicationPolicy;
                    var oldWorkflow = this.applicationPolicy.workflow;
                    this.applicationPolicy.workflow = null;
                    var newPolicy = this.applicationPolicy.createClonedPolicy();

                    // Start with insured and owner as different objects as that's how a new policy
                    // is setup
                    if(newPolicy.insuredType === newPolicy.ownerType){

                        console.log('Creating new Owner person, address and phone ....');
                        newPolicy.ownerPerson = new Person(this);
                        newPolicy.ownerPersonResidentialAddress = new Address(this);
                        newPolicy.ownerPersonPhone = new Phone(this);
                    }

                    oldPolicy.workflow = oldWorkflow;

                    // Clear out old workflow's data if any
                    newPolicy.resetWorkflowProps();

                    console.log('Cancelled Policy ' + oldPolicy.policyNumber);

                    // Save the cloned policy and don't show the cancelled policy in the
                    // account center anymore
                    // In flight policy is now the cloned policy
                    this.applicationPolicy = newPolicy;
                    oldPolicy.removeFromAccountCenter();
                    this.policies.push(newPolicy);

                    this.primaryCustomer = this.applicationPolicy.insured;
                    this.capitalNeeds.resetOrder();
                    this.capitalNeeds.earnedIncome[0].applicant = this.primaryCustomer;
                    this.capitalNeeds.income[0].applicant = this.primaryCustomer;

                    return Q(true);

                } else {
                    return Q(false);
            }
            }
        },

        submitPolicy: {
            on: 'server',   // SecReviewed
            body: function () {
                // Make sure this is not a duplicate submission
                if (this.applicationPolicy.submittedAt) { return true; }

                // Client should have validated email
                if (!this.emailValidated) { throw new Error('Internal Error - email not validated'); }

                // Update progress, submit the policy to workflow and motor on.
                this.progress = 13;
                this.applicationPolicy.submittedAt = new Date();
                this.applicationPolicy.submittedFromIP = objectTemplate.incomingIP;

                console.log('Creating workflow');

                var setTransientTrue = function() {
                    objectTemplate.__transient__ = true;
                    return Q();
                }.bind(this);

                var setTransientFalse = function() {
                    console.log('Workflow created for policy #' + this.applicationPolicy.policyNumber);
                    objectTemplate.__transient__ = false;
                }.bind(this);

                var assignPolicyNumber = function() {
                    return this.applicationPolicy.assignPolicyNumber();
                }.bind(this);

                var startWorkflow = function () {
                    return this.applicationPolicy.startWorkflow();
                }.bind(this);

                return assignPolicyNumber()
                    .then(setTransientTrue)
                    .then(startWorkflow)
                    .finally(setTransientFalse);
            }
        },
        addForms: function(forms) { //forms is array of {typeName, doc}
            for (var i = 0; i < forms.length; ++i) {
                this.applicationPolicy.addPolicyDocPDF(forms[i].doc, 'app', forms[i].typeName);
            }
        },
        getSelectedQuote: function(showAll) {
            var customers = [];
            var quote;
            if (this.primaryCustomer.selectedQuote && !this.primaryCustomer.policyHidden) {
                quote = JSON.parse(JSON.stringify(this.primaryCustomer.selectedQuote));
                quote.customer = this.primaryCustomer;
                customers.push(quote);
            } else {
                var quoteOpts = this.getQuoteOptions();
                if (showAll && !this.primaryCustomer.policyHidden && quoteOpts.face > 0) {
                    customers.push({customer: this.primaryCustomer});
                }
            }

            // Not dealing with quoting alternate customers at this point
            //if (this.alternateCustomer.selectedQuote && !this.alternateCustomer.policyHidden) {
            //    quote = JSON.parse(JSON.stringify(this.alternateCustomer.selectedQuote));
            //    quote.customer = this.alternateCustomer;
            //    customers.push(quote);
            //} else {
            //    if (showAll && !this.alternateCustomer.policyHidden && this.capitalNeeds.getFace(true) > 0) {
            //        customers.push({customer: this.alternateCustomer});
            //    }
            //}

            return this.quoteEngine.getSelectedQuote(customers);
        },
        isQuoteError: function () {
            var quote = this.getQuote(true);
            return quote && quote.error;
        },
        getQuoteError: function () {
            var quote = this.getQuote(true);
            return quote && quote.error ? quote.error : false;
        },
        compute: function() {
            if (this.quoteEngine) { this.quoteEngine.compute(); }
        },
        getSurvivor: function(deceased) {
            return deceased == this.primaryCustomer ? this.alternateCustomer : this.primaryCustomer;
        },
        remove: function () {
            return this.persistDelete();
        }
    });

    /**
     * Creates a new customer based on referral information
     * @param {String} referralAttributes - A collection of attributes to assign to the new customer.
     * @return {Object} The new customer.
     */
    Customer.createReferredCustomer = function(referralAttributes) {

        return createNew();

        function createNew() {
            var txn = objectTemplate.begin();
            var customer = new Customer();

            var referral = new Referral();
            referral.referrer = referralAttributes.referrer;
            referral.referralId = referralAttributes.referral;
            referral.postBody = referralAttributes;

            customer.referral = referral;

            customer.selectedQuote = {};
            customer.selectedQuote.costs = [];
            var costToPush = {};
            costToPush.cost = referralAttributes.policyPrice;
            customer.selectedQuote.costs.push(costToPush);

            customer.selectedQuote.policies = [];
            var policyToPush = {};
            policyToPush.carrier = 'MassMutual';
            policyToPush.carrierCode = 'HAVE';
            policyToPush.face = referralAttributes.face;
            policyToPush.isHaven = true;
            policyToPush.logo = 'HLIF-transparent-inhouse.png';
            policyToPush.monthly = referralAttributes.policyPrice;
            policyToPush.rating = 'A++';
            policyToPush.term = referralAttributes.termPeriod;
            customer.selectedQuote.policies.push(policyToPush);

            customer.progress = 10;

            customer.primaryCustomer.person.firstName = referralAttributes.firstName;
            customer.primaryCustomer.person.middleName = referralAttributes.middleInitial;
            customer.primaryCustomer.person.lastName = referralAttributes.lastName;
            customer.primaryCustomer.person.email = referralAttributes.email;

            customer.primaryCustomer.person.gender = (referralAttributes.gender.toString() == 'Male') ? 1 : 2;

            if (!isNaN(referralAttributes.age)) {
                customer.primaryCustomer.person.age = parseInt(referralAttributes.age);
            }

            try {
                customer.primaryCustomer.person.dob = new Date(referralAttributes.dateOfBirth);
            }
            catch (error) {
                console.log(referralAttributes.dateOfBirth + ' is not a valid date.');
            }

            customer.primaryCustomer.address.street = referralAttributes.address1;
            customer.primaryCustomer.address.line1 = referralAttributes.address2;
            customer.primaryCustomer.address.city = referralAttributes.city;
            customer.primaryCustomer.address.zip = referralAttributes.zip;
            customer.primaryCustomer.address.state = referralAttributes.state;

            customer.primaryCustomer.phone.number = referralAttributes.phone;
            customer.primaryCustomer.phone.type = 12;

            customer.primaryCustomer.gender = referralAttributes.gender.toString().toLowerCase();

            var toCheck = parseInt(referralAttributes.underwritingClass);
            if (toCheck === 1) { customer.primaryCustomer.healthClass = 'P+';  }
            else if (toCheck === 2) { customer.primaryCustomer.healthClass = 'Pf';  }
            else if (toCheck === 3) { customer.primaryCustomer.healthClass = 'R+';  }
            else if (toCheck === 4) { customer.primaryCustomer.healthClass = 'Rg';  }
            else if (toCheck === 5) { customer.primaryCustomer.healthClass = 'P+S'; }
            else if (toCheck === 6) { customer.primaryCustomer.healthClass = 'PfS'; }
            else if (toCheck === 7) { customer.primaryCustomer.healthClass = 'R+S'; }
            else if (toCheck === 8) { customer.primaryCustomer.healthClass = 'RgS'; }
            else {
                throw new Error('Customer must have valid underwriting class.');
            }

            customer.primaryCustomer.weight = parseInt(referralAttributes.weight);
            customer.primaryCustomer.height = parseInt(referralAttributes.height);

            if (referralAttributes.height) {
                customer.primaryCustomer.heightFeet = Math.floor(referralAttributes.height / 12);
                customer.primaryCustomer.heightInches = referralAttributes.height % 12;
            }

            customer.primaryCustomer.selectedQuote = customer.selectedQuote;

            return objectTemplate.end(txn)
                .then(function () {
                    return customer;
                }.bind(this));
        }
    };

    // A skeleton query for doing lookups including policy data
    // !!!! NEVER NEVER persistSave this!
    var CustomerQuery = objectTemplate.create('CustomerQuery', {
        persons:            {type: Array, of: PersonQuery},
        primaryCustomer:    {type: ApplicantQuery},
        alternateCustomer:  {type: ApplicantQuery},
        policies:           {type: Array, of: PolicyQuery},
        applicationPolicy:  {type: PolicyQuery},
        //policyDocs:         {type: Array, of: PolicyDocQuery}  There is no such relationship.  Cannot find a references
    });

    Visitor.mixin({
        customer:       {type: Customer}
    });
    Applicant.mixin({
        customer:       {type: Customer}
    });
    Person.mixin({
        customer:       {type: Customer}
    });
    Entity.mixin({
        customer:       {type: Customer}
    });
    Phone.mixin({
        customer:       {type: Customer}
    });
    Address.mixin({
        customer:       {type: Customer}
    });
    FamilyHistory.mixin({
        customer:       {type: Customer}
    });
    FamilyCondition.mixin({
        customer:       {type: Customer}
    });
    PersonalHistory.mixin({
        customer:       {type: Customer}
    });
    DiagnosisShort.mixin({
        customer:       {type: Customer}
    });
    RX.mixin({
        customer:       {type: Customer}
    });
    Diagnosis.mixin({
        customer:       {type: Customer}
    });
    Surgery.mixin({
        customer:       {type: Customer}
    });
    RiskFactors.mixin({
        customer:       {type: Customer}
    });
    Avocation.mixin({
        customer:       {type: Customer}
    });
    AccidentAtFault.mixin({
        customer:       {type: Customer}
    });
    SpeedingTicket.mixin({
        customer:       {type: Customer}
    });
    RecklessTicket.mixin({
        customer:       {type: Customer}
    });
    OtherMovingViolation.mixin({
        customer:       {type: Customer}
    });
    DrivingWhileSuspendedCon.mixin({
        customer:       {type: Customer}
    });
    TravelCountry.mixin({
        customer:       {type: Customer}
    });
    ExistingPolicies.mixin({
        customer:       {type: Customer}
    });
    ExistingPolicy.mixin({
        customer:       {type: Customer}
    });

    return {
        Customer: Customer,
        CustomerQuery: CustomerQuery,
        Settings: Settings
    };
};
