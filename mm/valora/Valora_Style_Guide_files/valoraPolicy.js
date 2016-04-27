module.exports.valoraPolicy = function (_objectTemplate, getTemplate) {

    var Policy = getTemplate('./customer/Policy.js').Policy;
    var Address = getTemplate('./customer/Person.js').Address;
    var Phone = getTemplate('./customer/Person.js').Phone;
    var Entity = getTemplate('./customer/Person.js').Entity;
    var PremiumBreakdown = getTemplate('./customer/Policy.js').PremiumBreakdown;
    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;

    var ValoraPerson = getTemplate('./models/valoraPerson.js', {app: 'valora'}).ValoraPerson;
    var ValoraApplicant = getTemplate('./models/valoraApplicant.js', {app: 'valora'}).ValoraApplicant;

    var ValoraPolicy = Policy.extend('ValoraPolicy', {
        init: function(customer) {
            Policy.call(this, customer);
            // For new style data modelling
            this.person = new ValoraPerson(customer);
            this.ownerPerson = new ValoraPerson(this.customer);
            this.premiumPayerPerson = new ValoraPerson(this.customer);
        },
        _newBeneficiary: function(type) {
            var beneficiary = Policy.prototype._newBeneficiary.call(this, type);
            beneficiary.person = new ValoraPerson(this.customer);
            return beneficiary;
        },
        getPremiumPayerPerson: {
            type: ValoraPerson,
            body: function () {
                return this.premiumPayer == 'insured' ? this.insured.person : this.ownerPerson;
            }
        },
        createClonedPolicy: {
            on: 'server',
            body: function () {

                // For each property we get to decide how to clone it by either returning
                // the target object or returning null which means a mindless clone is to be done
                // Anything linkned to customer needs to NOT clone customer but use the existing one

                return this.createCopy(function (obj, prop, template) {

                    if(!obj) {
                        return null;
                    }

                    switch (template.__name__) {
                        case 'Assumptions':
                            return Assumptions;
                        case 'Customer':
                            return [this.customer]; // Don't traverse
                        case 'HavenCustomer':
                            return [this.customer]; // Don't traverse
                        case 'Policy':
                            return null;
                        case 'ValoraCustomer':
                            return [this.customer]; // Don't traverse
                        case 'ValoraPolicy':
                            return null;

                    }
                    switch (obj.__template__.__name__ + '.' + prop) {

                        case 'Applicant.person':
                            return new ValoraPerson(this.customer);
                        case 'Applicant.address':
                            return new Address(this.customer);
                        case 'Applicant.phone':
                            return new Phone(this.customer);

                        case 'ValoraApplicant.person':
                            return new ValoraPerson(this.customer);
                        case 'ValoraApplicant.address':
                            return new Address(this.customer);
                        case 'ValoraApplicant.phone':
                            return new Phone(this.customer);

                        case 'Policy.underwriter':
                            return [this.underwriter];
                        case 'Policy.person':
                            return new ValoraPerson(this.customer);
                        case 'Policy.insured':
                            return new ValoraApplicant(this.customer);
                        case 'Policy.address':
                            return new Address(this.customer);
                        case 'Policy.phone':
                            return new Phone(this.customer, 'cell');
                        case 'Policy.ownerPerson':
                            return new ValoraPerson(this.customer);
                        case 'Policy.premiumPayerPerson':
                            return new ValoraPerson(this.customer);
                        case 'Policy.premiumPayerAddress':
                            return new Address(this.customer);
                        case 'Policy.premiumPayerPhone':
                            return new Phone(this.customer);
                        case 'Policy.doctorAddress':
                            return new Address(this.customer);
                        case 'Policy.ownerPersonPhone':
                            return new Phone(this.customer);
                        case 'Policy.ownerPersonResidentialAddress':
                            return new Address(this.customer);
                        case 'Policy.ownerPersonMailingAddress':
                            return new Address(this.customer);


                        case 'ValoraPolicy.underwriter':
                            return [this.underwriter];
                        case 'ValoraPolicy.person':
                            return new ValoraPerson(this.customer);
                        case 'ValoraPolicy.insured':
                            return new ValoraApplicant(this.customer);
                        case 'ValoraPolicy.address':
                            return new Address(this.customer);
                        case 'ValoraPolicy.phone':
                            return new Phone(this.customer, 'cell');
                        case 'ValoraPolicy.ownerPerson':
                            return new ValoraPerson(this.customer);
                        case 'ValoraPolicy.premiumPayerPerson':
                            return new ValoraPerson(this.customer);
                        case 'ValoraPolicy.premiumPayerAddress':
                            return new Address(this.customer);
                        case 'ValoraPolicy.premiumPayerPhone':
                            return new Phone(this.customer);
                        case 'ValoraPolicy.doctorAddress':
                            return new Address(this.customer);
                        case 'ValoraPolicy.ownerPersonPhone':
                            return new Phone(this.customer);
                        case 'ValoraPolicy.ownerPersonResidentialAddress':
                            return new Address(this.customer);
                        case 'ValoraPolicy.ownerPersonMailingAddress':
                            return new Address(this.customer);

                        case 'Beneficiary.entity':
                            return new Entity(this.customer);
                        case 'Entity.legalAddress':
                            return new Address(this.customer);
                        case 'Entity.mailingAddress':
                            return new Address(this.customer);
                        case 'Entity.phone':
                            return new Phone(this.customer);
                        case 'Beneficiary.person':
                            return new ValoraPerson(this.customer);
                        case 'Beneficiary.address':
                            return new Address(this.customer);
                        case 'Beneficiary.phone':
                            return new Phone(this.customer);

                        case 'Policy.tLICPremiumBreakdown':
                            return new PremiumBreakdown(null, null, null, obj);
                        case 'Policy.premiumBreakdown':
                            return new PremiumBreakdown(null, null, null, obj);

                        case 'ValoraPolicy.tLICPremiumBreakdown':
                            return new PremiumBreakdown(null, null, null, obj);
                        case 'ValoraPolicy.premiumBreakdown':
                            return new PremiumBreakdown(null, null, null, obj);
                    }
                    return null;    // normal create process
                }.bind(this));
            }
        }

    });

    return {
        ValoraPolicy: ValoraPolicy
    };
};
