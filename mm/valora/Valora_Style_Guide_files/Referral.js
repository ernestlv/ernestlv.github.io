module.exports.Referral = function (objectTemplate, getTemplate) {
    var Person = getTemplate('./customer/Person.js').Person,
        Utils = getTemplate('./Utils.js').Utils;

    var Referral = objectTemplate.create('Referral', {

        referralId: { toClient: false, type: String, value: '', rule: ['text', 'required'] },
        referrer:   { toClient: false, type: String, value: '', rule: ['text', 'required'] },
        postBody:   { toClient: false, type: Object, rule: ['required'] },

        init: function(referralId, referrer, postBody) {
            this.referralId = referralId;
            this.referrer = referrer;
            this.postBody = postBody;
        }
    });

    return {
        Referral: Referral
    };
};