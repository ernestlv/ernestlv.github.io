/*global StickySidebars */
module.exports.createAccountController = function (objectTemplate, getTemplate) {
    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;

    var CreateAccountController = objectTemplate.create('CreateAccountController', {

        created: {
            isLocal: true,
            type: Boolean,
            value: null
        },
        temporaryLanguage: {
            type: String,
            value: Assumptions.languages.en
        },
        email: {
            isLocal: true,
            type: String
        },

        emailTrigger: function () {
            // TODO: Add email validation criteria
            var validEmail = function () { return this.email.length > 1; }.bind(this);

            var errorMessage = 'Please enter your email address.';

            !validEmail()
                ? this.controller.setError(this.controller, 'email', errorMessage)
                : this.controller.clearError(this.controller, 'email');
        },
        password: {
            isLocal: true,
            type: String
        },
        passwordTrigger: function () {
            var validPassword = function () {
                return this.password.length >= 6 && this.password.length <= 30
                    && this.password.match(/[A-Za-z]/) && this.password.match(/[0-9]/);
            }.bind(this);

            var errorMessage = 'Please enter a valid password.';

            !validPassword()
                ? this.controller.setError(this.controller, 'password', errorMessage)
                : this.controller.clearError(this.controller, 'password');
        },
        init: function(controller) {
            this.controller = controller;
        },
        routeEntered: function () {
            var routeEntered = function () {
                this.initializeClientLibraries();
            }.bind(this);

            if(!this.controller.customer.selectedQuote) { this.controller.routeTo('home'); }
            else { setTimeout(routeEntered, 100); }

        },
        routeExited: function(){
            this.destroyClientLibraries();
        },
        destroyClientLibraries: function() {
            StickySidebars.destroy();
        },
        initializeClientLibraries: function () {
            StickySidebars.init();
        },
        assignLanguage: {
            on: 'server',
            body: function (language) {
                this.controller.customer.language = language;
            }
        },
        registerCreateAccount: function () {
            this.controller.isLoading = true;

            var registerAccount = function () {
                return this.controller.registerAccount(document.location.href);
            }.bind(this);

            var createPolicy = function  () {
                var policyProduct = this.controller.quoteResultsController.productType || 'Term';
                return this.controller.createPolicy(policyProduct);
            }.bind(this);

            var assignLanguage = function () {
                this.controller.fireAnalyticsEvents('PreferedLanguage', this.temporaryLanguage);
                this.controller.analyticsController.preSave();
                return this.assignLanguage(this.temporaryLanguage);
            }.bind(this);

            var updateCustomerProperties = function () {
                var gender = this.controller.customer.primaryCustomer.person.gender;
                this.controller.customer.primaryCustomer.gender = gender === '1' ? 'male' : 'female';
            }.bind(this);

            var routeToApplication = function () {
                return this.controller.routeToPrivate('application');
            }.bind(this);

            var handleError = function(error) {
                this.controller.isLoading = false;
                this.controller.setError(this, 'created', error.text);
                console.log(error);
            }.bind(this);

            this.controller.newPassword = this.password;
            this.controller.confirmPassword = this.password;

            this.controller.email = this.email;

            return registerAccount()
                .then(assignLanguage)
                .then(updateCustomerProperties)
                .then(createPolicy)
                .then(routeToApplication)
                .catch(handleError);
        }
    });

    return {
        CreateAccountController: CreateAccountController
    };
};
