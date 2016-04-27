module.exports.accountCenterController = function (objectTemplate, getTemplate) {
    if (typeof(require) != 'undefined') {
        Url = require('url');
        Q   = require('q');
        stream = require('stream');
    }
    var Assumptions         = getTemplate('static/Assumptions.js').Assumptions;

    var ValoraPerson        = getTemplate('./models/valoraPerson.js', {app: 'valora'}).ValoraPerson;
    var Address             = getTemplate('./customer/Person.js').Address;

    var PolicyModels        = getTemplate('./customer/Policy.js');
    var Policy              = PolicyModels.Policy;
    var PolicyDoc           = PolicyModels.PolicyDoc;

    var RejectionDictionary = getTemplate('./dictionaries/rejectionReasons.js');
    var RejectionReasons    = RejectionDictionary.rejectionReasons;
    var RejectionCodes      = RejectionDictionary.rejectionCodes;


    var EclipsePolicyDoc    = getTemplate('./services/eclipse/EclipsePolicyDoc.js').EclipsePolicyDoc;

    var Workflow            = getTemplate('./workflow/Workflow.js', {client: false}).PolicyWorkflow;
    getTemplate('./test/TestUtils.js', {client: false}); // Needed by workflow

    var AccountCenterController = objectTemplate.create('AccountCenterController', {
        currentPolicy: {
            type: Policy
        },
        currentPartial: {
            isLocal: true,
            type: String
        },
        testMode: {
            isLocal: true,
            type: Boolean
        },
        tempInsuredPerson: {
            type: ValoraPerson
        },
        tempInsuredAddress: {
            type: Address
        },
        tempOwnerPerson: {
            type: ValoraPerson
        },
        tempOwnerAddress: {
            type: Address
        },
        tempInsuredLoaded: {
            isLocal: true,
            type: Boolean
        },
        tempOwnerLoaded: {
            isLocal: true,
            type: Boolean
        },
        tempMVRLoaded: {
            isLocal: true,
            type: Boolean
        },
        temporaryLanguage: {
            type: String
        },
        activeSection: {
            isLocal: true,
            type: String,
            value: 'account-info'
        },
        sections: {
            isLocal: true,
            type: Array,
            value: ['account-info', 'account-messages', 'account-settings']
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
        init: function (controller) {
            this.controller = controller;

            this.tempInsuredPerson = new ValoraPerson();
            this.tempOwnerPerson = new ValoraPerson();

            this.tempInsuredAddress = new Address();
            this.tempOwnerAddress = new Address();

            this.currentPolicy = this.controller.customer.applicationPolicy;
        },
        routeEntered: function () {
            this.currentPolicy = this.controller.customer.applicationPolicy;
            this.controller.isLoading = false;
        },
        shutdown: function () {
        },
        currentPolicyCarrier: function () {
            return this.currentPolicy.selectedQuote.policies[0].carrier;
        },
        currentPolicyTypeName: function () {
            return this.currentPolicy.issuedDate ? 'Policy #' : 'Application #';
        },
        currentPolicyNumber: function () {
            return this.currentPolicy.policyNumber;
        },
        hasFinishedApplication: function () {
            return !!this.currentPolicy.workflowState;
        },
        setActiveSection: function (section) {
            if (this.sections.indexOf(section) === -1) { return; }

            this.activeSection = section;
            this.loadingPolicyDocs = true;

            if( this.activeSection === 'account-messages' ){
                this.getPolicyDocs('CORRESPONDENCE');
            }

            if ( this.activeSection === 'account-settings' ) {
                this.setTemporaryLanguage(this.controller.customer.language);
            }
        },
        setTemporaryLanguage: function (language) {
            this.temporaryLanguage = language;
        },
        updateLanguagePreference: function () {
            var sendLanguageChangeNotification = function () {
                this.sendLanguageChangeNotification();
            }.bind(this);

            this.saveLanguagePreference()
                .then(sendLanguageChangeNotification);
        },
        noLanguageChange: function () {
            var noLanguageChange = this.temporaryLanguage === this.controller.customer.language;

            return noLanguageChange ? 'disabled' : '';
        },
        preferSpanish: function () {
            return this.temporaryLanguage === Assumptions.languages.es;
        },
        saveLanguagePreference: function () {
            return this.publicSaveLanguagePreference();
        },
        publicSaveLanguagePreference: {
            on: 'server',
            body: function () {
                this.controller.customer.language = this.temporaryLanguage;
            }
        },
        sendLanguageChangeNotification: {
            on: 'server',
            body: function() {
                var templateSlug    = 'confirmation-language-changed';
                var recipientEmail  = this.controller.customer.email;
                var languageName    = this.controller.customer.language;

                var emailVars       = [
                    { name: 'languageName', content: languageName }
                ];

                this.controller.sendEmail(templateSlug, recipientEmail, null, emailVars);
            }
        },
        activeSectionPartial: function() {
            return 'partials/account-center/' + this.activeSection + '.html';
        },
        navClass: function(section) {
            if (section !== this.activeSection) { return ''; }

            return 'account-subnav__link--active';
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

        toggleLanguage: function () {
            console.log(this.controller.customer.language);
        },

        clearPasswords: function () {
            this.controller.newPassword     = '';
            this.controller.confirmPassword = '';
            this.controller.password        = '';
        },

        resetPassword: function (href) {

            var publicResetPassword = function () {
                var url = href || document.location.href;
                return this.controller.publicResetPassword(url);
            }.bind(this);

            var routeToResetPasswordInfo = function () {
                this.controller.routeToPrivateModal('resetPasswordInfo');
                return Q();
            }.bind(this);

            var error = function (_err) {
                var err_msg = 'This email address does not match our records.';
                this.setErrorFieldHelper(this.controller, 'resetPassword', err_msg);
                // Refresh the controller to display the error...hack again...
                this.controller.refresh();
            }.bind(this);

            return Q()
                .then(publicResetPassword)
                .then(routeToResetPasswordInfo)
                .catch(error);
        },

        setErrorFieldHelper:  function(controller, errField, errDetail){
            if( typeof errDetail === 'string'){
                this.controller.setError(controller, errField, errDetail);
            }
            else if (typeof errDetail === 'object') {
                this.controller.setError(controller, errField, errDetail.text);
            }
        },

        changePasswordFromReset: function () {

            var error = function (err) {
                this.setErrorFieldHelper(this.controller, 'resetPasswordConfirm', err);
            }.bind(this);

            var publicControllerLogin = function () {
                return this.controller.publicLoginUser('fromToken');
            }.bind(this);

            var closeModal = function () {
                this.controller.exitModal();
                return Q();
            }.bind(this);

            var routeToAccountCenter = function () {
                this.controller.routeToPrivate('accountCenter');
                return Q(true);
            }.bind(this);

            var confirmPassword = function () {
                if(this.controller.newPassword !== this.controller.confirmPassword) {
                    throw {code: 'resetPasswordConfirm', text: "Confirm password doesn't match"};
                }
                return Q(true);
            }.bind(this);


            return Q()
                .then(confirmPassword)
                .then(publicControllerLogin)
                .then(closeModal)
                .then(routeToAccountCenter)
                .catch(error);
        },

        /**
         * Handles all email change situations and returns true if you can proceed.  If you need verification
         * or there is an error it returns false.  Returns are async via a promise
         * @returns {*}
         */
        resetEmail: function (href) {
            var error = function (err) {
                this.setErrorFieldHelper(this.controller, 'resetEmail', err);
                this.clearPasswords();
                return Q(false);
            }.bind(this);

            var clearSetting = function () {
                this.controller.routeToPrivateModal('changeEmail');
                this.clearPasswords();
                this.editingOwnerEmail = false;
                this.ownerEmailChanged = true;

                return Q(true);
            }.bind(this);

            var changeEmail = function () {
                var url = href || document.location.href;
                return this.controller.changeEmail(null, url);
            }.bind(this);

            this.controller.newEmail = this.ownerEmail;

            return Q()
                .then(changeEmail)
                .then(clearSetting)
                .catch(error);
        },

        /**
         * Populate the temporary insured, owner persons with data from the
         * current policy. Once an application has been submitted, a policy can
         * updated only via these temp object
         */
        isTempInsuredLoaded: function () {
            var tempPerson = this.tempInsuredPerson;
            var tempAddress = this.tempInsuredAddress;

            // TOD0:  Used to get it working.  Remove in production
            // Probably should be set in rowEntered() or init()
            this.currentPolicy = this.controller.customer.applicationPolicy;
            //

            if (!this.tempInsuredLoaded) {
                tempPerson.firstName = this.currentPolicy.insured.person.firstName;
                tempPerson.middleName = this.currentPolicy.insured.person.middleName;
                tempPerson.lastName = this.currentPolicy.insured.person.lastName;

                tempPerson.SSN = this.currentPolicy.insured.person.SSN;
                tempPerson.dob = this.currentPolicy.insured.person.dob;

                tempAddress.street = this.currentPolicy.insured.address.street;
                tempAddress.line1 = this.currentPolicy.insured.address.line1;
                tempAddress.zip = this.currentPolicy.insured.address.zip;
                tempAddress.city = this.currentPolicy.insured.address.city;
                tempAddress.state = this.currentPolicy.insured.address.state;
                tempAddress.latitude = this.currentPolicy.insured.address.latitude;
                tempAddress.longitude = this.currentPolicy.insured.address.longitude;
                tempAddress.timezone = this.currentPolicy.insured.address.timezone;

                // Set up zip code lookup and validation
                var controller = this.controller;
                var applicationPolicy = this.controller.customer.applicationPolicy;
                Address.inject(function () {
                    //var currentZipSet = this.zipSet;
                    this.zipSet = function (zip) {

                        var promise = controller.publicGetLocationByZip(zip)
                            .then(saveZip.bind(this))
                            .then(isStateValid.bind(this));

                        controller.accountCenterController.pendingPromise = promise;
                        return promise;

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
                            if (this === tempAddress && applicationPolicy.insuredType === applicationPolicy.ownerType) {
                                if (!controller.isProductSoldIn(this.state)) {
                                    controller.route.public.dialog.invalid_state_appl();
                                    throw 'Not sold here';
                                }
                            }
                        }
                    };
                });

                this.tempInsuredLoaded = true;
            }

            return this.tempInsuredLoaded;
        },

        isTempOwnerLoaded: function () {
            var tempPerson = this.tempOwnerPerson;
            var tempAddress = this.tempOwnerAddress;

            if (!this.tempOwnerLoaded) {
                tempPerson.firstName = this.currentPolicy.ownerPerson.firstName;
                tempPerson.middleName = this.currentPolicy.ownerPerson.middleName;
                tempPerson.lastName = this.currentPolicy.ownerPerson.lastName;

                tempPerson.SSN = this.currentPolicy.ownerPerson.SSN;
                tempPerson.dob = this.currentPolicy.ownerPerson.dob;

                tempAddress.street = this.currentPolicy.ownerPersonResidentialAddress.street;
                tempAddress.line1 = this.currentPolicy.ownerPersonResidentialAddress.line1;
                tempAddress.zip = this.currentPolicy.ownerPersonResidentialAddress.zip;
                tempAddress.city = this.currentPolicy.ownerPersonResidentialAddress.city;
                tempAddress.state = this.currentPolicy.ownerPersonResidentialAddress.state;
                tempAddress.latitude = this.currentPolicy.ownerPersonResidentialAddress.latitude;
                tempAddress.longitude = this.currentPolicy.ownerPersonResidentialAddress.longitude;
                tempAddress.timezone = this.currentPolicy.ownerPersonResidentialAddress.timezone;

                // Set up zip code lookup and validation
                var controller = this.controller;
                //var applicationPolicy = this.controller.customer.applicationPolicy;
                //var promise = this.pendingPromise;
                Address.inject(function () {
                    this.zipSet = function (zip) {

                        var promise = controller.publicGetLocationByZip(zip)
                            .then(saveZip.bind(this))
                            .then(isStateValid.bind(this));

                        controller.accountCenterController.pendingPromise = promise;
                        return promise;

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
                            if (this === tempAddress) {
                                if (!controller.isProductSoldIn(this.state)) {
                                    controller.route.public.dialog.invalid_state_appl();
                                    throw 'Not sold here';
                                }
                            }
                        }
                    };
                });

                this.tempOwnerLoaded = true;
            }
            return this.tempOwnerLoaded;
        },

        isTempMVRLoaded: function () {

            if (!this.tempMVRLoaded) {
                this.tempInsuredPerson.idNumber = this.currentPolicy.insured.person.idNumber;
                this.tempInsuredPerson.idState = this.currentPolicy.insured.person.idState;
                this.tempInsuredPerson.idExpires = this.currentPolicy.insured.person.idExpires;

                this.tempMVRLoaded = true;
            }
            return this.tempMVRLoaded;
        },

        /**
         * Called by the server, prior to a required being fulfilled. For e.g. when
         * a policy has been updated with SSN info, the server calls this method to update
         * the policy it is holding onto before fulfilling the LexisNexis check requirement.
         */
        tempInsuredSave: function () {
            this.currentPolicy.insured.person.firstName = this.tempInsuredPerson.firstName;
            this.currentPolicy.insured.person.middleName = this.tempInsuredPerson.middleName;
            this.currentPolicy.insured.person.lastName = this.tempInsuredPerson.lastName;

            this.currentPolicy.insured.person.SSN = this.tempInsuredPerson.SSN;
            this.currentPolicy.insured.person.dob = this.tempInsuredPerson.dob;

            this.currentPolicy.insured.address.street = this.tempInsuredAddress.street;
            this.currentPolicy.insured.address.line1 = this.tempInsuredAddress.line1;
            this.currentPolicy.insured.address.zip = this.tempInsuredAddress.zip;
            this.currentPolicy.insured.address.city = this.tempInsuredAddress.city;
            this.currentPolicy.insured.address.state = this.tempInsuredAddress.state;
            this.currentPolicy.insured.address.latitude = this.tempInsuredAddress.latitude;
            this.currentPolicy.insured.address.longitude = this.tempInsuredAddress.longitude;
            this.currentPolicy.insured.address.timezone = this.tempInsuredAddress.timezone;
        },

        tempOwnerSave: function () {
            this.currentPolicy.ownerPerson.firstName = this.tempOwnerPerson.firstName;
            this.currentPolicy.ownerPerson.middleName = this.tempOwnerPerson.middleName;
            this.currentPolicy.ownerPerson.lastName = this.tempOwnerPerson.lastName;

            this.currentPolicy.ownerPerson.SSN = this.tempOwnerPerson.SSN;
            this.currentPolicy.ownerPerson.dob = this.tempOwnerPerson.dob;

            this.currentPolicy.ownerPersonResidentialAddress.street = this.tempOwnerAddress.street;
            this.currentPolicy.ownerPersonResidentialAddress.line1 = this.tempOwnerAddress.line1;
            this.currentPolicy.ownerPersonResidentialAddress.zip = this.tempOwnerAddress.zip;
            this.currentPolicy.ownerPersonResidentialAddress.city = this.tempOwnerAddress.city;
            this.currentPolicy.ownerPersonResidentialAddress.state = this.tempOwnerAddress.state;
            this.currentPolicy.ownerPersonResidentialAddress.latitude = this.tempOwnerAddress.latitude;
            this.currentPolicy.ownerPersonResidentialAddress.longitude = this.tempOwnerAddress.longitude;
            this.currentPolicy.ownerPersonResidentialAddress.timezone = this.tempOwnerAddress.timezone;
        },

        tempMVRSave: function () {
            this.currentPolicy.insured.person.idNumber = this.tempInsuredPerson.idNumber;
            this.currentPolicy.insured.person.idState = this.tempInsuredPerson.idState;
            this.currentPolicy.insured.person.idExpires = this.tempInsuredPerson.idExpires;
        },


        /*
         * Actions that affect workflow
         */
        checkIDFixedReq: function () {
            if (this.currentPolicy.workflowSubState === 'Correcting Insured SSN') {
                this.checkInsuredIDFixedReq();

            } else if (this.currentPolicy.workflowSubState === 'Correcting Owner SSN') {
                this.checkOwnerIDFixedReq();
            }
        },
        checkRequirement: {
            on: 'server',
            body: function (options) { // SecReviewed
                var opts            = options || {};
                var requirement     = opts.requirement;
                var futureSubState  = opts.futureSubState;
                var futureState     = opts.futureState;

                // TODO: Check if the requirement can be fulfilled by examining the policy
                // state

                // Check for Display name in the associated policy requirements and fulfill it
                var reqToCheck = _.find(this.currentPolicy.currentStageRequirements, function (req) {
                    return req.match(new RegExp(requirement));
                });

                if (reqToCheck) {
                    switch (requirement) {
                        case 'Fix Insured ID':
                            // Copy temp info onto the policy
                            this.tempInsuredSave();
                            break;

                        case 'Fix Owner ID':
                            // Copy temp info onto the policy
                            this.tempOwnerSave();
                            break;

                        case 'Fix MVR' :
                            // Copy temp info onto the policy
                            this.tempMVRSave();
                            break;

                        case 'Accept':
                            throw 'Cannot change Policy state';
                    }

                    return this.fulfillReq(reqToCheck, futureSubState, futureState);
                }
            }
        },
        validateCorrectingID: function () {
            function clearPendingPromise() {
                this.pendingPromise = null;
                return Q();
            }

            // Make sure if the zip code was changed, the promise to lookup the zip code has been resolved before
            // submitting the form
            if (this.controller.validate()) {
                if (this.pendingPromise) {
                    Q(this.pendingPromise)
                        .then(clearPendingPromise.bind(this))
                        .then(this.checkIDFixedReq.bind(this));
                } else {
                    this.checkIDFixedReq();
                }
            }
        },
        getPartials: function () {

            function makeArray(value) {
                if (_.isArray(value)) {
                    return value;
                }
                return [value];
            }

            var workflowRoutes = this.controller.workflowRoutes;
            var policy = this.controller.customer.applicationPolicy;
            var state = policy.futureWorkflowState || policy.workflowState;
            var subState = state === 'Manual Underwriting' ? '' : policy.futureWorkflowSubState || policy.workflowSubState;
            var routeDefinition = workflowRoutes[state + ':' + subState];
            var partials;

            if (routeDefinition.partial) {
                partials = _.isArray(routeDefinition.partial)
                    ? makeArray(routeDefinition.partial[0])
                    : makeArray(routeDefinition.partial);
            } else {
                partials = ['application-processing'];
            }

            return partials;
        },
        workflowSubStateGet: function (policy) {
            return policy.futureWorkflowSubState || policy.workflowSubState;
        },
        handleRequirementCheckTransition: function () {
            this.reqSetTime = new Date().getTime();
            this.controller.routeToPrivate('applicationProcessing');
        },
        checkInsuredIDFixedReq: function () {
            this.checkRequirement({
                requirement:    'Fix Insured ID',
                futureSubState: 'Gathering Data'
            }).then(this.handleRequirementCheckTransition.bind(this));
        },
        checkOwnerIDFixedReq: function () {
            this.checkRequirement({
                requirement:    'Fix Owner ID',
                futureSubState: 'Gathering Data'
            }).then(this.handleRequirementCheckTransition.bind(this));
        },
        checkMVRFixedReq: function () {
            this.checkRequirement({
                requirement:    'Fix MVR',
                futureSubState: 'Gathering Data'
            }).then(this.handleRequirementCheckTransition.bind(this));
        },
        checkAcceptApplicationReq: function () {
            this.checkRequirement({
                requirement:    'Accept Application',
                futureSubState: 'Waiting for Signature'
            }).then(this.handleRequirementCheckTransition.bind(this));
        },
        acceptOffer: function () {
            this.checkRequirement({
                requirement:    'Accept Application',
                futureState:    'Application',
                futureSubState: 'Issuing Policy'
            }).then(function(){
                this.reqSetTime = new Date().getTime();
                this.controller.routeToPrivate('applicationProcessing');
                return Q();
            }).then(function(){
                this.controller.routeToPrivateModal('offerAccepted');
            });
        },
        resendDocusign: function () {
            this.checkRequirement({
                requirement: 'Resend Application to Docusign',
                futureSubState: 'Waiting for Signature'
            }).then(this.handleRequirementCheckTransition.bind(this));
        },
        cancelApplication: function () {
            this.checkRequirement({
                requirement:    'Cancel',
                futureState:    'Application Canceled By User',
                futureSubState: 'Without TLIC'
            });
        },
        cancelApplicationAndSetRoute: function () {
            this.controller.customer.applicationSectionIndex = 0;
            this.checkRequirement({
                requirement: 'Cancel',
                futureState: 'Application Canceled By User',
                futureSubState: 'Without TLIC'
            }).then(function () {
                this.controller.routeToPrivate('accountCenter');
            }.bind(this));
        },
        checkAcceptApplicationRequirements: function () {
            this.controller.isLoading = true;
            this.checkRequirement({
                requirement: 'Accept Application',
                futureSubState: 'Waiting for Signature'
            }).then(this.handleRequirementCheckTransition.bind(this));
        },
        cancelApplicationFromModal: function () {
            var exitModal = function () {
                this.controller.exitModal();
                return Q();
            }.bind(this);

            var cancelAndRoute = function () {
                return this.cancelApplicationAndSetRoute();
            }.bind(this);

            return exitModal().then(cancelAndRoute);
        },
        cancelPolicyFromModal: function () {
            var exitModal = function () {
                this.controller.exitModal();
                return Q();
            }.bind(this);

            var cancelAndRoute = function () {
                return this.cancelApplicationAndSetRoute();
            }.bind(this);

            var triggerCancelPolicyInfoModal = function () {
                this.controller.routeToPrivateModal('cancelPolicyInfo');
            }.bind(this);

            exitModal()
                .then(cancelAndRoute)
                .then(triggerCancelPolicyInfoModal);
        },
        fulfillReq: function (req, futureSubState, futureState) {
            // Set up states where we think the workflow will go to guide the UI
            if (futureSubState) {
                this.currentPolicy.futureWorkflowSubState = futureSubState;
            }
            if (futureState) {
                this.currentPolicy.futureWorkflowState = futureState;
            }
            // Fulfill the requirement using a transient copy of the workflow to avoid trips to the browser
            return Q()
                .then(fetchPolicyAndWorkflow.bind(this))
                .then(fulfillRequirements.bind(this))
                .then(logFulfillment.bind(this));

            function fetchPolicyAndWorkflow() {
                // Fetch a fresh policy and workflow as transiernt objects
                return Policy.getFromPersistWithId(this.currentPolicy._id, {workflow: true}, true);
            }

            function fulfillRequirements(transientPolicy) {
                return Workflow.fulfillRequirements(transientPolicy.workflow, [req]);
            }

            function logFulfillment() {
                console.log('Policy Future Stage' + this.currentPolicy.futureWorkflowSubState + ' ' + this.currentPolicy.futureWorkflowState);
                console.log('Fulfilled ' + req);
            }
        },
        isInWorkflowState: function(state, subState) {
            var workflowState       = this.currentPolicy.workflowState;
            var workflowSubState    = this.currentPolicy.workflowSubState;

            //Allow Checking Of Just WorkflowState or WorkflowSubState
            if (!state) { return workflowSubState === subState; }
            if (!subState) { return workflowState === state; }

            return workflowState === state && workflowSubState === subState;
        },
        isPolicyTLICStatus: function (status) {
            return this.currentPolicy.tLICStatus === status;
        },
        isPolicyWorkflowState: function (state) {
            return this.currentPolicy.workflowState === state;
        },
        isTLICPolicy: function () {
            return this.currentPolicy.isTLIC();
        },
        isTLICIssued: function () {
            return this.currentPolicy.workflowState === 'TLIC Issued';
        },
        isNotTLICIssued: function () {
            return !this.isTLICIssued();
        },
        isTLICApplication: function () {
            return this.currentPolicy.workflowState === 'TLIC Application';
        },
        isTLIC: function () {
            return this.currentPolicy.workflowState === 'TLIC Issued' || this.currentPolicy.workflowState === 'TLIC Application';
        },
        isNotTLIC: function () {
            return !this.isTLIC();
        },
        insuredFirstName: function () {
            return this.currentPolicy.insured.person.firstName;
        },
        insuredFullName: function () {
            return this.currentPolicy.insured.person.getFullName();
        },
        isApplication: function () {
            return this.currentPolicy.workflowState === 'Application';
        },
        isHavenApplication: function () {
            return this.currentPolicy.workflowState === 'Haven Application';
        },
        isManualUnderwriting: function () {
            return this.currentPolicy.workflowState === 'Manual Underwriting';
        },
        isLapsePending: function () {
            return this.currentPolicy.status === 'LapsePending' || this.currentPolicy.tLICStatus === 'LapsePending';
        },
        notLapsePending: function () {
            return !this.isLapsePending();
        },
        isPendingPolicyDocs: function () {
            return this.currentPolicy.workflowSubState === 'Pending Policy Docs';
        },
        isNotPendingPolicyDocs: function () {
            return !this.isPendingPolicyDocs();
        },
        subStateIsPendingPolicyDocs: function () {
            return this.currentPolicy.workflowSubState === 'Pending Policy Docs';
        },
        subStateIsNotPendingPolicyDocs: function () {
            return !this.subStateIsPendingPolicyDocs();
        },
        subStateIsFreeLookPeriod: function () {
            return this.currentPolicy.workflowSubState === 'Free Look Period';
        },
        subStateIsWaitingForAcceptance: function () {
            return this.currentPolicy.workflowSubState === 'Waiting for Application Acceptance';
        },
        subStateIsWaitingForSignature: function () {
            return this.currentPolicy.workflowSubState === 'Waiting for Signature';
        },
        isInForce: function () {
            return this.currentPolicy.workflowState === 'In Force';
        },
        freeLookPeriodEndDate: function () {
            return this.currentPolicy.freeLookEndsOn;
        },
        lapseDate: function () {
            return this.currentPolicy.willLapseOn;
        },
        tlicPremiumAmount: function () {
            return this.currentPolicy.tLICPremiumBreakdown.getTotal();
        },
        hasTlicEffectiveDate: function () {
            return !!this.currentPolicy.tLICEffectiveDate;
        },
        premiumAmount: function () {
            return this.currentPolicy.premiumBreakdown.getTotal();
        },
        premiumBase: function () {
            return this.currentPolicy.premiumBreakdown.base;
        },
        medicalExamDueDate: function () {
            return this.currentPolicy.paramedRequiredBy;
        },
        currentPolicyLogo: function () {
            return '/img/valora-policy-logo.png';
        },
        currentPolicyCarrierName: function () {
            return this.currentPolicy.selectedQuote.policies[0].carrier;
        },
        currentPolicyType: function () {
            return this.currentPolicy.issuedDate ? 'Policy #' : 'Application #';
        },
        currentPolicyProductName: function () {
            return this.currentPolicy.getProductInfo().name;
        },
        currentPolicyFaceAmount: function () {
            return this.currentPolicy.selectedQuote.policies[0].face;
        },
        currentPolicyTerm: function () {
            return this.currentPolicy.selectedQuote.policies[0].term;
        },
        currentPolicyHasBase: function () {
            return !!this.currentPolicy.premiumBreakdown.base;
        },
        showEstimated: function () {
            var partials = this.getPartials();

            var hasAppSign = partials.indexOf('application-signature') > -1;
            var hasAppManualUnderwriting = partials.indexOf('manual-underwriting') > -1;
            var hasAppLabs = partials.indexOf('application-labs') > -1;
            var hasFinalUnderwriting = partials.indexOf('policy-final-underwriting') > -1;

            return hasAppSign || hasAppManualUnderwriting || hasAppLabs || hasFinalUnderwriting;
        },
        waiverHasValue: function () {
            return this.currentPolicy.waiver && this.currentPolicy.premiumBreakdown.waiver > 0;
        },
        hasFlatExtras: function () {
            return this.currentPolicy.premiumBreakdown.flatExtras.length > 0;
        },
        getFlatExtraName: function (flatExtra) {
            return flatExtra.name.split('; Answered')[0];
        },
        showSeeDetails: function () {
            var hasFlatExtras = this.hasFlatExtras();
            var waiverHasValue = this.waiverHasValue();
            var premiumHasValue = this.currentPolicy.premiumBreakdown.getTotal() != 0;

            return hasFlatExtras || ( waiverHasValue && premiumHasValue );
        },
        showViewApplication: function () {
            //Show if policy is not In Force & Issued
            return !this.showViewPolicy();
        },
        showViewPolicy: function () {
            //Show if policy is In Force & Issued or In Force & Free Look Period
            return this.isInWorkflowState('In Force', 'Issued') || this.isInWorkflowState('In Force', 'Free Look Period');
        },
        showCancelApplication: function () {
            //Show if you do not have a TLIC or a policy
            return !this.isInWorkflowState('In Force', null) && !this.currentPolicy.tlicAccepted();
        },
        showCancelPolicy: function () {
            //Show if you do have a TLIC or a policy that is in Free look or in Pending Policy Docs
            return this.isInWorkflowState('In Force', 'Free Look Period')
                || this.isInWorkflowState('In Force', 'Pending Policy Docs')
                || (!this.isInWorkflowState('In Force', null) && this.currentPolicy.tlicAccepted());
        },
        showCancelPolicyDocusign: function () {
            //Show if you are out of free look and are in force
            return this.isInWorkflowState('In Force', 'Issued');
        },
        /**
         *  Shown if workflowstate is 'TLIC issued' or 'In Force'
         */
        showViewMessages: function () {
            return this.isTLICIssued() || this.isInForce();
        },
        /**
         *  Shown if workflowstate is 'In Force' and workflowSubState is not 'Pending Policy Docs'
         */
        showMakeChanges: function () {
            return this.isInForce() && this.subStateIsNotPendingPolicyDocs();
        },

        rejectedReasons: function () {
            var policy = this.currentPolicy;
            if (!policy.rejectedReasons || policy.rejectedReasons.length === 0) { return null; }

            var startReason = 'At this time, we can’t offer you the ' + this.currentPolicyProductName() + ' policy because ';

            var reason;
            var economicIncentiveAgreementsCode = '25.13.3';
            //If only one reason, display that reason
            if (policy.rejectedReasons.length === 1) {
                reason = policy.rejectedReasons[0];

                return {
                    many: false,
                    description: startReason + RejectionReasons[RejectionCodes[reason]].long,
                    shortDescriptions: []
                };
            } else if ( _.contains(this.rejectedReasons, economicIncentiveAgreementsCode) ){
                return {
                    many: false,
                    description: startReason + RejectionReasons['economicIncentiveAgreements'].long,
                    shortDescriptions: []
                };
            }
            return {
                many: true,
                description: startReason + RejectionReasons['multipleReasons'].long,
                shortDescriptions: this.rejectedReasons.map(function(reason) {
                    return RejectionReasons[RejectionCodes[reason]].short;
                })
            };
        },

        getCancelText: function () {
            var label;
            var workflowState       = this.currentPolicy.futureWorkflowState || this.currentPolicy.workflowState;
            var workflowSubState    = this.currentPolicy.futureWorkflowSubState || this.currentPolicy.workflowSubState;

            var workflowSubStateCancelTexts = {
                'Without TLIC': 'Your previous life insurance application has been cancelled because it was not completed or e-signed in time.',
                'No Labs': 'Your previous life insurance application has been cancelled because the medical exam was not completed in time.',
                'Not Accepted': 'Your previous life insurance application has been cancelled because you did not accept the offer in time.'
            };

            if (workflowState.match(/Application Canceled/)) {
                if (workflowState === 'Application Canceled By User') {
                    label = 'Your previous life insurance application has been cancelled at your request.';
                } else {
                    label = workflowSubStateCancelTexts[workflowSubState];
                }
            }

            return label;
        },
        insuredOwnerSame: function () {
            return this.currentPolicy.ownerType === this.currentPolicy.insuredType;
        },
        getGreetingText: function () {
            return 'Good Morning';
        },
        showPriceIncreaseReason: function() {
            return this.initialMoreThanSelected() || this.initialMoreThanSelectedRule();
        },
        priceIncreaseReason: function () {
            var reason1 = 'You initially told us you were not a smoker so we quoted you a non-smoking rate. Based on your application, however, you don\'t qualify for a non-smoking rate so your estimated price was updated to reflect a smoker class.';
            var reason2 = 'You initially told us your health was ' + this.initialHealthClassStr() + ' so we quoted you the ' + this.getHealthClassStr(this.initialRateClass()) + ' rate class. After reviewing your full medical history and application your estimated rate class was updated to reflect the ' + this.getHealthClassStr(this.currentPolicy.tLICRateClass) + ' rate class.';
            var reason3 = 'Your insurance age is based on your nearest birthday. Initially you told us you were ' + this.currentPolicy.insured.person.age + ' years old but since you are closer to your ' + this.currentPolicy.insured.getInsuranceAge() + ' birthday your estimated price is based on this age.';

            var reasons = {
                rule1: reason1,
                rule2: reason2,
                rule3: reason3
            };

            var rule = this.initialMoreThanSelectedRule();

            return reasons[rule] || '';
        },
        initialMoreThanSelected: function(){
            var productType = this.currentPolicy.productType;
            var productTypeQuoteIndex = productType === 'ROP' ? 1 : 0;

            var selectedPremiumAmount = this.controller.customer.selectedQuote.policies[productTypeQuoteIndex].monthly;
            var initialPremiumAmount = this.currentPolicy.tLICPremiumBreakdown.base;

            return initialPremiumAmount > selectedPremiumAmount;
        },
        initialMoreThanSelectedRule: function(){
            // Requirements in #1094

            // Rule 1: If user initially said they are a non-smoker but then on the app they are a smoker:
            if (!this.currentPolicy.insured.smoker && this.currentPolicy.isSmoker()) { return 'rule1'; }

            // Rule 2: If initial quote rate class < rate class after algorithmic UW
            var initialRate = Number(this.initialRateClass());
            var tlicRate = Number(this.currentPolicy.tLICRateClass);
            if(initialRate && tlicRate){
                if(initialRate < tlicRate){
                    return 'rule2';
                }
            }

            // Rule 3: If Age at Quote < Age at application
            if(this.currentPolicy.insured.person.age < this.currentPolicy.insured.getInsuranceAge()){
                return 'rule3';
            }

            return '';
        },
        initialRateClass: function(){

            // Mimic logic used to compute code.
            //{1:"Ultra", 2:"Select", 3:"Standard", 4:"Select Tobacco", 5:"Standard Tobacco"}},
            var healthClass = this.currentPolicy.insured.healthClass.split('S')[0];
            if (healthClass === 'Rg') { healthClass = 'R+'; }
            // If health class is Pf+ and is smoker, drop the class to Pf
            if (healthClass === 'P+' && this.currentPolicy.insured.smoker) { healthClass = 'Pf'; }

            var smoker = this.currentPolicy.insured.smoker;
            var rating = '';

            if (healthClass === 'P+') {
                rating = 'Ultra';
            } else if (healthClass === 'Pf') {
                rating = smoker ? 'Select Tobacco' : 'Select';
            } else if (healthClass === 'R+') {
                rating = smoker ? 'Standard Tobacco' : 'Standard';
            }

            // Map the rating to numbers
            for(var key in this.currentPolicy.finalRateClassValues){
                if(this.currentPolicy.finalRateClassValues.hasOwnProperty(key)) {
                    if(rating === this.currentPolicy.finalRateClassValues[key]){
                        return key;
                    }
                }
            }

            return '';
        },
        initialHealthClassStr: function(){
            return this.currentPolicy.insured.healthClassNumberValues[this.currentPolicy.insured.healthClassNumber].toLowerCase();
        },
        getHealthClassStr: function(rating){
            var ratingNum = parseInt(rating);
            var rateClass = '';

            switch(ratingNum){
                case 1:
                    rateClass = 'best';
                    break;
                case 2:
                    rateClass = 'second best';
                    break;
                case 3:
                    rateClass = 'third best';
                    break;
                case 4:
                    rateClass = 'fourth best';
                    break;
                case 5:
                    rateClass = 'fifth best';
                    break;
            }
            return rateClass;
        },
        createNewPolicyAndRouteTo: function (route) {
            var handleSuccess = function (success) {
                if (!success) {
                    console.log('Could not create new Policy');
                    return;
                }

                this.controller.customer.progress = 2;
                this.currentPolicy = this.controller.customer.applicationPolicy;
                this.controller.routeToPrivate(route);
            }.bind(this);

            var tryAgain = function () {
                this.createNewPolicyAndRouteTo(route);
            }.bind(this);

            var handleError = function (error) {
                console.log(error);
                this.controller.customerRefresh().then(tryAgain);
            }.bind(this);

            var cancelAndCreate = function () {
                return this.controller.customer.cancelAndCreateNewPolicy();
            }.bind(this);

            return Q()
                .then(cancelAndCreate)
                .then(handleSuccess, handleError);
        },
        hasNotFinishedApplication: function () {
            return !this.hasFinishedApplication();
        },
        continueApplication: function () {
            this.controller.routeToPrivate('application');
        },
        //----------------- BEGIN CORRESPONDENCE AND POLICY SECTION------------------
        policyDocs: {
            type: Array,
            of: EclipsePolicyDoc,
            value:[]
        },
        selectedDoc: {
            type: EclipsePolicyDoc
        },
        loadingPolicyDocs: {
            type: Boolean,
            value: true
        },
        hasPolicyDocs: function () {
            return this.policyDocs.length > 0 && !this.loadingPolicyDocs;
        },
        hasNoPolicyDocs: function () {
            return this.policyDocs.length === 0 && !this.loadingPolicyDocs;
        },
        viewApplication: function () {
            window.open('amorphic/xhr?path=valora&file=true&viewapplication=true');
        },
        viewPolicyChangeForm: function (formType) {
            var docuSignPolicyChangeFormLink = this.getPolicyChangeLink(formType);
            window.open(docuSignPolicyChangeFormLink);
        },
        getPolicyChangeLink: function (formType) {
            var docuSignPowerFormRoot = 'https://na2.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=';
            //TODO: cancelPolicy: 43797a83-acaa-43a3-ab84-c9410a3507cd

            var formTypes = {
                bankAccount:        '108f0a12-aca9-4ec9-aeb7-8bd871f4dd3c',
                beneficiary:        '8e21a59a-476d-44d2-920f-ddb99fd3c1dc',
                owner:              '65c36322-aac1-479a-9c32-a41c9c163d3f',
                mailingAddress:     'b13645e1-7977-482b-94bd-bcaa3731ee27',
                name:               '7feb3951-ccdd-4da7-95ca-88e36fe4a9c1',
                faceAmount:         '02028dc4-e3a2-4a63-9021-7e98654a45a5',
                duplicatePolicy:    '327b7fbd-d5b8-487a-970e-b118e730f87d',
                cancelPolicy:       '43797a83-acaa-43a3-ab84-c9410a3507cd'
            };

            var formTypeId  = formTypes[formType];
            var params      = this.ownerNameEmailEncode();

            return docuSignPowerFormRoot + formTypeId + params;
        },
        ownerNameEmailEncode: function(){
            var encodedOwnerName = encodeURIComponent(this.currentPolicy.ownerPerson.getFullName());
            var encodedOwnerEmail = encodeURIComponent(this.currentPolicy.ownerPerson.email);

            return '&Owner_UserName=' + encodedOwnerName + '&Owner_Email=' + encodedOwnerEmail;
        },
        viewPolicyPdf: function () {
            this.policyDocs = [];

            var setSelectedDoc = function () {
                this.selectedDoc = this.policyDocs[0];
                return Q();
            }.bind(this);

            var openPdf = function () {
                this.openDoc();
            }.bind(this);

            this.getPolicyDocsServer('POLICY')
                .then(setSelectedDoc)
                .then(openPdf);
        },
        getPolicyDocs: function(type){
            this.policyDocs = [];
            return this.getPolicyDocsServer(type);
        },
        getPolicyDocsServer: {
            on: 'server',
            body: function(type) {
                this.controller.error = null;
                this.loadingPolicyDocs = true;

                var getEclipseDocs = function() {
                    return this.controller.eclipseService.getDocs(type);
                }.bind(this);

                var filterDocs = function(docs){
                    var filteredDocs = this.filterDocs(type, docs);

                    filteredDocs.forEach(function (obj) {
                        this.policyDocs.push(new EclipsePolicyDoc(obj));
                    }.bind(this));

                    this.loadingPolicyDocs = false;
                    return this.policyDocs;

                }.bind(this);

                var handleError = function(error) {
                    this.loadingPolicyDocs = false;
                    console.log(error);
                }.bind(this);

                return Q()
                    .then(getEclipseDocs)
                    .then(filterDocs)
                    .catch(handleError);
            }
        },

        filterDocs: function(type, docs) {
            var retDocs = [];
            var groups;

            if (type === 'POLICY') {
                groups = {};
                groups['POLICY'] = docs;
            } else {
                // There could be more than one message (e.g. more than 1 LapsePending doc)
                // Sort by chrononological order and take the newest one
                groups = _.groupBy(docs, function (doc) {
                    return doc.documentInfo.value;
                });
            }

            for (var key in groups) {
                var currDocs = groups[key];

                // Sort chronologically and get the first doc
                retDocs.push(currDocs.sort(function(a, b){
                    var aDate = new Date(a.documentDate);
                    var bDate = new Date(b.documentDate);

                    if (aDate > bDate) {
                        return 1;
                    } else if (aDate < bDate) {
                        return -1;
                    } else {
                        return 0;
                    }
                })[0]);

            }
            return retDocs;
        },

        openDoc: function() {
            function openWindow () {
                window.open('amorphic/xhr?path=valora&file=true&eclipsePolicyDocs=true');
            }

            function logError (error) {
                console.log(error);
            }

            this.controller.publicSave().then(openWindow, logError);
        },

        /**
         * Callback when a selected document in Eclipse is being downloaded
         */
        onContentRequest: function (_request, response, _next, _file) { // SecReviewed Fail: Fixed
            if (!this.selectedDoc) { return; }
            var fileToDownload = this.selectedDoc.fileName;
            var documentId     = this.selectedDoc.docID;

            var downloadFile = function () {
                var stat;
                try {
                    stat = fs.statSync(fileToDownload);
                } catch (e) {
                    response.writeHead(404, {'Content-Type': 'text/plain'});
                    response.end('Not found');
                    return;
                }

                console.log('streaming ' + fileToDownload + ' length=' + stat.size);

                response.writeHead(200, {
                    'Content-Type':         'application/pdf',
                    'Content-Disposition':  'inline; filename=' + fileToDownload,
                    'Content-Length':       stat.size
                });

                var readStream = fs.createReadStream(fileToDownload);
                readStream.pipe(response);
                readStream.on('end', function () {
                    // Get rid of the file
                    setTimeout(function () {
                        fs.unlink(fileToDownload, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(fileToDownload + ' deleted');
                            }
                        });
                    }, 6000);
                });
            }.bind(this);

            this.controller.eclipseService.downloadDoc(fileToDownload, documentId).then(downloadFile, logError);

            function logError (error) {
                console.log('Eclipse download error ' + error);
            }
        },
        showApplication: {
            on: 'server',
            body: function(_request, response, _next, _file) {  // SecReviewed
                var docQuery = {
                    $and: [ { 'policyId': this.currentPolicy._id.toString() }, { 'name': 'AppPacket' } ]
                };

                var readData = function (policyDocs) {
                    // Get the base64 data from the policydoc's data, encode to whatever and stream the file
                    if (policyDocs.length < 1) {
                        response.writeHead(404, {'Content-Type': 'text/plain'});
                        response.end('Not found');
                        return Q(true);
                    }

                    var policyDoc   = policyDocs[0];
                    var fileName    = policyDoc.name;
                    var base64      = policyDoc.doc;

                    var decodedData = new Buffer(base64, 'base64');
                    var contentType = 'application/pdf';

                    response.writeHead(200, {
                        'Content-Type': contentType,
                        'Content-Disposition': 'inline; filename=' + fileName,
                        'Content-Length': decodedData.length
                    });

                    var bufferStream = new stream.PassThrough();
                    bufferStream.end(decodedData);
                    bufferStream.pipe(response);
                }.bind(this);

                return PolicyDoc.getFromPersistWithQuery(docQuery, null, null, null, true).then(readData);
            }
        },
        formatMessageDate: function(value) {
            var month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September','October', 'November', 'December'];
            value = value || this.value;
            if (!value) { return ''; }
            return month[value.getMonth()] + ' ' + value.getDate() + ', ' + value.getFullYear();
        },
        //----------------- END CORRESPONDENCE AND POLICY SECTION--------------------

        //copied from haven account center controller
        fireEvents: function () {
            if ( this.controller.customer.applicationPolicy != null ) {
                var policy = this.controller.customer.applicationPolicy;
            }

            if(policy.finalRateClass){
                var rateClassMap = {1:'UP', 2:'SP', 3:'ST', 4:'SP-Smoke', 5:'ST-Smoke'};
                this.controller.fireAnalyticsEvents('Rating', rateClassMap[policy.finalRateClass]);
            }

            if(policy.workflowState){
                this.controller.fireAnalyticsEvents('WorkflowStage', policy.workflowState + ' : ' + policy.workflowSubState);
            }

            //MVR/ID Fail
            //Pass
            //KnockOut
            //Decline
            var decisionType;
            if(policy.workflowSubState.match(/^Correcting/)){
                decisionType = 'MVR/ID Fail';
            }
            else if(policy.workflowState == 'Application Declined' || policy.workflowState == 'Application Rejected'){
                decisionType = 'Decline';
            }
            else if(policy.workflowState == 'Haven Application' && policy.workflowSubState == 'Waiting for Application Acceptance'){
                decisionType = 'KnockOut';
            }
            else if(policy.workflowState == 'TLIC Application' && policy.workflowSubState == 'Waiting for Acceptance'){
                decisionType = 'Pass';
            }

            if(decisionType){
                this.controller.fireAnalyticsEvents('DecisionType', decisionType);
            }
            this.controller.analyticsController.preSave();
        }
    });



    return {
        AccountCenterController: AccountCenterController
    };
};
