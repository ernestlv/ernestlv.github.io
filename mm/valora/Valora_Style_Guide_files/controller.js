/*global amorphic videojs GlobalHeader SimpleScrollTrigger VideoElements LetteringAnimation*/
module.exports.controller = function (objectTemplate, getTemplate) {
    /*********
     * SEE HAVEN CONTROLLER EXPLANATION ON THIS FUNCTION
     */
    var Url;

    objectTemplate.enableOrphanHookups = true;
    if (!objectTemplate.objectMap) {
        console.log('Creating Fresh Object Map');
        objectTemplate.objectMap = {}; // Normalize objects even after they are persisted
    }

    if (typeof(require) != 'undefined') {
        objectTemplate.debugInfo = objectTemplate.config.nconf.get('customerDebugInfo') || 'none';
        Url = require('url');
    }
    /********************************************************************/
    var BaseController          = getTemplate('./baseController.js').BaseController;
    var HavenController         = getTemplate('./havenController.js').HavenController;

    var ValoraCustomer          = getTemplate('./models/valoraCustomer.js').ValoraCustomer;
    getTemplate('./docusign/Docusign.js', {client: false});
    getTemplate('./Admin.js', {client: false});

    var ApplicationController   = getTemplate('./applicationController.js').ApplicationController;
    var ApplicationProcessingController = getTemplate('./controllers/applicationProcessingController.js').ApplicationProcessingController;
    var ValoraAppController     = getTemplate('./controllers/valoraAppController.js').ValoraAppController;
    var AccountCenterController = getTemplate('./controllers/accountCenterController.js').AccountCenterController;
    var DifferenceController    = getTemplate('./controllers/differenceController.js').DifferenceController;
    var FaqsAnswersController   = getTemplate('./controllers/faqsAnswersController.js').FaqsAnswersController;
    var LearnController         = getTemplate('./controllers/learnController.js').LearnController;
    var ProductController       = getTemplate('./controllers/productController.js').ProductController;
    var QuoteController         = getTemplate('./controllers/quoteController.js').QuoteController;
    var QuoteResultsController  = getTemplate('./controllers/quoteResultsController.js').QuoteResultsController;
    var QuoteReturnController   = getTemplate('./controllers/quoteReturnController.js').QuoteReturnController;
    var CreateAccountController = getTemplate('./controllers/createAccountController.js').CreateAccountController;
    var Package                 = getTemplate('docusign/Form.js').Package;
    var Emailer                 = getTemplate('./services/emailer/emailer.js', {client: false}).Emailer;
    var Eclipse                 = getTemplate('./services/eclipse/Eclipse.js').Eclipse;
    var Assumptions             = getTemplate('static/Assumptions.js').Assumptions;
    var AnalyticsController     = getTemplate('./analyticsController.js').AnalyticsController;

    // Custom dimensions for Google Analytics
    var CustomDimensions = {
        'QuoteAge':1,
        'QuoteGender': 2,
        'QuoteState': 3,
        'QuoteFamilySituation': 4,
        'QuoteIncome': 5,
        'QuoteBudget': 6,
        'QuoteHealth': 7,
        'QuoteSmoker': 8,
        'QuoteCoverageAmount': 9,
        'QuoteTermLength': 10,
        'UserID': 11,
        'VisitorID': 12,
        'ApplicationPolicyType': 13,
        'QuestionsAnswered': 14,
        'ExitQuestion': 15,
        'DaysSinceFirstVisit': 16,
        'DecisionType': 17,
        'Rating': 18,
        'WorkflowStage': 19,
        'PreferedLanguage': 20
    };

    // Custom Metrics for Google Analytics
    var CustomMetrics = {};

    var Controller = HavenController.extend('Controller', {
        applicationController: {
            type: ApplicationController
        },
        applicationProcessingController: {
            type: ApplicationProcessingController
        },
        valoraAppController: {
            type: ValoraAppController
        },
        quoteController: {
            type: QuoteController
        },
        quoteResultsController: {
            type: QuoteResultsController
        },
        quoteReturnController: {
            type: QuoteReturnController
        },
        accountCenterController: {
            type: AccountCenterController
        },
        learnController: {
            type: LearnController
        },
        differenceController: {
            type: DifferenceController
        },
        productController: {
            type: ProductController
        },
        createAccountController: {
            type: CreateAccountController
        },
        faqsAnswersController: {
            type: FaqsAnswersController
        },
        analyticsController: {
            type: AnalyticsController
        },
        customer: {
            type: ValoraCustomer
        },
        homeController: {
            type: Object,
            value: {}
        },
        emailer: {
            isLocal: true,
            type: Emailer
        },
        eclipseService: {
            type: Eclipse
        },
        firstLogin: {
            type: Boolean,
            value: false
        },
        loggingOut: {
            type: Boolean,
            value: false
        },
        pageTitle: {
            type: String
        },
        bodyClass: {
            type: String
        },
        valoraStates: {
            type: Object,
            toServer: false
        },
        workflowRoutes: {
            type: Object,
            toServer: false
        },
        clientLibrariesReady: {
            type: Boolean,
            isLocal: true,
            value: false
        },
        isTestEnv: {
            type: Boolean,
            value: false,
            toServer: false
        },
        isLoading: {
            type: Boolean,
            value: false,
            toServer: false
        },
        temporaryLanguage: {
            type: String,
            value: Assumptions.languages.en
        },
        /* --------------- */
        /* Constants To Be Relocated To Common? */
        cscPhone: {
            type: String,
            value: '1-844-768-6774'
        },
        valoraPhone: {
            type: String,
            value: '1-855-220-2333'
        },
        /* --------------- */
        clientInit: function(sessionExpiration) {
            this.disableAmorphicFunctions();
            this.disableBindsterFunctions();
            this.havenControllerInitReplacement(sessionExpiration);
            if (!this.analyticsController) { this.analyticsController = new AnalyticsController(this); }
            this.attempt(this.analyticsController, 'clientInit')(CustomDimensions, CustomMetrics, 'Valora');
            this.initializeCustomer();
            this.initializeControllers([
                'applicationController',
                'applicationProcessingController',
                'valoraAppController',
                'quoteController',
                'quoteResultsController',
                'quoteReturnController',
                'accountCenterController',
                'learnController',
                'createAccountController',
                'differenceController',
                'productController',
                'faqsAnswersController'
            ]);

            this.initializeServices([
                { variableName : 'eclipseService', className: 'Eclipse', fileName: 'Eclipse'}
            ]);

            this.initializeRouter();
        },
        disableAmorphicFunctions: function () {
            //Disable Zombie Check
            amorphic._zombieCheck = function () { };
            //Disable Mousemove, Mouseclick, Window Focus -> WindowActivity
            amorphic._windowActivity = function () { };
        },
        disableBindsterFunctions: function () {
            //Disable Function if not Test Env
            if (!this.isTestEnv) {
                //Disable Alert Dialog and log to console
                bindster.alert = console.log;
            }
        },
        havenControllerInitReplacement: function(sessionExpiration) {
            //Copied From HavenController So We Can Move Resetting of sessionExpiration
            //Heavily Edited To Fix Chrome Logout Crash Bug
            BaseController.prototype.clientInit.call(this);
            // Manage automatic saving
            this.activity = true;
            this.pagesBeingTracked={};
            var refresh = this.refresh;
            this.refresh = function (_defer, hasChanges) {
                if (!this.optimizeRefresh || hasChanges) {
                    this.messageRefresh = true;
                    refresh.call(this);
                }
                this.optimizeRefresh = false;
            }.bind(this);

            this.heartBeatInterval = setInterval(function () {
                this.heartBeat();
            }.bind(this), 1000);

            if (sessionExpiration) { this.sessionExpiration = sessionExpiration; }
        },
        heartBeat: function () {
            if (this.activity && !this.pageSaved && amorphic.state == 'live') { this.savePage(); }
            this.activity = false;
        },
        serverInit: function() {
            this.setIsTestEnv();
            this.initializeEmailer();
            this.initializeWorkflowRoutes();
        },
        reset: function(){
            this.customer = new ValoraCustomer();
        },
        setIsTestEnv: function () {
            if (process.env.NODE_ENV === 'production') { return; }
            this.isTestEnv = true;
        },
        initializeCustomer: function() {
            if (this.customer) {
                this.customer.clientInit();
            } else {
                this.customer = new ValoraCustomer();
            }
        },
        initializeControllers: function(controllers) {
            var initializeController = function(controller) {
                var className, generator;
                if (controller === 'applicationController') {
                    generator = getTemplate('./applicationController.js').ApplicationController;
                } else {
                    className = controller[0].toUpperCase() + controller.slice(1);
                    generator = getTemplate('./controllers/' + controller + '.js')[className];
                }

                this[controller] = new generator(this);
            }.bind(this);

            _.each(controllers, initializeController);
        },

        initializeServices:  function(servicesParams) {
            var initializeService = function(serviceParam) {
                var variableName = serviceParam['variableName'],
                    fileName     = serviceParam['fileName'],
                    className    = serviceParam['className'],
                    generator = getTemplate('./services/' + fileName + '.js')[className];
                this[variableName] = new generator(this);
            }.bind(this);

            _.each(servicesParams, initializeService);
        },


        initializeQuoteController: function() {
            if (!this.quoteController) {
                this.quoteController = new QuoteController(this);
            }
        },
        initializeQuoteResultsController: function() {
            if (!this.quoteResultsController) {
                this.quoteResultsController = new QuoteResultsController(this);
            }
        },
        initializeQuoteReturnController: function() {
            if (!this.quoteReturnController) {
                this.quoteReturnController = new QuoteReturnController(this);
            }
        },
        initializeAccountCenterController: function() {
            if (!this.accountCenterController) {
                this.accountCenterController = new AccountCenterController(this);
            }
        },
        initializeCreateAccountController: function() {
            if (!this.createAccountController) {
                this.createAccountController = new CreateAccountController(this);
            }
        },
        initializeRouter: function() {
            if (typeof (AmorphicRouter) != 'undefined') {
                this.router = AmorphicRouter;
                this.router._parseURL = _parseURL;
                this.route = AmorphicRouter.route(this, havenRoutes, {
                    interval: 60000
                });
            }

            if (typeof(window) != 'undefined') {
                // Make sure we have a default route otherwise if the route is a dialog that gets eventually popped
                // you won't have anything to pop and will just crap
                this.router.currentRoute = this.router.routesById['public.default'];

                //if we are trying to go to the home page
                if (window.location.pathname === '/' && !window.location.hash) {
                    this.file = '';
                }
                //if we are trying to go to a static page
                else if (window.location.pathname.match(/html/) || (window.__nonrewritten_page_name && window.__nonrewritten_page_name.match(/html/))) {
                    this.file = '';
                }
            }

            this.router._checkURL();

            //OVERRIDE ROUTER PARSEURL TO PREVENT UNNECESSARY PARSING/DECODING
            //FIX FOR WINDOWS CHROME BUG
            function _parseURL (str, parsed) {
                parsed = parsed || { parameters: {} };
                var parts = str.split('?');
                parsed.path = parts[0].substr(0, 1) === '/' ? parts[0] : '/' + parts[0];
                //NO NEED TO PROCEED IF parts[1] IS EMPTY STRING
                if (parts[1]) {
                    var pairs = parts[1].split('&');
                    for (var ix = 0; ix < pairs.length; ++ix) {
                        var keyValue = pairs[ix].split('=');
                        parsed.parameters[keyValue[0]] = decodeURIComponent(keyValue.length > 1 ? keyValue[1] : '');
                    }
                }
                return parsed;
            }
        },
        initializeEmailer: function() {
            if (!this.emailer) {
                this.emailer = new Emailer(this);
            }
        },
        initializeWorkflowRoutes: function() {
            this.workflowRoutes = require('./routers/workflowRouter');
        },
        scrollSet: function(location, options) {
            var position;
            if (location === 'top') {
                position = '0px';
            } else {
                position = location;
            }

            $.scrollTo(position, options);
        },
        routeEntered: function() {
            this.clientLibrariesReady = false;

            var routeEntered = function() {
                this.initializeClientLibraries();
                this.isLoading = false;
            }.bind(this);

            setTimeout(routeEntered, 100);
        },
        routeExited: function() {
            this.teardownClientLibraries();
        },
        initializeClientLibraries: function() {
            SimpleScrollTrigger.init();
            VideoElements.init();
            LetteringAnimation.init();
            this.clientLibrariesReady = true;
        },
        teardownClientLibraries: function() {
            SimpleScrollTrigger.destroy();

            var oldPlayer = document.getElementById('valoraVideo');
            videojs(oldPlayer).dispose();
        },
        clearErrorMessages: function() {
            this.clearErrors();
            this.error = '';
        },
        pageInit: function (page) {
            HavenController.prototype.pageInit.call(this, page);
        },
        publicSave: function() {
            this.optimizeRefresh = true;
            this.analyticsController.preSave();
            if (this.customer) { return this.publicSyncSession(); }
        },
        publicSyncSession: {
            on: 'server',
            body: function () {}
        },
        customerRefresh: {
            on: 'server',
            body: function () {}
        },
        verifyEmail: function() {
            var verifyEmailFromCode = function() {
                return this.publicVerifyEmailFromCode();
            }.bind(this);

            var routeToPage = function() {
                var destination = this.customer.applicationPolicy ? 'accountCenter' : 'quoteReturn';
                this.routeToPrivate(destination);
                return Q();
            }.bind(this);

            var triggerConfirmationModal = function() {
                this.routeToModal('registrationConfirmation');
            }.bind(this);

            verifyEmailFromCode()
                .then(routeToPage)
                .then(triggerConfirmationModal)
                .catch(console.log);
        },
        validateServerCall: function (functionName) {
            if (functionName.match(/^public/)) { return true; }
            return this.securityContext ? true : false;
        },
        routeTo: function(route) {
            if (this.loggingOut) { return; }
            this.route.public[route]();
            this.scrollSet('top');
        },
        routeToPrivate: function(route) {
            if (this.loggingOut) { return; }
            this.route.private[route]();
            this.scrollSet('top');
        },
        routeToModal: function(route) {
            if (this.popup) { this.exitModal(); }
            this.route.public.dialog[route]();
        },
        routeToPrivateModal: function(route) {
            if (this.popup) { this.exitModal(); }
            this.route.private.dialog[route]();
        },
        exitModal: function() {
            var pushedRoutes = this.router.pushedRoutes;

            if (pushedRoutes.length > 0 && !pushedRoutes[pushedRoutes.length - 1]) {
                this.routeTo('home');
            } else {
                this.router.popRoute();
            }

            this.hidePopup();
            this.popup = null;
            this.clearErrorMessages();
            // Since our dialogs are loaded dynamically (using b:include),
            // special handling is needed when it is dismissed
            $(document.body).removeClass('modal-open');
        },
        bigEscape: function() {
            var handleKeyUp = function handleKeyUp (e) {
                $(document).off('keyup', handleKeyUp, true);
                if (e.keyCode == 27) { this.exitModal(); }
            }.bind(this);

            if ($._data(document, 'events').keyup == undefined) {
                $(document).on('keyup', handleKeyUp);
            }
        },
        //bindster callback
        onload: function(){
            $(document).ready(function(){
                //initialize client-libraries here?
            });
        },
        assignLanguage: {
            on: 'server',
            body: function (language) {
                this.customer.language = language;
            }
        },
        createAccount: function(action) {
            if (!controller.validate()) { return; }

            this.isLoading          = true;
            this.newPassword        = this.password;
            this.confirmPassword    = this.password;

            var setFirstLogin = function() {
                this.firstLogin = true;
                return Q(true);
            }.bind(this);

            var assignLanguage = function() {
                this.fireAnalyticsEvents('PreferedLanguage', this.temporaryLanguage);
                this.analyticsController.preSave();
                return this.assignLanguage(this.temporaryLanguage);
            }.bind(this);

            var routeToDestination = function () {
                this.exitModal();
                var routes = { 'save-quote': 'quoteReturn', 'application': 'application' };
                this.routeToPrivate(routes[action]);
                return Q(true);
            }.bind(this);

            var handleError = function(error) {
                var errorMessage;
                var messages = { 'email_registered': 'This email is already registered.' };

                if (error.code === 'email_registered') { errorMessage = messages[error.code]; }
                if (error.code !== 'email_registered') { errorMessage = error.text || ''; }

                this.isLoading = false;
                this.controller.error = errorMessage;
                return Q.reject(this.controller.error);
            }.bind(this);

            var cleanup = function () {
                this.clearPasswords();
                this.isLoading = false;
                return Q(this.controller.error);
            }.bind(this);

            return this.publicRegister(document.location.href)
                .then(assignLanguage)
                .then(routeToDestination, handleError)
                .then(setFirstLogin)
                .then(cleanup);
        },
        registerAccount: function (url) {
            return this.publicRegister(url);
        },
        clearPasswords: function () {
            this.newPassword     = '';
            this.confirmPassword = '';
            this.password        = '';
        },

        sendEmail: function (template, email, name, vars) {
            var params = _.reduce(vars, function (obj, elem) {
                obj[elem.name] = elem.content;
                return obj;
            }, {});

            var slugs = {
                'register_verify':      'notify-registration-welcome',
                'email_changed':        'notify-old-email-changed',
                'email_changed_verify': 'verify-email-changed',
                'password_reset':       'notify-password-reset',
                'password_changed':     'confirmation-password-changed', // Currently this email is not called to send
                'confirm_emailchange':  'confirmation-email-changed',
                'email_verify':         'notify-validation-code',
                'confirmation-language-changed': 'confirmation-language-changed'
            };

            this.emailer.sendEmail({
                slug:           slugs[template],
                channel:        'Valora',
                recipientEmail: email,
                recipientName:  name,
                confirmLink:    params.link,
                confirmPin:     params.verificationCode,
                resetLink:      params.link,
                languageName:   params.languageName
            });
        },
        displayUserEmail: function(){
            if (this.amorphicLoaded && this.loggedIn) {
                return this.customer.email;
            }
        },
        setQuoteButton: function(){
            var quoteButton = {
                //element: $('#quoteButton')[0],
                defaultText: 'GET A QUOTE',
                viewQuoteText: 'VIEW QUOTE',
                acctCenterText: 'ACCOUNT CENTER'
            };

            if (!this.customer){ //deploy
                return quoteButton.defaultText;
            }
            if (this.showQuoteButton()){
                return quoteButton.defaultText;
            }
            if (this.showResultQuoteButton()){
                return quoteButton.viewQuoteText;
            }
            if (this.showReturnQuoteButton()){
                return quoteButton.viewQuoteText;
            }
            if (this.showAccountCenterButton()){
                return quoteButton.acctCenterText;
            }
        },
        showQuoteButton: function() {
            return this.amorphicLoaded && !this.customer.selectedQuote;
        },
        showResultQuoteButton: function(){
            //quote submitted
            return this.amorphicLoaded && !!this.customer.selectedQuote && this.showLoginButton();
        },
        showReturnQuoteButton: function(){
            //quote saved & application not started
            return this.amorphicLoaded && !!this.customer.selectedQuote && this.showLogoutButton() && !this.customer.applicationPolicy;
        },
        showAccountCenterButton: function(){
            //application started or completed or policy in force
            return this.amorphicLoaded && !!this.customer.selectedQuote && this.showLogoutButton() && !!this.customer.applicationPolicy;
        },
        routeQuote: function() {
            if (this.showResultQuoteButton()){
                this.routeTo('quoteResults');
            } else if (this.showReturnQuoteButton()){
                this.routeToPrivate('quoteReturn');
            } else if (this.showAccountCenterButton()){
                this.routeToPrivate('accountCenter');
            } else {
                this.routeTo('quote');
            }
        },
        showLoginButton: function() {
            return this.amorphicLoaded && !this.loggedIn;
        },
        showLogoutButton: function() {
            return this.amorphicLoaded && this.loggedIn;
        },
        loginUser: function() {
            if (!controller.validate('loginUserForm')) { return; }

            this.isLoading = true;

            var initializeCustomer = function() {
                this.customer.clientInit();
                this.accountCenterController.currentPolicy = this.customer.applicationPolicy;
                return Q(true);
            }.bind(this);

            var clearPasswords = function() {
                this.clearPasswords();
            }.bind(this);

            var routeToDestination = function(success) {
                this.isLoading = false;
                if (!success) { return; }
                this.exitModal();
                this.routeToPrivate(this.loginDestinationRoute());
                return Q(true);
            }.bind(this);

            var handleError = function(error) {
                this.isLoading = false;
                this.controller.error = error.text || '';
                return Q(false);
            }.bind(this);

            var analytics = function(){
                // Create a new GA session as we don't want the
                // current session's values overwriting the existing userid's session
                this.analyticsController.createSession();
                this.analyticsController.loginRegister();
            }.bind(this);

            this.publicLoginUser()
                .then(initializeCustomer, handleError)
                .then(routeToDestination)
                .then(clearPasswords)
                .then(analytics);
        },
        loginDestinationRoute: function() {
            if (this.customer.applicationPolicy) { return 'accountCenter'; }
            return 'quoteReturn';
        },
        publicLoginUser: {
            on: 'server',
            body: function(loginType) {
                var login = function(type) {
                    var loginFunctions = {
                        'withNewEmail': this.publicLoginWithNewEmail.bind(this),
                        'fromToken': this.publicChangePasswordFromToken.bind(this),
                        'default': this.publicLogin.bind(this)
                    };

                    type = type || 'default';
                    return loginFunctions[type]();
                }.bind(this);

                var fetchCustomerProperties = function() {
                    return this.customer.fetch({
                        persons: true,
                        addresses: true,
                        phones: true,
                        policies: true,
                        primaryCustomer: true,
                        alternateCustomer: true,
                        profile: true,
                        capitalNeeds: true,
                        settings: true
                    });
                }.bind(this);

                var reassignApplicationPolicy = function(policy) {
                    if (policy._id === this.customer.applicationPolicyPersistor.id) {
                        this.customer.applicationPolicy = policy;
                    }
                }.bind(this);

                var allDataTrue = function(data) {
                    return _.every(data, _.identity);
                }.bind(this);

                var anyDataMissing = function() {
                    var dataToCheck = [
                        this.customer.capitalNeeds,
                        this.customer.primaryCustomer,
                        this.customer.alternateCustomer,
                        this.customer.profile
                    ];

                    return !allDataTrue(dataToCheck);
                }.bind(this);

                var handleCustomerProgress = function(customer) {
                    var dataToCheck = [
                        customer.applicationPolicy,
                        customer.progress < 13
                    ];
                    if (allDataTrue(dataToCheck) && customer.applicationPolicy.submittedAt) {
                        this.customer.progress = 13;
                    }
                }.bind(this);

                var guardAgainstDataCorruption = function() {
                    this.customer.policies.forEach(reassignApplicationPolicy);
                    if (anyDataMissing()) {
                        this.customer.reset();
                        handleCustomerProgress(this.customer);
                    }
                }.bind(this);

                return login(loginType)
                    .then(fetchCustomerProperties)
                    .then(guardAgainstDataCorruption);
            }
        },
        loginWithNewEmail: function () {

            var error = function (err) {
                this.error = err.text;
                this.email = currentEmail;
                this.password = '';
            }.bind(this);

            var verifyEmailChange = function () {
                if(!alreadyLoggedIn) {
                    this.customer.clientInit();
                    this.password = '';
                }

                // Change owner's email on all policies
                this.changeOwnerEmail();

                this.exitModal();
                this.routeToPrivateModal('emailChangeVerified');

            }.bind(this);

            var login = function () {
                return this.publicLoginUser('withNewEmail');
            }.bind(this);

            var currentEmail = this.email;
            var alreadyLoggedIn = this.loggedIn;

            this.email = this.newEmail;

            return Q()
                .then(login)
                .then(verifyEmailChange)
                .catch(error);
        },

        changeOwnerEmail: {
            on: 'server',
            body: function () {  // SecReviewed Pending. Fixed
                this.customer.policies.map(function (policy) {
                    policy.ownerPerson.email = this.customer.email;
                }.bind(this));
            }
        },
        logoutUser: function () {
            function routeToHome () {
                this.routeTo('home');
            }

            function expireController() {
                amorphic.expireController();
                this.refresh();
                this.loggingOut = false;
                this.isLoading = false;
            }

            function handleLogout() {
                if (this.applicationController) { this.applicationController.onLogout(); }
                return this.publicExpireSession();
            }

            this.isLoading = true;
            this.loggingOut = true;
            this.publicLogout()
                .then(handleLogout.bind(this))
                .then(expireController.bind(this))
                .then(routeToHome.bind(this));
        },
        publicExpireSession: {
            on: 'server',
            body: function () {
                objectTemplate.expireSession();
            }
        },

        sendPasswordResetEmail: function() {
            if (!this.validate('publicResetPasswordFields')) { return; }

            var successRedirect = function() {
                this.routeToModal('forgotPasswordInfo');
            }.bind(this);

            var displayError = function(error) {
                this.error = error.text;
            }.bind(this);

            this.publicResetPassword(document.location.href).then(successRedirect, displayError);
        },
        updateActiveNavLink: function() {
            var activeClass = 'global-header__section-item--active';
            $('.' + activeClass).removeClass(activeClass);

            GlobalHeader.highlightActiveSection();
        },
        routeGlobalNavOption: function(route){
            GlobalHeader.settings.$body.toggleClass('js-global-nav-is-open');
            this.routeTo(route);
        },
        toggleGobalNavMenu: function(){
            GlobalHeader.settings.$body.toggleClass('js-global-nav-is-open');
        },
        createPolicy: function (policyProduct) {

            var createPolicy = function () {
                var quote = policyProduct === Assumptions.productTypes.Term.code
                    ? this.customer.selectedQuote.policies[0]
                    : this.customer.selectedQuote.policies[1];

                return this.customer.createPolicy({policies: [quote]});

            }.bind(this);

            var initializeApplicationPolicy = function () {
                this.customer.applicationPolicy.clientInit();
                var productType     = Assumptions.productTypes[policyProduct].code;
                var productName     = 'Valora' + productType;

                if (!policyProduct) {
                    productName = Assumptions.products['ValoraTerm'].code;
                } else {
                    productName = Assumptions.products[productName].code;
                }

                this.customer.applicationPolicy.productType  = productType;
                this.customer.applicationPolicy.product      = productName;

                return this.customer.applicationPolicy ? Q(true) : Q(false);

            }.bind(this);

            return Q()
                .then(createPolicy)
                .then(initializeApplicationPolicy)
                .catch(console.log);
        },
        handleByRouteController: function(routeName, func, arg1, arg2) {
            var route       =   this.router.location.hash ?
                this.router.location.hash.slice(1) :
                this.router.location.pathname.split('.html')[0].slice(1);

            var controller  = route + 'Controller';

            if (route.match(routeName) && routeName === 'application') {
                this.valoraAppController[func](arg1, arg2);
            } else if (route.match(routeName)) {
                this[controller][func](arg1, arg2);
            }
        },
        fireAnalyticsEvents: function(bindString, value){
            if (bindString.match(/Password/i)) { value = '******'; }
            if (value instanceof Date) { value = this.formatDate(value); }

            // For Dimensions
            var propName;
            switch(bindString){
                case 'quoteController.customerAge':
                    propName = 'QuoteAge';
                    break;
                case 'customer.profile.familyStatus':
                    propName = 'QuoteFamilySituation';
                    break;
                case 'customer.capitalNeeds.earnedIncome[0].amount':
                    propName = 'QuoteIncome';
                    break;    
                case 'customer.primaryCustomer.smoker':
                    propName = 'QuoteSmoker';
                    break;    
                case 'quoteResultsController.quoteTermLength':
                    propName = 'QuoteTermLength';
                    break;
                case 'PreferedLanguage':
                    propName = 'PreferedLanguage';
                    break;
                case 'ApplicationPolicyType':
                    propName = 'ApplicationPolicyType';
                    break;
                case 'QuoteCoverageAmount':
                    propName = 'QuoteCoverageAmount';
                    break;
                case 'QuoteBudget':
                    propName = 'QuoteBudget';
                    break;
                case 'DecisionType':
                    propName = 'DecisionType';
                    break;
                case 'Rating':
                    propName = 'Rating';
                    break;
                case 'WorkflowStage':
                    propName = 'WorkflowStage';
                    break;
            }

            if(propName){
                this.analyticsController.addCustomData(propName, value);
            }

            this.analyticsController.addDataChangeEvent(bindString, value);
        },
        onprerender: function() {
            this.handleByRouteController('application', 'onprerender');
        },
        onrender: function() {
            this.handleByRouteController('application', 'onrender');
            this.setupPopoverHelp();

            if (this.messageRefresh) {
                this.messageRefresh = false;
            } else {
                this.registerActivity();
            }
        },
        onchange: function(bindString, value) {

            // Pulled from customer controller
            // Attempt to fix analytics

            HavenController.prototype.onchange.call(this);

            // Allow embedded controllers to perform specific handling
            if (this.router.location.hash && this.router.location.hash.match(/apply_form/)) {
                this.applicationController.onchange(bindString, value);
            }

            this.handleByRouteController('application', 'onchange', bindString, value);

            this.fireAnalyticsEvents(bindString, value);
        },
        shouldSaveCustomer: function(hasChanges) {
            return hasChanges && this.customer && this.loggedIn;
        },
        preServerCall: function(_hasChanges, _changes, _context, forceUpdate) {
            objectTemplate.begin();

            return Q()
                .then(refreshAnalytics.bind(this))
                .then(isCustomerStale.bind(this))
                .then(refreshCustomer.bind(this));

            function refreshAnalytics () {
                return this.analyticsController ? this.analyticsController.refreshVisitorIfStale(forceUpdate) : true;
            }

            function isCustomerStale () {
                return this.loggedIn ? (forceUpdate ? true : this.customer.isStale()) : false;
            }

            function refreshCustomer (isStale) {
                return isStale ? refresh.call(this) : true;
            }

            function refresh() {
                return ValoraCustomer.getFromPersistWithId(this.customer._id, {
                    applicationPolicy: true,
                    primaryCustomer: true,
                    alternateCustomer: true
                });
            }
        },
        postServerCall: function() {
            return Q()
                .then(this.getValoraStates.bind(this))
                .then(saveAnalytics.bind(this))
                .then(endTransaction.bind(this))
                .then(removeTransientReference.bind(this))
                .then(simulateSyncError.bind(this));


            function saveAnalytics() {
                return this.customer ? this.analyticsController.save(objectTemplate.currentTransaction, 'Valora') : false;
            }

            function endTransaction () {
                if (this.loggedIn) { this.customer.cascadeSave(); }
                return objectTemplate.end();
            }

            function removeTransientReference() {
                //To Be Reviewed - Customer App
                if (this.customer && this.customer.applicationPolicy  && this.customer.applicationPolicy.workflow) {
                    this.customer.applicationPolicy.workflow = undefined;
                    this.customer.applicationPolicy.workflowPersistor = null;
                }
            }

            function simulateSyncError () {
                if (!objectTemplate.reqSession.syncError) {
                    objectTemplate.reqSession.syncError = 0;
                }
                var syncError = fs.readFileSync('sync.txt') * 1;
                if ((objectTemplate.reqSession.syncError % syncError) == 0) {
                    Q.delay(250).then(function() {
                        this.analyticsController.lastMouseX = 666;
                        console.log('Simulated Sync Error ' + objectTemplate.reqSession.syncError + '' + objectTemplate.reqSession.syncError % syncError);
                    }.bind(this));
                }
                objectTemplate.reqSession.syncError++;
            }
        },
        isProductSoldIn: function (state) {
            return state === 'TX';
        },
        validateServerIncomingObject: function (obj) {
            //copied wholesale from Customer app
            if (typeof(require) != 'undefined') {

                if (obj.__template__.__name__ === 'ValoraPolicy'){
                    if (obj.workflowState) {
                        throw 'Cannot modify ValoraPolicy';
                    }
                }
                // Objects like PremiumBreakdown should not be allowed to be modified.
                else if(obj.__template__.__name__ !== 'Controller' && obj.policy){

                    this.validateServerIncomingObject(obj.policy);
                }
                // Objects like FamilyHistory should not be allowed to be modified
                else if(obj.__template__.__name__ !== 'Controller' && obj.__template__.__name__ !== 'Visitor' && obj.customer){

                    // Get the inflight application policy and check it's state
                    var applicationPolicy = obj.customer.applicationPolicy;
                    if(applicationPolicy) {
                        this.validateServerIncomingObject(applicationPolicy);
                    }
                }
            }
        },
        onContentRequest: function(request, response, next) {
            var query = Url.parse(request.url, true).query;
            if (query.eclipsePolicyDocs) {
                this.accountCenterController.onContentRequest(request, response, next, query.file);
            }
            else if(query.viewapplication){
                this.accountCenterController.showApplication(request, response, next, query.file);
            }
            else {
                next();
            }
        },
        getValoraStates: {
            on: 'server',
            body: function() {
                if (!this.valoraStates) {
                    var valoraStates = {};

                    var enableState = function(package) {
                        if (package.state && package.inProduction) {
                            valoraStates[package.state] = true;
                        }
                    }.bind(this);

                    var enableStates = function(packages) {
                        _.each(packages, enableState);
                        this.valoraStates = valoraStates;
                        return Q(true);
                    }.bind(this);

                    return Package.getFromPersistWithQuery().then(enableStates);
                }
                return Q(true);
            }
        },

        /**
         * Function called when this page loads. Initialize all popup help links that can be
         * launched on this page.
         */
        setupPopoverHelp: function(){
            // Short circuit if no pop over class is found
            if( $('.popover-inner').length === 0 ){ return; }

            var popupsDesktop = $('.popover-help-desktop');
            $(popupsDesktop).each(function() {
                $(this).popover({
                    container: 'body',
                    content: $(this).parent().find('.popover-inner').html(),
                    html: true,
                    placement: 'auto top',
                    template: self.controller.getPopOverTemplate(),
                    trigger: 'hover focus'
                });
            });

            var popupsMobile = $('.popover-help-mobile');
            $(popupsMobile).each(function() {
                $(this).popover({
                    container: 'body',
                    content: $(this).parent().find('.popover-inner').html(),
                    html: true,
                    placement: 'auto top',
                    template: self.controller.getPopOverTemplateWithClose(),
                    trigger: 'click'
                });
            });

            $('body').on('click', function (e) {
                $('.popover-help-mobile').each(function () {
                    //the 'is' for buttons that trigger popups
                    //the 'has' for icons within a button that triggers a popup
                    if($(this).is(':visible')) {
                        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 &&
                            $('.popover-help-mobile').has(e.target).length === 0) {
                            $(this).popover('hide');
                        }
                    }
                });
            });
        },

        getCurrentProductDisplayName: function(){
            return Assumptions.products[this.customer.applicationPolicy.product].name;
        },

        getPopOverTemplate: function(){
            return '<div class=\'popover\' style=\'font-size: .7em;\' role=\'tooltip\'>' +
                '<div class=\'arrow\'></div>' +
                '<h3 class=\'popover-title\'></h3>' +
                '<div class=\'popover-content\'></div>' +
                '</div>';
        },


        getPopOverTemplateWithClose: function(){
            return '<div class=\'popover\' role=\'tooltip\'>' +
                '<div class=\'arrow\'></div>' +
                '<h3 class=\'popover-title\'></h3>' +
                '<div class=\'modal-header\'> <button type=\'button\' class=\'close popover-close\' style=\'margin-top: -10px\'><span aria-hidden=\'true\'></span><span class=\'sr-only\'>Close</span></button></div>' +
                '<div class=\'popover-content\'></div>' +
                '</div>';
        },

        shutdown: function () { 
            console.log('shutting down valora controller');
            if (this.analyticsController) { this.analyticsController.shutdown(); }
            HavenController.prototype.shutdown.call(this);
        },

        /*
            Safe invokes a given function by wraping it in a try/catch. 
            Useful in some contexts like analytic functions in unit tests.
            params:
            obj: context object
            p: invoking function ( must be a member of obj )
            fnFail: error handler function
            example:
            attempt(controller, 'clientInit')
            attempt(controller, 'clientInit', function(e){ ... })
        */
        attempt: function (obj, p, fnFail){
            var fn = function(){};
            if (obj && typeof obj[p] === 'function'){
                fn = function(){
                    try {
                        return this[p].apply(this, [].slice.apply(arguments));
                    }catch(e){
                        return typeof fnFail === 'function' ? fnFail(e, p, obj) : console.error('attempt fail:', this['__id__'] || '', p, e);
                    }
                }.bind(obj);
            }else{
                console.log('attempt warning not a function:', p);
            }
            return fn;
        }

    });

    //Mixin link back to main controller in each sub controller
    function mixinControllerBackLink(subController) {
        subController.mixin({
            controller: {
                type: Controller
            }
        });
    }

    var subControllers = [
        ApplicationController,
        ApplicationProcessingController,
        ValoraAppController,
        QuoteController,
        QuoteResultsController,
        QuoteReturnController,
        AccountCenterController,
        LearnController,
        CreateAccountController,
        DifferenceController,
        ProductController,
        FaqsAnswersController
    ];

    _.each(subControllers, mixinControllerBackLink);


    Eclipse.mixin({
        controller: {
            type: Controller
        }
    });

    AnalyticsController.mixin({
        controller: {
            type: Controller
        }
    });

    return {
        Controller: Controller
    };
};
