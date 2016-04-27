module.exports.valoraCustomer = function (_objectTemplate, getTemplate) {

    if (typeof(require) != 'undefined') {
        Q = require('q');  // Don't use var or js - optimization will force local scope
        _ = require('underscore');
    }

    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
    var Customer = getTemplate('./customer/Customer.js').Customer;
    var CustomerQuery = getTemplate('./customer/Customer.js').CustomerQuery;

    var ValoraCustomerSettings = getTemplate('./models/valoraCustomerSettings.js', {app: 'valora'}).ValoraCustomerSettings;
    var CashFlow = getTemplate('./needs/CashFlow.js').CashFlow;
    var CapitalNeeds = getTemplate('./needs/CapitalNeeds.js').CapitalNeeds;
    var Profile = getTemplate('./needs/CapitalNeeds.js').Profile;
    var Product = getTemplate('./static/product.js').Product;
    var Address = getTemplate('./customer/Person.js').Address;
    var Phone = getTemplate('./customer/Person.js').Phone;

    var ValoraPolicy = getTemplate('./models/valoraPolicy.js', {app: 'valora'}).ValoraPolicy;
    var ValoraPerson = getTemplate('./models/valoraPerson.js', {app: 'valora'}).ValoraPerson;
    var ValoraApplicant = getTemplate('./models/valoraApplicant.js', {app: 'valora'}).ValoraApplicant;

    var ValoraCustomer = Customer.extend('ValoraCustomer', {
        channel: {
            type: String,
            value: Assumptions.channels.Valora.code,
            toServer: false
        },
        language: {
            type: String,
            value: Assumptions.languages.en
        },
        profile: {
            type: Profile
        },
        capitalNeeds: {
            type: CapitalNeeds
        },
        monthlyBudget: {
            type: Number,
            value: 0
        },
        settings: {
            type: ValoraCustomerSettings,
            applicationOmit: true
        },
        applicationSectionIndex:{
            type: Number,
            value: 0
        },
        init: function() {
            Customer.call(this);
            this.channel    = Product.channels.Valora.code;
            // Overwrite default relationship status from common profile model
            this.profile.relationship = '';
        },
        clientInit: function() {
            Customer.prototype.clientInit.call(this);
            if (this.capitalNeeds) { this.capitalNeeds.clientInit(); }
            if (!this.settings) { this.settings = new ValoraCustomerSettings(); }
        },
        reset: function () {

            Customer.prototype.reset.call(this);

            this.profile        = new Profile(this);
            this.capitalNeeds   = new CapitalNeeds(this);
            this.settings       = new ValoraCustomerSettings(this);

            this.persons = [];
            this.addresses = [];
            this.phones = [];

            this.primaryCustomer = new ValoraApplicant('', null, '', this);
            this.alternateCustomer = new ValoraApplicant('', null, 32, this);
            this.alternateCustomer.addressSameAsPrimary = true;
        },
        resetSettings: function(){
            this.settings = new ValoraCustomerSettings(this);
        },
        compute: function() {
            Customer.prototype.compute.call(this);
            if (this.capitalNeeds) { this.capitalNeeds.compute(); }
        },
        createPolicy:{
            on: 'server', // SecReviewed
            body: function (selectedQuote) {
                if (this.applicationPolicy && this.applicationPolicy.isSubmitting()) {
                    throw 'Application in Progress - Cannot start a new one';
                }
                if (!this.applicationPolicy) {
                    this.applicationPolicy = new ValoraPolicy(this);
                    this.policies.push(this.applicationPolicy);
                }
                this.applicationPolicy.setQuote(JSON.parse(JSON.stringify(selectedQuote)));
            }
        },
        cancelAndCreateNewPolicy: {
            on: 'server',
            body: function () {
                if (this.applicationPolicy && this.applicationPolicy.wasCanceledDeclinedRejected()) {
                    console.log('Reapplying...');

                    // Clone the policy excluding workflow
                    var oldPolicy   = this.applicationPolicy;
                    var oldWorkflow = this.applicationPolicy.workflow;
                    this.applicationPolicy.workflow = null;
                    var newPolicy = this.applicationPolicy.createClonedPolicy();

                    // Start with insured and owner as different objects as that's how a new policy
                    // is setup
                    if (newPolicy.insuredType === newPolicy.ownerType) {

                        console.log('Creating new Owner VALORA person, address and phone ....');
                        newPolicy.ownerPerson                   = new ValoraPerson(this);
                        newPolicy.ownerPersonResidentialAddress = new Address(this);
                        newPolicy.ownerPersonPhone              = new Phone(this);
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
                    this.capitalNeeds.income[0].applicant       = this.primaryCustomer;

                    return Q(true);

                } else {
                    return Q(false);
                }
            }
        }
    });

    Profile.mixin({
        customer: {
            type: Customer
        }
    });

    CapitalNeeds.mixin({
        customer: {
            type: Customer
        }
    });

    CashFlow.mixin({
        customer: {
            type: Customer
        },
        capitalNeeds: {
            type: CapitalNeeds
        }
    });

    return {
        ValoraCustomer: ValoraCustomer,
        ValoraCustomerQuery: CustomerQuery
    };
};
