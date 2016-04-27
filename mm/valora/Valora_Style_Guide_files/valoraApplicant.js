module.exports.valoraApplicant = function (_objectTemplate, getTemplate) {

    var Applicant = getTemplate('./customer/Applicant.js').Applicant;

    var ValoraPerson = getTemplate('./models/valoraPerson.js', {app: 'valora'}).ValoraPerson;

    var ValoraApplicant = Applicant.extend('ValoraApplicant', {
        init: function(first, last, age, customer) {
            Applicant.call(this, first, last, age, customer);

            this.person = new ValoraPerson(customer);
            this.ownerPerson = new ValoraPerson(customer);
            this.premiumPayerPerson = new ValoraPerson(customer);
            this.healthClassNumber = null;
            this.smoker = null;
        }
    });

    return {
        ValoraApplicant: ValoraApplicant
    };
};
