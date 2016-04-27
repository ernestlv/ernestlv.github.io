module.exports.applicationController = function(objectTemplate, getTemplate) {
    if (typeof(require) !== 'undefined') {
        Q = require('q');
        var testMode = (objectTemplate.config.nconf.get('environment ') != 'production') ? objectTemplate.config.nconf.get('test') || '' : '';
    }

    var ApplicantTemplates      = getTemplate('./customer/Applicant.js'),
        FamilyHistory           = ApplicantTemplates.FamilyHistory,
        PersonalHistory         = ApplicantTemplates.PersonalHistory,
        ExistingPolicies        = ApplicantTemplates.ExistingPolicies,
        RiskFactors             = ApplicantTemplates.RiskFactors,
        RX                      = ApplicantTemplates.RX;

    var PersonTemplates         = getTemplate('./customer/Person.js'),
        Person                  = PersonTemplates.Person,
        Address                 = PersonTemplates.Address;

    var PolicyTemplates         = getTemplate('./customer/Policy.js'),
        Policy                  = PolicyTemplates.Policy;

    getTemplate('./static/Assumptions.js').Assumptions;

    var InsurersTemplates       = getTemplate('./static/Insurers.js'),
        Insurers                = InsurersTemplates.Insurers;

    var NodeTemplates           = getTemplate('./Node.js'),
        Node                    = NodeTemplates.Node,
        NoneNode                = NodeTemplates.NoneNode,
        OtherNotSureNode        = NodeTemplates.OtherNotSureNode;

    var MetadataAdmin           = getTemplate('./metadata/MetadataAdmin.js');
    var Utils                   = getTemplate('./Utils.js').Utils;

    var ApplicationController = objectTemplate.create('ApplicationController', {
        haveAccount: {
            type: Boolean,
            value: false
        },
        haveAccountValues:  {
            isLocal: true,
            type: Array,
            value: ['false', 'true']
        },
        haveAccountDescriptions: {
            isLocal: true,
            type: Object,
            value: {
                'false': 'I need an account',
                'true': 'I already have an account'
            }
        },
        agreesToTerms: {
            type: Boolean,
            value: false
        },
        acknowledgementOwner: {
            type: Boolean,
            value: false
        },
        acknowledgementInsured: {
            type: Boolean,
            value: false
        },
        ownerEmail: {
            type: String,
            value: null,
            rule: ['text', 'email', 'required']
        },
        editingOwnerEmail: {
            type: Boolean,
            value: false
        },
        ownerEmailChanged: {
            type: Boolean,
            value: false
        },
        editingSecondaryEmail: {
            type: Boolean,
            value: false
        },
        secondaryEmail: {
            type: String,
            value: null,
            rule:['text', 'email', 'required']
        },
        secondaryEmailChanged: {
            type: Boolean,
            value: false
        },
        validationCode: {
            type: String,
            value: ''
        },
        insuredZip: {
            type: String,
            rule: ['zip5', 'required'],
            length: 5,
            value: null
        },
        notSoldInState: {
            type: String,
            value: 'your state'
        },
        questionsAnswered: {
            isLocal: true,
            type:Number,
            value: 0
        },
        applicationReady: {
            isLocal: true,
            type: Boolean,
            value: false
        },
        firstRender: {
            isLocal:true,
            type: Boolean
        },
        lastFocus: {
            isLocal:true,
            type: Object
        },
        notSupportedReason: {
            isLocal:true,
            type: String
        },
        scrollEventSet: {
            isLocal: true,
            type: Boolean,
            value: false
        },
        applyRegisterReady: {
            isLocal: true,
            type: Boolean,
            value: false
        },

        isValidating: {
            isLocal: true,
            type: Boolean,
            value: false
        },

        isRegistering: {
            isLocal: true,
            type: Boolean,
            value: false
        },

        init: function (controller) {
            this.controller = controller;
        },

        reset: function(){
        },

        exit: function() {
            this.applicationReady = false;
            this.unsetScrollActions();
            this.firstRender = true;
        },

        enter: function(route) {
            if (route) {
                var routeEnterFunctionName = Utils.toCapitalCamelCase(route);
                this['enter' + routeEnterFunctionName]();
            } else {
                this.scrollEventSet = false;
                this.controller.analyticsController.addCustomData('QuestionsAnswered', 0);
                return this.setupAppTree();
            }
        },

        enterApplyIntroRegister: function() {
            if (this.controller.loggedIn) {
                this.controller.route.public.apply_intro();
                return;
            }

            this.applyRegisterReady = false;
            var compileForm = function compileForm() {
                this.compileApplyRegisterForm();
                this.controller.refresh();
                this.applyRegisterReady = true;
            }.bind(this);

            setTimeout(compileForm, 100);
        },

        enterApplyQuotacy: function() {
            if (this.controller.loggedIn) {
                this.controller.route.public.apply_intro();
                return;
            }

            this.applyRegisterReady = false;
            var compileForm = function compileForm() {
                this.compileApplyQuotacyForm();
                this.controller.refresh();
                this.applyRegisterReady = true;
            }.bind(this);

            setTimeout(compileForm, 100);
        },

        compileApplyRegisterForm: function() {
            var partialNames = $('script[type="text/x-handlebars-template"]').get().map(function(element){
                return element.id;
            });

            _.each(partialNames, function(partialName){
                var partialContent = $('#' + partialName).html();
                Handlebars.registerPartial(partialName, partialContent);
            });

            this.registerHandlebarsHelpers();

            var baseContent = $('#application-register-base').html();
            var baseTemplate = Handlebars.compile(baseContent);
            var html = baseTemplate();

            $('#apply-register-form').html(html);

            this.setupZipLookup();
        },

        compileApplyQuotacyForm: function() {
            var partialNames = $('script[type="text/x-handlebars-template"]').get().map(function(element){
                return element.id;
            });

            _.each(partialNames, function(partialName){
                var partialContent = $('#' + partialName).html();
                Handlebars.registerPartial(partialName, partialContent);
            });

            this.registerHandlebarsHelpers();

            var baseContent = $('#application-quotacy-base').html();
            var baseTemplate = Handlebars.compile(baseContent);
            var html = baseTemplate();

            $('#apply-register-form').html(html);

            this.setupZipLookup();
        },

        continueApplication: function() {
            console.log(this.controller.accountCenterController.getApplicationRouteId());
            this.controller.router.goToById(this.controller.accountCenterController.getApplicationRouteId());
        },

        renderApplication: function() {
            this.showAppAssistant();
            this.applicationReady = true;
        },

        getApplicationLoadingClass: function() {
            if (this.applicationReady) { return 'application-ready'; }
            return 'application-loading';
        },

        learnMoreClicked: function() {
            // Track for GA
            this.controller.analyticsController.addCustomEvent('LearnMore', 'Left');
        },

        setScrollActions: function() {
            if(!this.scrollEventSet){
                $(window).scroll(this.scrollProcessing.bind(this));
                $(window).resize(this.showAppAssistant.bind(this));
                this.scrollEventSet = true;
            }
        },

        unsetScrollActions: function() {
            $(window).off('scroll');
            $(window).off('resize');
            this.scrollEventSet = false;
        },

        showLogInForm: function() {
            this.haveAccount = true;
        },

        showRegisterForm: function() {
            this.haveAccount = false;
        },

        applyIntroFullHeader: function() {
            var haveAccount = this.haveAccount;
            var newAccountHeader        = 'Apply now for immediate approval. No obligation.';
            var loggedOutAccountHeader  = 'Please sign in';

            if (!haveAccount) { return newAccountHeader; }
            if (haveAccount) { return loggedOutAccountHeader; }
        },

        selectedQuoteFaceTerm: function() {
            var selectedQuote   = this.controller.customer.selectedQuote;
            var selectedPolicy  = selectedQuote.policies[0];

            var productNames = {
                'HAVE': 'Haven Term'
            };

            var productName = productNames[selectedPolicy.carrierCode];
            var faceAmount  = numeral(selectedPolicy.face).format('$0,0');
            var term        = selectedPolicy.term + ' year';

            return [productName, faceAmount, '/', term].join(' ');
        },

        selectedQuoteMonthlyCost: function() {
            var selectedQuote   = this.controller.customer.selectedQuote;
            var selectedPolicy  = selectedQuote.policies[0];

            var monthlyCost = numeral(selectedPolicy.monthly).format('$0,0.00');

            return [monthlyCost, 'per month'].join(' ');
        },

        // Customer selects a quote from the quotes page
        quoteSelected: function (row) {

            // if coming from quick quote, set corresponding dimensions/events
            if(this.controller.customer.primaryCustomer.overrideAmount){
                this.controller.analyticsController.addCustomData('InsuredAge', this.controller.customer.primaryCustomer.person.age);
                this.controller.analyticsController.addCustomData('ZipCode', this.controller.needsController.zip);
                this.controller.analyticsController.addCustomData('InsuredGender', this.controller.customer.primaryCustomer.gender);
                this.controller.analyticsController.addCustomData('FaceAmount', this.controller.customer.primaryCustomer.overrideAmount);
                this.controller.analyticsController.addCustomEvent('InitialHealth', this.controller.customer.primaryCustomer.healthClassNumber);
                this.controller.analyticsController.addCustomEvent('InitialHealth', this.controller.customer.primaryCustomer.smoker);
            }

            this.controller.customer.selectedQuote = row;

            // Proceed only if the customer is in a state where we can sell HL insurance.
            this.insuredZip = this.controller.customer.primaryCustomer.address.zip;

            if(this.controller.isProductSoldIn(this.controller.customer.primaryCustomer.address.state)) {
                this.controller.customer.progress = 10;
                    // If this row is not equal to MM or HL render not_offered popup to prevent purchase
                if ( row.policies[0].carrierCode !== 'HAVE'){
                    this.controller.route.public.dialog.not_offered_yet();

                    // Track for GA
                    this.controller.analyticsController.addCustomEvent('LearnMore', 'Any');
                    this.controller.analyticsController.addCustomEvent('LearnMore', Insurers.companies[row.policies[0].carrierCode].shortName);
                }
                else {
                    this.controller.route.public[this.controller.loggedIn ? 'apply_intro' : 'apply_intro_register']();
                    this.controller.analyticsController.inspectletEvent(['tagSession', 'apply now']);
                }
            }
            else{
                this.controller.route.public.dialog.invalid_state_quotes();
            }
        },

        // Customer select next on intro screen
        introNext: function () {
            // For analytics
            this.controller.analyticsController.addCustomEvent('FinalFaceAmount', this.controller.customer.selectedQuote.policies[0].face);
            this.controller.analyticsController.addCustomEvent('FinalTerm', this.controller.customer.selectedQuote.policies[0].term);
            this.controller.analyticsController.addCustomEvent('FinalMonthlyPremium', this.controller.customer.selectedQuote.policies[0].monthly);

            if (!this.controller.loggedIn) {
                this.controller.customer.progress = 11;
                this.controller.route.public.apply_register();
            } else {
                this.controller.customer.progress = 12;
                this.createPolicy().then(function () {
                    this.controller.route.private.apply_form();
                }.bind(this));
            }
            this.controller.publicSave();
        },

        registerFromPopup: function(source) {
            var validate = true;// = this.controller.validate(); done by publicRegister, don't need to do it here
            if (!this.agreesToTerms) {
                validate = false;
                this.controller.setError(this, 'agreesToTerms', {message: 'agree'});
            } else {
                this.controller.clearError(this, 'agreesToTerms');
            }

            if (validate) {
                this.controller.newPassword = this.controller.password;
                this.controller.confirmPassword = this.controller.password;
                return this.controller.publicRegister(document.location.href).then(function () {
                    this.controller.router.popRoute();

                    // Also subscribe to mailchimp
                    this.controller.homeController.signupFromApp(this.controller.email, this.controller.customer.primaryCustomer.address.zip, source);

                    // Update analytics
                    this.controller.analyticsController.loginRegister();

                    return Q(true);
                }.bind(this), function (err) {
                    this.controller.error = err.text || '';
                    return Q(false);
                });
            }
        },

        // Customer registers or signs in
        registerNext: function () {
            this.isValidating = true;
            var validate = this.controller.validate();
            this.isValidating = false;

            // Verify if agreesToTerms has been checked only on a new account
            if(!this.haveAccount) {
                if (!this.agreesToTerms) {
                    validate = false;
                    this.controller.setError(this, 'agreesToTerms', {message: 'agree'});
                } else {
                    this.controller.clearError(this, 'agreesToTerms');
                }
            }

            if (validate) {
                if (this.controller.loggedIn) {
                    return Q(true).then(function () {
                        return this.createPolicy();
                    }.bind(this), function (err) {
                        this.controller.error = err.text || '';
                        return Q(false);
                    }.bind(this)).then(function (success) {
                        if (success) { this.controller.route.private.apply_form(); }
                        return Q(true);
                    }.bind(this));
                } else if (this.haveAccount) {
                    var needs = this.controller.customer.capitalNeeds;
                    var profile = this.controller.customer.profile;
                    return this.controller.publicControllerLogin().then(function () {

                        // Create a new GA session as we don't want the
                        // current session's values overwriting the existing userid's session
                        this.controller.analyticsController.createSession();

                        // If a policy is already in flight, route to account center
                        if(this.controller.customer.progress > 12 ||
                            (this.controller.customer.applicationPolicy && this.controller.customer.applicationPolicy.workflowState)){
                            this.controller.customer.progress = 13;
                            this.controller.router.goToById(this.controller.accountCenterController.getLoginRouteId());
                            return Q(true);
                        }
                        else {
                            this.controller.customer.clientInit();
                            var customer = this.controller.customer;
                            needs.customer = customer;
                            this.controller.customer.capitalNeeds = needs.createCopyWithCustomer(this.controller.customer);
                            this.controller.customer.profile = profile.createCopyWithCustomer(this.controller.customer);
                            this.controller.publicSave();
                            this.controller.customer.progress = 12;

                            this.controller.analyticsController.loginRegister();
                            return this.createPolicy();
                        }
                    }.bind(this), function (err) {
                        this.controller.error = err.text || '';
                        return Q(false);
                    }.bind(this)).then(function (success) {
                        if (success) { this.controller.route.private.apply_form(); }
                        return Q(true);
                    }.bind(this)).then(function () {
                        this.clearPasswords();
                        return Q(true);
                    }.bind(this)).catch(function (error) {
                        console.log(error.name + ' ' + error.message + ' ' + error.stack);
                        throw error;
                    });
                } else {
                    this.controller.newPassword = this.controller.password;
                    this.controller.confirmPassword = this.controller.password;
                    this.isValidating = true;
                    return this.controller.publicRegister(document.location.href).then(function () {
                        this.isRegistering = true;
                        this.isValidating = false;
                        this.controller.customer.clientInit();
                        this.controller.customer.progress = 12;

                        this.controller.analyticsController.loginRegister();
                        this.controller.analyticsController.inspectletEvent(['tagSession', 'application']);

                        // Also subscribe to mailchimp
                        this.controller.homeController.signupFromApp(this.controller.email, this.controller.customer.primaryCustomer.address.zip, null);

                        return this.createPolicy();
                    }.bind(this), function (err) {
                        this.controller.error = err.text || '';
                        return Q(false);
                    }.bind(this)).then(function (success) {
                        if (success) { this.controller.route.private.apply_form(); }
                        return Q(true);
                    }.bind(this)).then(function () {
                        this.clearPasswords();
                        this.isRegistering = false;
                    }.bind(this));
                }
            }
        },

        onLogout: function () {
            this.firstRender            = true;
            this.haveAccount            = null;
            this.agreesToTerms          = null;
            this.acknowledgementOwner   = null;
            this.acknowledgementOwner   = null;
            this.editingOwnerEmail      = null;
            this.ownerEmail             = null;
            this.ownerEmailChanged      = null;
            this.validationCode         = null;
        },

        privateVerifyEmailFromCode: {on: 'server', body: function (code) { // SecReviewed (modified since)
            if (testMode.match(/noverify/) && code == '1234') {
                this.controller.customer.emailValidated = true;
                return Q(true);
            }
            return this.controller.privateVerifyEmailFromCode(code);
        }},

        formNext: function () {
            var policy = this.controller.customer.applicationPolicy;

            // This could not be validated on the fly when form fields change. So do it here
            if(policy.insuredType !== policy.ownerType){
                if(policy.getBeneficiaryType() === '7') { // Other trust
                    policy.beneficiaryType = null;
                    policy.beneficiaryTypeTrigger();
                }
                if(policy.getContingentBeneficiaryType() === '7') { // Other trust
                    policy.contingentBeneficiaryType = null;
                }
            }

            // Set a policy variable that indicates that validation is ongoing...
            // This is needed to stop model triggers from running during validation. Typically
            // triggers should be idempotent but there are cases where this was not possible.
            policy.isValidating = true;
            this.controller.clearError(this, 'validationCode');

            if (!this.validateOwnerState()) { return; }
            var defaultValidation = this.controller.validate();
            var appValidation =  this.validateApplication();
            policy.isValidating = false; // validation done

            if (defaultValidation && appValidation) {
                this.controller.isWaiting = true;

                policy.premiumPayerPerson = policy.getPremiumPayerPerson();
                policy.premiumPayerAddress = policy.getPremiumPayerAddress();
                policy.premiumPayerPhone = policy.getPremiumPayerPhone();

                if (this.editingOwnerEmail) { this.controller.newEmail = this.ownerEmail; }
                return Q(true).then(function () {
                    // Verify the validation code if present but don't allow continuing since we need to validate
                    if (!this.controller.customer.emailValidated) {
                        return this.privateVerifyEmailFromCode(this.validationCode).then(function (success) {
                            if (!success) {
                                this.controller.setError(this, 'validationCode',
                                    {message: this.validationCode ? 'bad_email_validation' : 'email_validation_required'});
                                return Q(false);
                            } else {
                                return Q(true);
                            }
                        }.bind(this));
                    } else {
                        return Q(true);
                    }
                }.bind(this)).then(function(success){
                    this.controller.verifyEmailCode = '';
                    this.controller.isWaiting = success;
                    // Validation of email successful?
                    if (success) {
                        // If insured and owner are same, point owner to insured.
                        // Have to do this as the final step right before submitting the policy,
                        // otherwise changes to insured type or owner tpe in the application form
                        // will break.
                        if(policy.insuredType === policy.ownerType){
                            policy.ownerPerson = policy.insured.person;
                            policy.ownerPersonResidentialAddress = policy.insured.address;
                            policy.ownerPersonPhone = policy.insured.phone;
                        }
                        policy.ownerPerson.email = this.controller.email;

                        // If beneficiary is spouse, fill bene with spouse info
                        if(policy.insuredType !== policy.ownerType && policy.getBeneficiaryType() === '9'){
                            policy.copySpouseInfoToBene(policy.primaryBeneficiary[0]);
                        }
                        else if(policy.insuredType !== policy.ownerType && policy.getContingentBeneficiaryType() === '9'){
                            policy.copySpouseInfoToBene(policy.contingentBeneficiary[0]);
                        }

                        return this.controller.customer.submitPolicy().then(function () {
                            this.controller.route.private.apply_submitted();
                            if (this.controller.customer.timeOfFirstVisit) {
                                this.controller.analyticsController.addCustomDimension('DaysSinceFirstVisit',
                                    Math.floor(((new Date()).getTime() - this.controller.customer.timeOfFirstVisit) / (1000 * 60 * 60 * 24)));
                            }
                            this.controller.analyticsController.dripUpdate('APPSUBMIT');
                        }.bind(this));
                    }
                    return Q(true);

                }.bind(this));
            }
        },

        validateApplication: function(){

            // Validate inter dependent fields
            var isError = false;
            var policy = this.controller.customer.applicationPolicy;
            if(policy.insured.familyHistory.motherLiving === 'isalive' && !policy.insured.familyHistory.motherAge){
                this.controller.setError(this.controller.customer.applicationPolicy.insured.familyHistory,
                        'motherAge', {message: 'required'});
                isError = true;
            }
            else{
                this.controller.clearError(this.controller.customer.applicationPolicy.insured.familyHistory, 'motherAge');
            }
            if(policy.insured.familyHistory.fatherLiving === 'isalive' && !policy.insured.familyHistory.fatherAge){
                this.controller.setError(this.controller.customer.applicationPolicy.insured.familyHistory,
                        'fatherAge', {message: 'required'});
                isError = true;
            }
            else{
                this.controller.clearError(this.controller.customer.applicationPolicy.insured.familyHistory,
                        'fatherAge', {message: 'required'});
            }

            if(policy.insured.personalHistory.primaryPhysicianLastVisitWhen === 'lastvisit' && !policy.insured.personalHistory.primaryPhysicianLastVisit){
                this.controller.setError(this.controller.customer.applicationPolicy.insured.personalHistory,
                        'primaryPhysicianLastVisit', {message: 'required'});
                isError = true;
            }
            else{
                this.controller.clearError(this.controller.customer.applicationPolicy.insured.personalHistory, 'primaryPhysicianLastVisit');
            }

            if (policy.insured.person.hasDriversLicense !== false) {
                if (!policy.insured.person.idNumber) {
                    this.controller.setError(this.controller.customer.applicationPolicy.insured.person, 'idNumber', {message: 'required'});
                    isError = true;
                }
                else {
                    this.controller.clearError(this.controller.customer.applicationPolicy.insured.person, 'idNumber');
                }
                if (!policy.insured.person.idState) {
                    this.controller.setError(this.controller.customer.applicationPolicy.insured.person, 'idState', {message: 'required'});
                    isError = true;
                }
                else {
                    this.controller.clearError(this.controller.customer.applicationPolicy.insured.person, 'idState');
                }
                if (!policy.insured.person.idExpires) {
                    this.controller.setError(this.controller.customer.applicationPolicy.insured.person, 'idExpires', {message: 'required'});
                    isError = true;
                }
                else {
                    this.controller.clearError(this.controller.customer.applicationPolicy.insured.person, 'idExpires');
                }
            }

            return !isError;
        },

        createPolicy: function () {
            var primaryCustomerGender = this.controller.customer.primaryCustomer.gender == 'male' ? '1' : '2';
            this.controller.customer.primaryCustomer.person.gender = primaryCustomerGender;
            return this.controller.customer.createPolicy(this.controller.customer.selectedQuote).then(function () {
                this.controller.customer.applicationPolicy.clientInit();
                return Q(true);
            }.bind(this));
        },

        clearPasswords: function () {
            this.controller.newPassword     = '';
            this.controller.confirmPassword = '';
            this.controller.password        = '';
        },

        editOwnerEmail: function () {
            this.ownerEmail         = this.controller.email;
            this.editingOwnerEmail  = true;
            this.ownerEmailChanged  = false;
        },

        cancelEditOwnerEmail: function () {
            this.clearPasswords();
            this.editingOwnerEmail = false;
        },

        editSecondaryEmail: function () {
            this.secondaryEmail         = this.controller.customer.applicationPolicy.insured.person.email;
            this.editingSecondaryEmail  = true;
        },

        cancelEditSecondaryEmail: function () {
            this.editingSecondaryEmail = false;
        },

        /**
         * Handles all email change situations and returns true if you can proceed.  If you need verification
         * or there is an error it returns false.  Returns are async via a promise
         * @returns {*}
         */
        changeEmail: function () {
            this.controller.newEmail = this.ownerEmail;
            return this.controller.changeEmail(null, document.location.href).then(function () {
                this.clearPasswords();
                this.editingOwnerEmail = false;
                this.ownerEmailChanged = true;
                return Q(true);
            }.bind(this), function (err) {
                if (err.text.match(/password/i)) {
                    this.controller.setError(this.controller, 'password', err.text);
                } else {
                    this.controller.setError(this, 'ownerEmail', err.text);
                }
                this.clearPasswords();
                return Q(false);
            }.bind(this));
        },

        changeSecondaryEmail: function(){
            this.controller.customer.applicationPolicy.insured.person.email = this.secondaryEmail;
            this.editingSecondaryEmail = false;
        },

        /**
         * Methods Used when changing email from account center
         */
        changeSecondaryEmailAndSave: function(){
            this.editingSecondaryEmail = false;
            return this.saveInsuredEmail();
        },

        saveInsuredEmail: {on: 'server', body: function(){ // SecReview Pending Todo: verify not save as owner's - Fixed.
            // Can be called from console. Make sure this can be changed only if the owner != insured
            if(this.controller.customer.applicationPolicy.insuredType != this.controller.customer.applicationPolicy.ownerType){
                this.controller.customer.applicationPolicy.insured.person.email = this.secondaryEmail;
            }
        }},

        validateOwnerState: function (suppressPopup) {
            var applicationPolicy = this.controller.customer.applicationPolicy;
            var address = applicationPolicy.ownerType == applicationPolicy.insuredType ?
                applicationPolicy.insured.address :
                applicationPolicy.ownerPersonResidentialAddress;
            this.controller.clearError(applicationPolicy.insured.address, 'zip');
            this.controller.clearError(applicationPolicy.ownerPersonResidentialAddress, 'zip');

            if (!address.state) { return false; }
            if (!this.controller.isProductSoldIn(address.state)) {
                this.notSoldInState = address.state;
                if (!suppressPopup) {
                    this.controller.route.public.dialog.invalid_state_appl();
                }
                this.controller.setError(address, 'zip', 'Not yet sold here');
                return false;
            }
            return true;
        },

        setupZipLookup: function() {
            var controller = this.controller;
            Address.inject(function () {
                this.zipSet = function (zip) {
                    if (controller.applicationController.isValidating) { return Q(); }

                    return controller.publicGetLocationByZip(zip)
                        .then(saveZip.bind(this))
                        .then(isStateValid.bind(this));

                    function saveZip(location) {
                        if (!location) {
                            throw 'Not a valid ZIP code';
                        } else {
                            this.zip = zip;
                            this.state = location.stateCode;
                            this.city = location.city;
                            this.latitude = location.lat;
                            this.longitude = location.lng;
                            this.timezone = location.timezone;
                        }
                    }

                    function isStateValid() {
                        if (!controller.isProductSoldIn(this.state)) {
                            controller.route.public.dialog.invalid_state_appl();
                            throw 'Not sold here';
                        }
                    }
                };
            });
        },

        setupZipValidation: function () {
            var applicationController = this;
            var applicationPolicy = this.controller.customer.applicationPolicy;
            Address.inject(function () {
                this.streetValues = function () {
                    var map = {};
                    return _.filter(_.map(this.customer.addresses, function (addr) {
                        if (addr.street && addr.state && !map[addr.getOneLineValue()]) {
                            map[addr.getOneLineValue()] = true;
                            return {
                                listValue: addr.getOneLineValue(),
                                fieldValue: addr.street,
                                address: [addr.street,addr.line1, addr.city, addr.zip]
                            };
                        } else {
                            return null;
                        }
                    }.bind(this)),function(o){
                        return o ? true: false;
                    });
                };
                this.streetTypeaheadTrigger = function (obj) {
                    this.street = obj.address[0];
                    this.line1 = obj.address[1];
                    if (this == applicationPolicy.ownerPersonResidentialAddress) {
                        bindster.DOMSet({bind: 'customer.applicationPolicy.ownerPersonResidentialAddress.zip', value: obj.address[3]});
                    }
                    if (this == applicationPolicy.insured.address) {
                        bindster.DOMSet({bind: 'customer.applicationPolicy.insured.address.zip', value: obj.address[3]});
                    } else {
                        this.zipSet(obj.address[3], true);
                    }
                },

                this.zipSet = function(zip, force) {
                    if (zip != this.zip || force) {
                        return applicationController.controller.publicGetLocationByZip(zip).then(function(location) {
                            if(!location) {
                                throw 'Not a valid ZIP code';
                            } else {
                                this.zip = zip;
                                this.state = location.stateCode;
                                this.city = location.city;
                                this.latitude = location.lat;
                                this.longitude = location.lng;
                                this.timezone = location.timezone;

                                var isInvalidZip = (this == applicationPolicy.ownerPersonResidentialAddress &&
                                    !applicationController.controller.isProductSoldIn(applicationPolicy.ownerPersonResidentialAddress.state)) ||
                                    (this == applicationPolicy.insured.address &&
                                     applicationPolicy.ownerType == applicationPolicy.insuredType &&
                                     !applicationController.controller.isProductSoldIn(applicationPolicy.insured.address.state));

                                if (isInvalidZip) {
                                    applicationController.controller.route.public.dialog.invalid_state_appl();
                                    throw 'Not sold here';
                                }
                            }
                        }.bind(this));
                    } else {
                        return Q(true);
                    }
                };
            });
        },

        /**
         * Set driver's license state of insured to residence state
         */
        setDLState: function(){
            var policy = this.controller.customer.applicationPolicy;
            policy.insured.person.idState = policy.insured.address.state;
        },

        setupMisc: function () {
            var applicationController = this;
            var applicationPolicy = this.controller.customer.applicationPolicy;

            FamilyHistory.inject(function() {
                var currentMLTrigger = FamilyHistory.prototype.motherLivingTrigger;
                this.motherLivingTrigger = function() {
                    // Call existing trigger first
                    if (currentMLTrigger) {
                        currentMLTrigger.apply(this);
                    }

                    if(this.motherLiving != 'isalive'){
                        applicationController.controller.clearError(applicationController.controller.customer.applicationPolicy.insured.familyHistory, 'motherAge');
                    }
                };

                var currentFLTrigger = FamilyHistory.prototype.fatherLivingTrigger;
                this.fatherLivingTrigger = function() {
                    // Call existing trigger first
                    if (currentFLTrigger) {
                        currentFLTrigger.apply(this);
                    }

                    if(this.fatherLiving != 'isalive'){
                        applicationController.controller.clearError(applicationController.controller.customer.applicationPolicy.insured.familyHistory, 'fatherAge');
                    }
                };
            });

            PersonalHistory.inject(function () {
                var currentTrigger = PersonalHistory.prototype.primaryPhysicianLastVisitWhenTrigger;
                this.primaryPhysicianLastVisitWhenTrigger = function(){

                    // Call existing trigger first
                    if (currentTrigger) { currentTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.customer.applicationPolicy.isValidating) { return; }

                    if (this.primaryPhysicianLastVisitWhen === 'unknown') {
                        this.primaryPhysicianLastVisit = null;
                    }
                    applicationController.controller.clearError(applicationController.controller.customer.applicationPolicy.insured.personalHistory, 'primaryPhysicianLastVisit');
                };

                var currentHIVTrigger = PersonalHistory.prototype.hivPositiveWhichAddressTrigger;
                this.hivPositiveWhichAddressTrigger = function(){

                    // Call existing trigger first
                    if (currentHIVTrigger) { currentHIVTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.customer.applicationPolicy.isValidating) { return; }

                    if(this.customer.applicationPolicy.insured.personalHistory.hivPositiveWhichAddress === 'optout') {
                        applicationController.notSupportedReason = 'hiv_optout';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };
            });


            // Injecting triggers as they are view specific. All these triggers can eventually
            // display a popup
            Person.inject(function () {

                var currentDOBTrigger = Person.prototype.dobTrigger;
                this.dobTrigger = function () {

                    // Call existing trigger first
                    if (currentDOBTrigger) { currentDOBTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.customer.applicationPolicy.isValidating) { return; }

                    if(this.isPrimaryApplicant()) {
                        var age = applicationController.controller.getAge(applicationPolicy.insured.person.dob);
                        if (age > 44 || age < 18) {
                            applicationController.notSupportedReason = 'age';
                            applicationController.controller.route.public.dialog.cannot_sell_policy();
                        }
                    }
                };

                var currentResTrigger = Person.prototype.residencyStatusTrigger;
                this.residencyStatusTrigger = function(){

                    // Call existing trigger first
                    if (currentResTrigger) { currentResTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.customer.applicationPolicy.isValidating){ return; }

                    if (this.residencyStatus === 'none') {
                        applicationController.notSupportedReason = 'non-us';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };

                var currentHasDriversLicenseTrigger = Person.prototype.hasDriversLicenseTrigger;
                this.hasDriversLicenseTrigger = function(){

                    // Call existing trigger first
                    if (currentHasDriversLicenseTrigger) { currentHasDriversLicenseTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.customer.applicationPolicy.isValidating){ return; }

                    if (this.customer.applicationPolicy.insured.person.hasDriversLicense === false) {
                        applicationController.controller.clearError(applicationController.controller.customer.applicationPolicy.insured.person, 'idNumber');
                        applicationController.controller.clearError(applicationController.controller.customer.applicationPolicy.insured.person, 'idState');
                        applicationController.controller.clearError(applicationController.controller.customer.applicationPolicy.insured.person, 'idExpires');
                    }
                };


            });

            ExistingPolicies.inject(function(){
                var currentTrigger = ExistingPolicies.prototype.replaceInforceApplicationTrigger;
                this.replaceInforceApplicationTrigger = function(){

                    // Call existing trigger first
                    if (currentTrigger) { currentTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.customer.applicationPolicy.isValidating) { return; }

                    if (this.replaceInforceApplication) {
                        applicationController.notSupportedReason = 'replace';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };
            });

            Policy.inject(function(){
                var currentReasonTrigger = Policy.prototype.reasonForInsuranceTrigger;
                this.reasonForInsuranceTrigger = function(){

                    // Call existing trigger first
                    if (currentReasonTrigger) { currentReasonTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.isValidating) { return; }

                    if (this.reasonForInsurance === 'B') {
                        applicationController.notSupportedReason = 'business';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };

                var currentPremiumSourceTrigger = Policy.prototype.premiumSourceTrigger;
                this.premiumSourceTrigger = function(){

                    // Call existing trigger first
                    if(currentPremiumSourceTrigger) { currentPremiumSourceTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.isValidating) { return; }

                    if (this.premiumSource) {
                        applicationController.notSupportedReason = 'premiumSource';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };

                var currentCollateralTrigger = Policy.prototype.collaterallyAssignedTrigger;
                this.collaterallyAssignedTrigger = function(){

                    // Call existing trigger first
                    if (currentCollateralTrigger) { currentCollateralTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.isValidating) { return; }

                    if (this.collaterallyAssigned) {
                        applicationController.notSupportedReason = 'collateral';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };

                var currentEconomicTrigger = Policy.prototype.economicIncentiveTrigger;
                this.economicIncentiveTrigger = function(){

                    // Call existing trigger first
                    if (currentEconomicTrigger) { currentEconomicTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.isValidating) { return; }

                    if (this.economicIncentive) {
                        applicationController.notSupportedReason = 'economic';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };

                var currentBeneficialTrigger = Policy.prototype.beneficialInterestTrigger;
                this.beneficialInterestTrigger = function(){

                    // Call existing trigger first
                    if (currentBeneficialTrigger) { currentBeneficialTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.isValidating){ return; }

                    if (this.beneficialInterest) {
                        applicationController.notSupportedReason = 'commitment';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };

            });

            RiskFactors.inject(function(){
                var currentTrigger = RiskFactors.prototype.armedForcesTrigger;
                this.armedForcesTrigger = function(){

                    // Call existing trigger first
                    if (currentTrigger) { currentTrigger.apply(this); }

                    // Avoid running triggers during final validation
                    if (this.customer.applicationPolicy.isValidating) { return; }

                    if (this.armedForces) {
                        applicationController.notSupportedReason = 'military';
                        applicationController.controller.route.public.dialog.cannot_sell_policy();
                    }
                };
            });
        },

        setCrossOverPolicy: function(){
            // Clone selectedQuote and update it
            var selectedQuote = this.controller.customer.selectedQuote;
            var cloneSelectedQuote = JSON.parse(JSON.stringify(this.controller.customer.selectedQuote));

            cloneSelectedQuote.policies[0].face = selectedQuote.policies[0].newFace;
            cloneSelectedQuote.policies[0].monthly= selectedQuote.policies[0].newMonthly;

            // No need to track newFace and monthly anymore.
            cloneSelectedQuote.policies[0].newFace = null;
            cloneSelectedQuote.policies[0].newMonthly = null;

            this.controller.customer.selectedQuote = cloneSelectedQuote;
            this.controller.publicSave();
        },


        showAppAssistant: function () {
            var incompatibleWindowSize = $(window).width() < 991 || $(window).height() < 725 && $('.applicationAssistant').offset().top > 14000;

            if (incompatibleWindowSize) {
                $('.applicationAssistant').css('display', 'none');
            } else {
                $('.applicationAssistant').css('display', 'inline-block');
            }
        },

        scrollProcessing: function(){
            // When the 'topBleed' panel is scrolled past, show percent bar
            var topDiv = $('#topBleed');
            var percentDiv = $('#percentBar');

            if(topDiv.length > 0 && percentDiv.length > 0) {

                var windowPos = $(window).scrollTop();
                var topDivOffset = topDiv.offset();

                if (windowPos-topDiv.height() >= topDivOffset.top) {
                    percentDiv.addClass('stick').show();
                }
                else {
                    percentDiv.removeClass('stick').hide();
                }
            }

            // Look for left sections from the end of the document to the start.
            // The first one whose top is less than window's top should be fixed.
            var appAssistant = $('.questions .applicationAssistant');
            var appSections = $('.questions .app-section');
            $(appSections.get().reverse()).each(function(_index, element){

                controller.applicationController.showAppAssistant();

                // Fix the section to the top.
                var currSection = $(element);
                var percentDiv = $('#percentBar');

                if(currSection.parent().offset().top <= $(window).scrollTop() + percentDiv.height()) {
                    appSections.removeClass('stick');
                    currSection.addClass('stick');

                    appAssistant.addClass('stick');
                    return false;
                }
                else{
                    appSections.removeClass('stick');
                    appAssistant.removeClass('stick');
                }

            });
        },

        submitEnabled: function(){
            var policy = this.controller.customer.applicationPolicy;
            var answered = _.keys(controller.applicationController.qsAnswered);
            // Checks that all top questions have been answered
            var unanswered = _.difference(this.topLevelQs, answered);

            return !this.editingOwnerEmail && this.acknowledgementOwner
                && (policy.insuredType != policy.ownerType ? this.acknowledgementInsured : true) && _.isEmpty(unanswered);
        },

        // VIEW MODEL CODE
        appMetaData: {isLocal:true, type: Node}, // Root node of the View Model tree hierarchy
        qsAnswered: {isLocal:true, type: Object, value: {}},
        topLevelQsCount: {isLocal:true, type: Number},
        currentBene:  {isLocal:true, type: Object},
        nextFocussable:     {isLocal:true, type:String},

        currentNodeSection: {
            isLocal: true,
            type: String
        },

        // Cached objects
        nodes:  {isLocal: true, type: Object, value: {}}, // question id# -> Node
        topLevelNodes: {isLocal: true, type: Array, of: String, value: []}, // top level node IDs
        topLevelQs: {isLocal: true, type: Array, of: String, value: []}, // top level questions node IDs
        enabledNodesCache:  {isLocal: true, type: Object, value: {}}, // question id# -> true/false

        resendValidationCode: function() {
            var policy = this.controller.customer.applicationPolicy;
            policy.isValidating = true;
            $('#resend-code-btn').prop('disabled',true);
            $('#resend-code-btn').button('loading');
            this.controller.clearError(this.controller.applicationController, 'validationCode');
            this.controller.resendChangeEmailValidationCode(document.location.href).then(setTimeout(function(){
                policy.isValidating = false;
                $('#resend-code-btn').button('reset');
            }.bind(this), 1000));
        },

        getMetadata: {on: 'server', body: function(options) {
            var opts        = options || {};
            var category    = opts.category || 'App Questions';
            var hierarchy   = opts.hierarchy ? [opts.hierarchy] : [];
            var dimensions  = opts.dimensions ?  [opts.dimensions] : [];
            var criteria    = opts.criteria ? [opts.criteria] : [];

            return Q(new MetadataAdmin.MetadataApi().buildMetadata(category, hierarchy, dimensions, criteria));
        }},


        setupAppTree: function (appOptions) {

            var buildApplication = function (metadata) {

                this.topLevelQsCount = 0;
                this.appMetaData = new Node('', {level: 0});

                var appQuestions = metadata['App Questions'];

                var nodes = this.nodes,
                    nestedEntities = {},    // e.g. Diagnosis -> [child node1, child node2....]
                    nestedEntity = {},      // If the current context is a nested entity
                    currentSection;
                var levelToNodeMap = {};    // level -> last encountered node at that level

                appQuestions.forEach(function(obj) {
                    if (obj.section && obj.section !== this.currentNodeSection) {
                        currentSection = this.appMetaData.addChild(new Node('', {section: obj.section, topLevel: true}));
                        this.currentNodeSection = obj.section;
                    }

                    var entity = obj.entity;
                    var name = obj.property;

                    var controlType = obj.custom_control_type ? obj.custom_control_type : obj.control_type;
                    var options = {
                        id: obj.key,
                        qText: obj.question,
                        controlType: controlType,
                        widths: obj.widths,
                        level: obj.question_level,
                        entity: obj.entity,
                        helpText: obj.help_text,
                        pronounLocked: obj.pronoun_locked,
                        type: obj.type,
                        required: obj.required,
                        placeholder: obj.placeholder,
                        customProps: obj.custom_control_properties,
                        placeHolder: obj.placeholder,
                        styleClass: obj.style_class,
                        layout: obj.layout,
                        width: obj.width,
                        fid: obj.fill_id,
                        validation: obj.client_validation,
                        inNestedEntity: false
                    };

                    if (obj.subproperty) { options.subProperty = _.compact([obj.model_path, obj.subproperty]).join('.'); }

                    var prop = _.compact([obj.model_path, obj.property]).join('.');
                    var condition = obj.appears_based_on;
                    var showifExp = this.constructEvalExp(condition, nodes);

                    // If there is a parent question, add the current question as a child
                    var parentNode = options.level === '1' ? currentSection : levelToNodeMap[options.level-1];
                    var currNode;

                    options['showifExp'] = showifExp;

                    // Set the level
                    // If parent is a checkbox, uiLevel is parent's uiLevel + 1
                    // If parent is a radiogroup, uiLevel is same as parent's uiLevel
                    var parentControlType = parentNode.controlType || '';
                    if (parentControlType.match(/checkbox|select/)) {
                        options.uiLevel = parentNode.uiLevel + 1;
                    } else if (parentControlType.match(/radio-group/)) {
                        options.uiLevel = parentNode.uiLevel;
                    } else if (parentControlType.match(/label/)) {
                        if (options.level === '2') {
                            options.uiLevel = 0;
                        } else {
                            options.uiLevel = parentNode.uiLevel + 1;
                        }
                    }

                    if (entity != nestedEntity.name) { nestedEntity.name = nestedEntity.node = null; }

                    // Nested entities require special handling.
                    if (nestedEntity.name && entity === nestedEntity.name) {
                        if (nestedEntity.node.controlType === 'iterate-collection') {
                            if (entity !== 'Beneficiary') {
                                prop = 'current' + entity + '.' + name;
                            }
                        } else {
                            prop = nestedEntity.node.prop + '.' + name;
                        }

                        options.inNestedEntity = true;
                    }

                    if (obj.question === 'None of the Above') {
                        currNode = new NoneNode(prop, options);
                    } else if(obj.question &&
                        obj.question != 'Other Airlines (non-scheduled passenger service)' &&
                        (obj.question.match(/^Other/) || obj.question === 'Formula Kart Experiment (FKE)') ) {
                        currNode = new OtherNotSureNode(prop, options);
                    } else{
                        currNode = new Node(prop, options);
                    }
                    nodes[obj.key] = currNode;
                    if(options.level === '1') {
                        this.topLevelNodes.push(obj.key);
                        if (!condition) {
                            this.topLevelQs.push(obj.key);
                            this.topLevelQsCount++;
                        }
                    }

                    // Remember the entity nodes so that they can be reused.
                    if(nestedEntity.name){
                        if(!nestedEntities[nestedEntity.name]){
                            nestedEntities[nestedEntity.name] = [];
                        }
                        nestedEntities[nestedEntity.name].push(currNode);
                        if(nestedEntity.node.parent === parentNode) {
                            currNode.resetLevel();
                            nestedEntity.node.addChild(currNode, this.topLevelNodes[this.topLevelNodes.length-1]);
                        } else{
                            currNode.resetLevel();
                            parentNode.addChild(currNode, this.topLevelNodes[this.topLevelNodes.length-1]);
                        }

                    } else {

                        if(obj.type){
                            var nestedNodes;
                            if(obj.type.match(/array *of *([A-Za-z]*)/)) {
                                nestedEntity.name = RegExp.$1;
                                nestedEntity.node = currNode;

                                // If the nested entity is already in the hash, add all its nodes to the
                                // current node (exclude Bene)
                                if (nestedEntity.name != 'Beneficiary' && nestedEntities[nestedEntity.name]) {
                                    nestedNodes = nestedEntities[nestedEntity.name];
                                    nestedNodes.forEach(function (theNode) {
                                        currNode.addChild(theNode.shallowCopy(), this.topLevelNodes[this.topLevelNodes.length-1]);
                                    }.bind(this));
                                }

                            } else if(!obj.type.match(/boolean|string|number|multivalue|date/i)){ // For DiagnosisShort and other nested entities
                                nestedEntity.name = obj.type;
                                nestedEntity.node = currNode;

                                // If the nested entity is already in the hash, add all its nodes to the
                                // current node
                                if (nestedEntities[nestedEntity.name]) {
                                    nestedNodes = nestedEntities[nestedEntity.name];
                                    nestedNodes.forEach(function (theNode) {
                                        var copyNode = theNode.shallowCopy();
                                        var toks = theNode.prop.split('.');
                                        copyNode.setProp(nestedEntity.node.prop + '.' + toks[toks.length-1]);
                                        currNode.addChild(copyNode, this.topLevelNodes[this.topLevelNodes.length-1]);
                                    }.bind(this));
                                }
                            }
                        }

                        parentNode.addChild(currNode, this.topLevelNodes[this.topLevelNodes.length-1]);
                    }

                    levelToNodeMap[options.level] = currNode;
                }.bind(this));

                var dummy = new Node('', {id:'-1', controlType: 'label-basic', level:1});
                nodes[dummy.id] = dummy;
                this.topLevelNodes.push(dummy.id);
                currentSection.addChild(dummy, this.topLevelNodes[this.topLevelNodes.length-1]); // dummy

                this.firstRender = true;
                this.nodes = nodes;
                this.setupRX();
                this.setupZipValidation();
                this.setupMisc();

                return Q(this.appMetaData);

            }.bind(this);

            return this.getMetadata(appOptions)
                .then(buildApplication);
        },

        constructEvalExp: function (condition, nodes) {
            if (!condition) { return; }

            // First split the condition into multiple questions
            // based on the presence of AND or OR (only one
            // of them can exist for now)
            var conditions = condition.split(' OR ');
            var orPresent = conditions.length > 1;

            if (!orPresent) {
                conditions = condition.split(' AND ');
            }

            var evalStrings = [];
            conditions.forEach(function (current) {
                var currResult = this.parseQuestion(current);

                var parentQ = currResult.parentQ,
                    predicate = currResult.predicate,
                    operator = currResult.operator,
                    evalExp = currResult.evalExp;

                var showif, regex;
                if (typeof predicate === 'string') {
                    var predicateSplit = predicate.split(' or ');

                    if (predicateSplit.length === 1) {
                        showif = '"' + predicate + '"';

                    } else {
                        // construct a regex
                        regex = true;
                        showif = predicateSplit.join('|');
                    }
                } else {
                    // boolean
                    showif = predicate;
                }

                // Construct eval expression
                if(evalExp){
                    evalStrings.push('controller.customer.applicationPolicy.' + evalExp);

                } else if(parentQ){
                    var parent = nodes[parentQ];
                    var propName = parent.prop;
                    if(regex){
                        showif = new RegExp(showif);
                        evalStrings.push('controller.' + propName + '&& controller.' + propName + '.match(' + showif + ')');
                    } else{
                        if(typeof showif !== 'undefined'){
                            evalStrings.push('controller.' + propName + operator + showif);
                        } else {
                            var parent2Prop = nodes[currResult.parentQ2].prop;
                            evalStrings.push('controller.' + propName + operator + 'controller.' + parent2Prop);
                        }
                    }
                }
            }.bind(this));

            return orPresent ? evalStrings.join(' || ') : evalStrings.join(' && ');
        },

        // Takes in a condition and returns an object with
        // the following props
        // { parentQ, predicate, evalExp }
        parseQuestion: function(condition) {


            var parentQ, parentQ2, predicate, evalExp, operator = '===';
            if(!condition.match(/^if/i)){
                condition = 'if ' + condition;
            }
            if (condition.match(/if Q([0-9a-z.]+) is (.*)/i)) {
                parentQ = RegExp.$1;
                predicate = RegExp.$2;
            } else if (condition.match(/if Q([0-9a-z.]+) = Yes/i)) {
                parentQ = RegExp.$1;
                predicate = true;
            } else if (condition.match(/if Q([0-9a-z.]+) = No/i)) {
                parentQ = RegExp.$1;
                predicate = false;
            } else if (condition.match(/if Q([0-9a-z.]+) = Q([0-9a-z]+)/i)) {
                parentQ = RegExp.$1;
                parentQ2 = RegExp.$2;
            } else if (condition.match(/if Q([0-9a-z.]+) = (.*)/i)) {
                parentQ = RegExp.$1;
                predicate = RegExp.$2;
            }
            else if (condition.match(/if Q([0-9a-z.]+) > (.*)/i)) {
                parentQ = RegExp.$1;
                predicate = Number(RegExp.$2);
                operator = '>';
            }
            else if (condition.match(/if ([0-9a-z.]+) = (.*)/i)) {
                evalExp = RegExp.$1 + '===' + RegExp.$2;
            }
            else if (condition.match(/([a-z]+\(\)$)/i)) {
                evalExp = RegExp.$1;
            }
            else if (condition.match(/If Q([0-9a-z.]+) and (.*)/)) {
                parentQ = RegExp.$1;
                evalExp = RegExp.$2;
                predicate = true;
            }
            else if (condition.match(/if Q([0-9a-z.]+) != Q([0-9a-z.]+)/i)) {
                parentQ = RegExp.$1;
                parentQ2 = RegExp.$2;
                operator = '!=';
            }

            return {
                parentQ : parentQ,
                parentQ2 : parentQ2,
                predicate : predicate,
                operator: operator,
                evalExp: evalExp
            };
        },

        isShown: function(id){
            // Should the node with the given id be visible. Use the node's parent and check for the
            // condition value
            if (this.appMetaData) {
                var node = this.nodes[id];

                if(node){
                    var visible = node.isShown();

                    // Only reset non iterate props
                    if(node.prop.indexOf('customer.applicationPolicy') === 0) {

                        // If node was previously shown and now hidden, reset it and its children
                        if (node.isShowing && !visible) {
                            // console.log('Resetting ' + node.prop + ' and children');
                            node.resetVal();

                            // the trigger for iterates must have already done the reset
                            if(node.controlType != 'iterate-collection'){
                                node.resetChildren();
                            }
                        }
                        node.isShowing = visible ? true : false;

                    } else if(node.prop.indexOf('current') === 0){ // Iterate
                        if(!visible){
                            // console.log('Resetting ' + node.prop + ' and children');
                            node.resetVal();
                            node.resetChildren();
                        }
                    }

                    return visible;
                }
            }
            return false;
        },

        onchange: function (modelProp, value) {
            // Find the corresponding Node in the hierarchy
            var node;
            if (modelProp && modelProp.indexOf('customer.applicationPolicy.') === 0 && typeof value === 'boolean' && value === true) {
                if (this.appMetaData) {
                    node = this.appMetaData.find(modelProp);
                    this.handleNoneNode(node);
                }
            }


            // Analytics stuff
            if (modelProp && modelProp.indexOf('customer.applicationPolicy.insured.personalHistory') === 0 && typeof value === 'boolean') {
                if (this.appMetaData) {
                    node = this.appMetaData.find(modelProp);

                    var medCount = this.controller.customer.applicationPolicy.insured.personalHistory.medicalConditionCount;
                    value ? medCount++ : (medCount > 0 ? medCount-- : 0);
                    this.controller.customer.applicationPolicy.insured.personalHistory.medicalConditionCount = medCount;

                    this.controller.analyticsController.addCustomData('NumHealthConditions', this.controller.customer.applicationPolicy.insured.personalHistory.medicalConditionCount);
                }
            }

            this.controller.analyticsController.addCustomData('ExitQuestion', modelProp);

            // Need to fire a drip event for SSN
            if(modelProp === 'customer.applicationPolicy.insured.person.SSN'){
                this.controller.analyticsController.dripUpdate('APPLICATION');
            }
        },

        handleNoneNode: function(node){
            // If the value was reset from true to false, clear
            // children
            if (node instanceof NoneNode) {
                // If the node is "None of the above", uncheck siblings
                for (var i = 0; i < node.parent.children.length; i++) {
                    var child = node.parent.children[i];
                    if (node === child) {
                        break;
                    } else {
                        child.resetVal();
                        child.resetChildren();
                    }
                }
            }
            else {
                // If the value was set to true, find a corresponding none node and reset it.
                // Get the node's parent and check for a next sibling "None of the above"
                var none = _.find(node.parent.children, function (child) {
                    return child instanceof NoneNode;
                });
                if (none) {
                    none.resetVal();
                }
            }
        },

        getClass: function(id, setFocus){
            var isEnabled = this.enabledNodesCache[id];

            if(setFocus) {
                // Use jquery to set appropriate focus (either to the first field in the subsequent
                // question or the last field of the current question)
                if (isEnabled) {
                    if (this.nextFocussable === id) {
                        $('#' + id + ' :input').first().focus();
                        this.nextFocussable = null;
                    }
                } else {
                    if (this.nextFocussable === id) {
                        var prevNode = this.findPrevLevel1NodeWhichIsVisible(this.nodes[id]);
                        $('#' + prevNode.id + ' :input').last().focus();
                        this.nextFocussable = null;
                    }
                }
            }

            return isEnabled ? 'enabled1' : 'disabled1';
        },

        isEnabled: function(id){
            if (id === 'applyRegister') { return ''; }
            return this.enabledNodesCache[id] ? '' : 'disabled';
        },

        setNextFocus: function(id){
            this.nextFocussable = id;
        },

        findPrevLevel1NodeWhichIsVisible : function(node){
            if(node) {
                var prev = node.findPrevLevel1Node();
                return prev.isShown() ? prev : this.findPrevLevel1NodeWhichIsVisible(prev);
            }
            return null;
        },

        handlePrerender: function(){
            console.time('totalRender');
            // Go through all the questions and refresh the enabled questions cache
            this.enabledNodesCache = {};
            this.qsAnswered = {};

            this.topLevelNodes.every(function(id){

                var node = this.nodes[id];
                var prev = node.findPrevLevel1Node();

                if (!prev) {
                    this.enabledNodesCache[id] = true;

                } else if (prev.isValid()) {
                    this.enabledNodesCache[id] = true;

                    if(!prev.showifExp) {
                        this.qsAnswered[prev.id] = true;
                    }

                } else {
                    delete this.qsAnswered[prev.id];
                    return false;
                }
                return true;
            }.bind(this));
        },

        handleRender: function() {
            if (this.firstRender) {
                this.firstRender = false;
                this.compileApplication();
                this.controller.refresh();
            }

            // Set scroll handling only when the application render has been completed
            // which can be checked by the presense of "Get my decision" button
            if($('#appsubmit').length > 0 && $('#appsubmit').offset().top > 0){
                this.setScrollActions();
                $.scrollDepth();
            }
        },

        percentProgress: function(){
            var qsAnsweredCount = Object.keys(this.qsAnswered).length || 0;
            var percentFilled = Math.round(qsAnsweredCount/this.topLevelQsCount * 100) / 100;
            this.controller.customer.percentFilled = percentFilled > 1.0 ? 1.0 : percentFilled;

            this.controller.analyticsController.addCustomData('QuestionsAnswered', this.controller.customer.percentFilled);

            return this.controller.customer.percentFilled;
        },

        triggerFor: function(prop) {
            if (typeof prop !== 'string') { return; }

            var functionExpression = 'controller.' + prop + 'Trigger';
            var invokeFunctionExpression = functionExpression + '()';

            var triggerExpression = 'if(' +  functionExpression + '){' + invokeFunctionExpression + '}';

            eval(triggerExpression);
        },

        resetFieldValue: function(prop, value) {
            var model       = this.getModelFor(prop);
            var propString  = this.getPropStringFor(prop);

            model[propString] = value;
        },

        changeFocusTo: function(prop, key, classSelector) {
            if (this.radioHasTextField(prop, key)) {
                $(classSelector).focus();
            }
        },

        getModelFor: function(prop) {
            var propParts = prop.split('.');
            var modelString = propParts.slice(0,-1).join('.');
            var model = eval('controller.' + modelString);

            return model;
        },

        getPropStringFor: function(prop) {
            var propParts = prop.split('.');
            var propString = propParts[propParts.length - 1];

            return propString;
        },

        getDescriptionsFor: function(prop) {
            var model = this.getModelFor(prop);
            var propString = this.getPropStringFor(prop);

            return model[propString + 'Descriptions'];
        },

        nameFor: function(fid, collection) {
            if (!collection) { return fid; }
        },

        radioHasTextField: function(prop, key) {
            var descriptions = this.getDescriptionsFor(prop);
            if (!descriptions) { return false; }

            var description = descriptions[key];
            if (!description) { return false; }

            return !!description.match(/__([A-Za-z0-9_ ]+)/);
        },

        descriptionWidthFor: function(prop, key) {
            var descriptions = this.getDescriptionsFor(prop);
            return descriptions[key].width;
        },

        descriptionTextFor: function(prop, key) {
            var descriptionFunctionPath = 'controller.' + prop + 'Description';
            var descriptionFunctionInvoked = descriptionFunctionPath + '(' + key + ').text';
            var descriptionCollectionPath = 'controller.' + prop + 'Descriptions["' + key + '"].text';

            return this.evaluateFunctionExpression(descriptionFunctionPath, descriptionFunctionInvoked, descriptionCollectionPath);
        },

        descriptionFor: function(prop, key) {
            var textFieldMatch = '';
            if (this.radioHasTextField(prop, key)) { textFieldMatch = '.match(/__([A-Za-z0-9_ ]+)/)[1]'; }
            var descriptionFunctionPath = 'controller.' + prop + 'Description';
            var descriptionFunctionInvoked = descriptionFunctionPath + '("' + key + '")';
            var descriptionCollectionPath = 'controller.' + prop + 'Descriptions["' + key + '"]' + textFieldMatch;

            return this.evaluateFunctionExpression(descriptionFunctionPath, descriptionFunctionInvoked, descriptionCollectionPath);
        },

        evaluateFunctionExpression: function(functionExp, invokedFunctionExp, collectionExp) {
            if (typeof eval(functionExp) === 'function') {
                return eval(invokedFunctionExp);
            } else {
                return eval(collectionExp);
            }
        },

        removeIterateElement: function(prop, ix) {
            var propCollection = eval('controller.' + prop);
            var element = propCollection[ix];
            propCollection.splice(ix, 1);

            if (typeof element.setRatios === 'function') { element.setRatios(propCollection); }
        },

        addIterateElement: function(prop, arrayType) {
            var propCollection = eval('controller.' + prop);
            var newElement = eval('new ' + arrayType + '()');
            propCollection.push(newElement);
        },

        showHideBeneficiary: function(current){
            if(this.currentBene) {
                if (this.currentBene === current) {
                    this.currentBene = null;
                    return;
                }
            }
            this.currentBene = current;
        },

        beneficiaryTypeDescription: function(type){
            var policy = this.controller.customer.applicationPolicy;

            return type.match(/primaryBeneficiary/) ?
                    policy.beneficiaryTypeValues()[policy.beneficiaryType] : policy.contingentBeneficiaryTypeValues()[policy.contingentBeneficiaryType];
        },

        initBloodhound: function (prop, id) {
            if (typeof(Bloodhound) == 'undefined') { return; }

            if (!this.bloodhounds) { this.bloodhounds = {}; }

            var values = 'controller.' + prop + 'Values';
            var dataset = typeof(eval(values)) == 'function' ? eval(values + '()') : eval(values);
            var bloodhound = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('listValue'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: dataset
            });

            // constructs the suggestion engine
            var trigger = 'controller.' + prop + 'TypeaheadTrigger';
            this.bloodhounds[id] = bloodhound;

            if ($('.typeahead' + id).length == 2) {
                $('.typeahead' + id).parent().replaceWith($('.typeahead' + id).parent().children().first().next());
                $('.typeahead' + id).css('position', 'static');
                $('.typeahead' + id).css('display', 'inline-block');
                $('.typeahead' + id).css('background', '');
            }
            var node = $('.typeahead' + id).get(0);

            $('.typeahead' + id).typeahead(null, {
                name: id,
                display: 'fieldValue',
                templates: {
                    suggestion: function (obj) {
                        return '<div>' + obj.listValue + '</div>';
                    }
                },
                source: bloodhound
            })

             // Because typeahead creates two controls one on top of the other by cloning we need to disconnect
             // the one in back from bindster to avoid collisions with bindster.
            .on('typeahead:active', function(_ev, _suggestion) {
                if ($('.typeahead' + id).length == 2) {
                    $('.typeahead' + id).get(0).removeAttribute('b:bind');
                    $('.typeahead' + id).get(0).removeAttribute('bind');
                    $('.typeahead' + id).get(0).bindster = null;
                    node = $('.typeahead' + id).get(1);  // Make sure we fire events on input in front
                }
            })
            .on('typeahead:selected', function(ev, suggestion) {
                setValue(ev, suggestion);
            })
            .on('typeahead:autocomplete', function(ev, suggestion) {
                setValue(ev, suggestion);
            });

            function setValue(_ev, _suggestion) {
                node.onchange({target:node});
                if (typeof(eval(trigger)) == 'function') { eval(trigger + '(_suggestion)'); }
            }

        },

        updateBloodhound: function(prop, node) {
            if (!this.bloodhounds) { return; }
            var id = node.className.replace(/^typeahead/,'').replace(/ .*/, '');
            var values = 'controller.' + prop + 'Values';

            var bloodhound = this.bloodhounds[id];
            if (!bloodhound) { return; }
            bloodhound.clear();
            var dataset = typeof(eval(values)) == 'function' ? eval(values + '()') : eval(values);
            bloodhound.add(dataset);
        },

        setupDateMasks: function(){
            this.setupInputMasks({
                classSelector:      '.date-type',
                mask:               'mm/dd/yyyy'
            });
        },

        setupShortDateMasks: function(){
            this.setupInputMasks({
                classSelector:      '.sdate-type',
                mask:               'mm/yyyy'
            });
        },

        setupSSNMasks: function(){
            this.setupInputMasks({
                classSelector:      '.ssn-type',
                mask:               '999-99-9999'
            });
        },

        setupEINMasks: function(){
            this.setupInputMasks({
                classSelector:      '.ein-type',
                mask:               '99-9999999'
            });
        },

        setupInputMasks: function(opts) {
            if(!$.fn.inputmask) { return; }
            var classSelector = opts.classSelector;
            var mask = opts.mask;

            //set global inputMask defaults
            var options = {};
            options.showMaskOnHover = false;

            $(classSelector).inputmask(mask, options);
        },

        setupRX: function() {
            if (typeof(scripts) == 'undefined') {
                this.controller.loadScript('/common/js/ndcTypeahead.js', setup);
            } else {
                setup();
            }

            function setup () {
                var scriptDataset = _.map(scripts, function(value) {
                    return {fieldValue: value, listValue: value};
                });

                RX.inject(function () {
                    this.rxNameValues = function() {
                        return scriptDataset;
                    };
                });
            }

        },

        compileApplication: function() {
            if (!this.appMetaData.children || this.appMetaData.children.length == 0) {
                return;
            }

            console.time('compileApplication');
            var partialNames = $('script[type="text/x-handlebars-template"]').get().map(function(element){
                return element.id;
            });

            _.each(partialNames, function(partialName){
                var partialContent = $('#' + partialName).html();
                Handlebars.registerPartial(partialName, partialContent);
            });

            this.registerHandlebarsHelpers();

            var baseContent = $('#application-base').html();
            var baseTemplate = Handlebars.compile(baseContent);

            var html = baseTemplate({
                sections: this.appMetaData.children
            });

            $('#application-form').html(html);
            console.timeEnd('compileApplication');
        },

        registerHandlebarsHelpers: function() {
            Handlebars.registerHelper('isMatch', function(lVal, regex, _options){
                return lVal && lVal.match(new RegExp(regex));
            });
            Handlebars.registerHelper('isEqual', function(v1, v2, _options) {
                return v1 === v2;
            });
            Handlebars.registerHelper('isNotEqual', function(lVal, rVal, _options){
                return lVal !== rVal;
            });
            Handlebars.registerHelper('minus', function(op1, op2, _options){
                return Number(op1)-Number(op2);
            });
        }
    });
    return {
        ApplicationController: ApplicationController
    };
};
