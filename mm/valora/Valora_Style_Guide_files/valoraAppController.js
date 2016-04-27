/*global StickySidebars */
module.exports.valoraAppController = function(objectTemplate, getTemplate) {

    var Assumptions = getTemplate('static/Assumptions.js').Assumptions;

    var ValoraAppController = objectTemplate.create('ValoraAppController', {
        init: function (controller) {
            this.controller = controller;
            this.appReady = false;
        },
        routeEntered: function () {
            var initializeApplicationMetadata = function () {
                var metaData = this.controller.applicationController.appMetaData;
                if (metaData) { return Q(metaData); }
                return this.initializeApplicationMetadata();
            }.bind(this);

            var compileApplication = function () {
                return this.compileApplication();
            }.bind(this);

            var displayApplication = function () {
                this.displayApplication();
                this.controller.isLoading = false;
            }.bind(this);

            var routeEntered = function () {
                initializeApplicationMetadata()
                    .then(compileApplication)
                    .then(displayApplication);
            }.bind(this);

            this.controller.isLoading = true;
            this.appReady = false;
            this.currentSectionIndex = this.controller.customer.applicationSectionIndex ? this.controller.customer.applicationSectionIndex : 0;

            setTimeout(routeEntered, 100);
        },
        routeExited: function () {
            this.controller.applicationController.exit();
            $(window).off('scroll.scrollDepth');
            StickySidebars.destroy();
        },
        initializeClientLibraries: function () {
            StickySidebars.init();
        },
        initializeApplicationMetadata: function () {
            var options = {
                category: Assumptions.metadataKeys.categories.AppQuestions,
                hierarchy: Assumptions.channels.Valora.code
            };

            var setupAppTree = function () {
                return this.controller.applicationController.setupAppTree(options);
            }.bind(this);

            return setupAppTree();
        },
        compileApplication: function () {
            var prerender = function () {
                this.controller.applicationController.handlePrerender();
                return Q();
            }.bind(this);

            var compile = function () {
                this.controller.applicationController.compileApplication();
                if(this.sectionNames.length === 0){
                    _.each(this.controller.applicationController.appMetaData.children, function(e){
                        this.sectionNames.push(e.section);
                    }.bind(this));
                }
                return Q();
            }.bind(this);

            var refresh = function () {
                this.controller.refresh();
                return Q();
            }.bind(this);

            return prerender().then(compile).then(refresh);
        },
        appReady: {
            type: Boolean,
            value: false,
            toServer: false
        },
        sectionNames: {
            type: Array,
            value: [],
            toServer: false
        },
        currentSectionIndex: {
            type: Number,
            value: 0,
            toServer: false
        },
        knowledgement: {
            type: Boolean,
            value: false,
            toServer: false
        },
        applicationControllerGeneralErrorMsg: {
            type: String,
            value: 'Some information is incorrect in this page, please correct before proceeding.'
        },
        sectionError: {
            type: Boolean,
            value: false
        },
        goPrevSection: function(){
            this.currentSectionIndex--;
            this.controller.customer.applicationSectionIndex = this.currentSectionIndex;
            this.controller.publicSave();
        },
        prevSectionExist: function(){
            return this.currentSectionIndex > 0;
        },
        isAbleToProceedNextSection: function(){
            return this.nextSectionExist() && this.isCurrentSectionValid();
        },
        getSectionLevelNodeByIndex: function( sectionIndex ){
            var sectionLevelNodes = this.getSectionLevelNodes();
            if( sectionIndex < 0 || sectionIndex >= sectionLevelNodes.length ){
                return {};
            }
            else {
                return sectionLevelNodes[sectionIndex];
            }
        },
        getSectionQuestions: function( sectionIndex ){
            var sectionNode = this.getSectionLevelNodeByIndex( sectionIndex );
            if( _.isEmpty( sectionNode ) || !('children' in sectionNode) ){
                return [];
            }else{
                var sectionQs = [];
                _.each( sectionNode.children, function(e){
                    if( !e.optional && e.id !== '-1' ){
                        sectionQs.push(e);
                    }
                });
                return sectionQs;
            }
        },
        getShownSectionQuestions: function( sectionIndex ){
            var sectionQs = this.getSectionQuestions( sectionIndex );
            return this.getShownQuestions( sectionQs );
        },
        getShownAnsweredSectionQuestions: function( sectionIndex ){
            var answeredSectionQs = this.getAnsweredSectionQuestions( sectionIndex );
            return this.getShownQuestions( answeredSectionQs );
        },
        getShownQuestions: function( questions ){
            var shownQuestions = [];
            questions.map(function(q){
                if(q.isShown()){
                    shownQuestions.push(q);
                }
            });
            return shownQuestions;
        },
        getAnsweredSectionQuestions: function( sectionIndex ){
            var sectionQs = this.getSectionQuestions( sectionIndex ),
                answeredQs = [];
            sectionQs.map(function(q){
                if(q.isValid()){
                    answeredQs.push(q);
                }
            });
            return answeredQs;
        },
        goNextSection: function(){
            this.controller.customer.applicationPolicy.isValidating = true;

            if(this.controller.validate()){
                this.currentSectionIndex++;
                this.visitedSectionIndex = this.currentSectionIndex;
                this.sectionError = false;
                this.scrollToHead();
            }else{
                this.sectionError = true;
            }

            this.controller.customer.applicationPolicy.isValidating = false;
            this.controller.customer.applicationSectionIndex = this.currentSectionIndex;
            this.controller.publicSave();
        },
        getSectionLevelNodes: function(){
            return this.controller.applicationController.appMetaData.children;
        },
        retrieveSectionNodeByName: function( sectionName ){
            sectionName = sectionName? sectionName : this.getCurrentSectionName();
            return _.find(this.getSectionLevelNodes(), function(e){
                return e.section === sectionName;
            });
        },
        isCurrentSectionValid: function(){
            var currentSectionNode = this.retrieveSectionNodeByName();
            return currentSectionNode.isValid();
        },
        nextSectionExist: function(){
            return this.currentSectionIndex < this.sectionNames.length - 1;
        },
        getCurrentSectionName: function(){
            return this.sectionNames[this.currentSectionIndex];
        },
        onprerender: function () {
            this.controller.applicationController.handlePrerender();
        },
        onrender: function () {

        },
        scrollToHead: function(){
            $('html, body').animate({ scrollTop: 0 }, 'fast');
        },
        onchange: function (bindString) {
            if (!bindString) {
                return;
            }

            var node;
            var isPolicyProp = bindString.indexOf('customer.applicationPolicy.') === 0;
            if (isPolicyProp && this.controller.applicationController.appMetaData) {
                node = this.controller.applicationController.appMetaData.find(bindString);
                if (!node) {
                    return;
                }
                this.controller.applicationController.handleNoneNode(node);
            }
            //this is coming from application controller in haven but valora uses valoraAppController
            //for onchange events
            this.controller.analyticsController.addCustomData('ExitQuestion', bindString);
            this.controller.applicationController.percentProgress();
        },
        cannotSellPolicyReason: function () {
            var reasonId = this.controller.applicationController.notSupportedReason;
            if (!reasonId) {
                return;
            }

            var reasons = {
                'age': 'We\'re sorry! Currently, we aren\'t ready to sell policies where the insured age is not 18-44. We apologize for any inconvenience.',
                'replace': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support replacing an existing policy. We apologize for any inconvenience.',
                'business': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support purchasing for business reasons. We apologize for any inconvenience.',
                'premiumSource': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support paying the premium by means other than income, savings, or gifts/inheritance. We apologize for any inconvenience.',
                'non-us': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support non-permanent U.S. residents. We apologize for any inconvenience.',
                'foreign-owner': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support non-permanent U.S. residents. We apologize for any inconvenience.',
                'military': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support current or anticipating military personnel. We apologize for any inconvenience.',
                'collateral': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support collateral assignment. We apologize for any inconvenience.',
                'economic': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support economic incentives or entitle lender/investor a portion of death benefit. We apologize for any inconvenience.',
                'commitment': 'We\'re sorry! Currently, we aren\'t ready to sell policies that support selling, transferring, or assigning a policy. We apologize for any inconvenience.',
                'hiv_optout': 'We\'re sorry! By opting out of HIV testing you may not continue the application process. Please select another option to proceed. We apologize for any inconvenience.'
            };

            return reasons[reasonId] || '';
        },
        displayApplication: function () {
            this.appReady = true;

            var initializeClientLibraries = function () {
                this.initializeClientLibraries();
            }.bind(this);

            setTimeout(initializeClientLibraries, 500);
        },
        submitHandleBeneficiaries: function () {
            var policy = this.controller.customer.applicationPolicy;

            // This could not be validated on the fly when form fields change. So do it here
            if (policy.insuredType !== policy.ownerType) {
                if (policy.getBeneficiaryType() === '7') { // Other trust
                    policy.beneficiaryType = null;
                    policy.beneficiaryTypeTrigger();
                }
                if (policy.getContingentBeneficiaryType() === '7') { // Other trust
                    policy.contingentBeneficiaryType = null;
                }
            }

        },
        submitHandlePremiumPayer: function () {
            var policy = this.controller.customer.applicationPolicy;

            policy.premiumPayerPerson = policy.getPremiumPayerPerson();
            policy.premiumPayerAddress = policy.getPremiumPayerAddress();
            policy.premiumPayerPhone = policy.getPremiumPayerPhone();
        },
        submitHandleInsuredOwnerTypes: function () {
            var policy = this.controller.customer.applicationPolicy;

            if (policy.insuredType === policy.ownerType) {
                policy.ownerPerson = policy.insured.person;
                policy.ownerPersonResidentialAddress = policy.insured.address;
                policy.ownerPersonPhone = policy.insured.phone;
            }

            policy.ownerPerson.email = this.controller.email;

            // If beneficiary is spouse, fill bene with spouse info
            if (policy.insuredType !== policy.ownerType && policy.getBeneficiaryType() === '9') {
                policy.copySpouseInfoToBene(policy.primaryBeneficiary[0]);
            }
            else if (policy.insuredType !== policy.ownerType && policy.getContingentBeneficiaryType() === '9') {
                policy.copySpouseInfoToBene(policy.contingentBeneficiary[0]);
            }
        },
        scrollToField: function( fieldSelector ){
            $('html, body').animate({ scrollTop: $(fieldSelector).postition().top }, 'fast');
        },
        submitEnabled: function() {
            var answered = _.keys(controller.applicationController.qsAnswered);
            // Checks that all top questions have been answered
            var unanswered = _.difference(this.topLevelQs, answered);

            return !this.controller.applicationController.editingOwnerEmail && this.knowledgement && _.isEmpty(unanswered);
        },
        knowledgementCheck: function() {
            var policy = this.controller.customer.applicationPolicy;
            if( policy.ownerType == policy.insuredType ){
                this.knowledgement = this.controller.applicationController.acknowledgementOwner;
            }else{
                this.knowledgement = this.controller.applicationController.acknowledgementOwner && this.controller.applicationController.acknowledgementInsured;
            }
        },
        getDecision: function () {
            var policy = this.controller.customer.applicationPolicy;
            this.submitHandleBeneficiaries();

            policy.isValidating = true;
            this.controller.clearError(this.controller.applicationController, 'validationCode');

            if (!this.controller.applicationController.validateOwnerState()) {
                return;
            }
            var defaultValidation = this.controller.validate();
            var appValidation = this.controller.applicationController.validateApplication();

            policy.isValidating = false;

            var handleEmailValidationSuccess = function (success) {
                if (success) {
                    return Q(true);
                }

                var code = this.controller.applicationController.validationCode;
                var message = code ? 'bad_email_validation' : 'email_validation_required';

                this.controller.setError(this.controller.applicationController, 'validationCode', {message: message});
                return Q.reject('Email Validation Failed');
            }.bind(this);

            var verifyEmailCodeValidation = function () {
                if (this.controller.customer.emailValidated) {
                    return Q(true);
                }

                return this.controller.applicationController
                    .privateVerifyEmailFromCode(this.controller.applicationController.validationCode)
                    .then(handleEmailValidationSuccess);
            }.bind(this);

            var handleValidationCompletion = function (completion) {
                this.controller.verifyEmailCode = '';
                if (!completion) {
                    return Q(true);
                }

                this.submitHandleInsuredOwnerTypes();
                return this.controller.customer.submitPolicy();
            }.bind(this);

            var handlePolicySubmission = function () {
                this.controller.accountCenterController.currentPolicy = this.controller.customer.applicationPolicy;
                this.controller.routeToPrivate('applicationProcessing');
            }.bind(this);

            var analytics = function(){
                if (this.controller.customer.timeOfFirstVisit) {
                    this.controller.analyticsController.addCustomDimension('DaysSinceFirstVisit',
                        Math.floor(((new Date()).getTime() - this.controller.customer.timeOfFirstVisit) / (1000 * 60 * 60 * 24)));
                }
                this.controller.analyticsController.dripUpdate('APPSUBMIT');
            }.bind(this);

            if (defaultValidation && appValidation) {
                this.controller.isLoading = true;
                this.submitHandlePremiumPayer();

                if (this.editingOwnerEmail) {
                    this.controller.newEmail = this.ownerEmail;
                }
                return Q(true)
                    .then(verifyEmailCodeValidation)
                    .then(handleValidationCompletion)
                    .then(handlePolicySubmission)
                    .then(analytics)
                    .catch(function (err) {
                        console.log(err);
                        this.controller.isLoading = false;
                    }.bind(this));
            }
        }
    });

    return {
        ValoraAppController: ValoraAppController
    };
};
