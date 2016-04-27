module.exports.Admin = function (objectTemplate, _getTemplate) {
    var Admin = objectTemplate.create('Admin', {
        firstName:  {type: String, value: '', length: 40, rule: ['name', 'required']},
        lastName:	{type: String, value: '', length: 40, rule: ['name']},
        email:			 {type: String, value: '', length: 50, rule: ['text', 'email', 'required']},
        passwordHash:	 {toClient: false, toServer: false, type: String, value: ''},
        passwordSalt:	 {toClient: false, toServer: false, type: String, value: ''},
        channels: {
            type: String,
            value: '',
            toServer: false
        },
        getFullName: function () {return this.firstName + ' ' + this.lastName; },
        passwordValidation: function (password) {
            /*
             Contain at least two (2) of the following four (4) classes:
             • English upper case letters (e.g., A, B, C)
             • English lower case letters (e.g., a, b, c)
             • Numbers (e.g., 0, 1, 2)
             • Non-alphanumeric or “special characters” (e.g., ?,!,%,$,#)
             */
            var count = 0;
            if (this.role == 'sadmin') {
                /*
                 Privileged account (resource administrator) passwords must consist of a minimum of ten (10)
                 characters and at least three (3) of the previous four (4) classes.
                 */
                count += password.replace(/[^A-Z]/g, '').length;
                count += password.replace(/[^a-z]/g, '').length;
                count += password.replace(/[^0-9]/g, '').length;
                count += password.replace(/[^?!%$#]/g, '').length;
                if (password.length < 10 || password.length > 30 || count < 3) {
                    throw {code: 'password_composition',
                        text: 'Password must be 10-30 characters with 3 occurrences of upper-case, lower-case, numbers and/or special characters ?,!,%,$,#'};
                }
            } else {
                /*
                 Contain at least two (2) of the following four (4) classes:
                 • English upper case letters (e.g., A, B, C)
                 • English lower case letters (e.g., a, b, c)
                 • Numbers (e.g., 0, 1, 2)
                 • Non-alphanumeric or “special characters” (e.g., ?,!,%,$,#)
                 */
                count += password.replace(/[^A-Z]/g, '').length;
                count += password.replace(/[^a-z]/g, '').length;
                count += password.replace(/[^0-9]/g, '').length;
                count += password.replace(/[^?!%$#]/g, '').length;
                if (password.length < 6 || password.length > 30 || count < 2) {
                    throw {code: 'password_composition',
                        text: 'Password must be 6-30 characters with 2 occurrences of upper-case, lower-case, numbers and/or special characters ?,!,%,$,#'};
                }
            }

        },
        roleValues:             {isLocal: true, type: Object, value: {
            'agent': 'Agent',
            'underwriter': 'Underwriter',
            'management': 'Management',
            'auditor': 'Auditor',
            'support': 'Support Team',
            'sadmin': 'Security Admin',
            'valoraSupport': 'Valora Support Team'
        }}
    });

    return {
        Admin: Admin
    };
};
