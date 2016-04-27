module.exports.EclipsePolicyDoc = function (objectTemplate, _getTemplate) {

    var mappings = {
        'GRACE_LETTER':             'Warning: Policy in Grace Period',
        'LAPSE_LETTER':             'Cancellation notice' ,
        'NOT_TAKEN_LETTER':         'Policy not taken',
        'FREE_LOOK_CANCEL_LETTER':  'Free look canceled',
        'ACH_RETURN_LETTER':        'ACH Return notice',
        'ADDRESS_CHANGE_LETTER':    'Address Change notice'
    };

    var EclipsePolicyDoc = objectTemplate.create('EclipsePolicyDoc', {
        policyNumber: {
            type: String
        },
        docID: {
            type: String,
            toClient: false
        },
        docDate: {
            type: Date
        },
        docName: {
            type: String
        },
        docType: {
            type: String
        },
        fileName: {
            type:String
        },
        init: function (document) {
            this.policyNumber   = document.policyNumber;
            this.docID          = document.documentId;
            this.docDate        = new Date(document.documentDate);

            var docInfo         = document.documentInfo;
            if (docInfo) {
                this.docName = docInfo.name;
                this.docType = mappings[docInfo.value];
            } else {
                this.docName = 'Policy';
                this.docType = 'Policy Document';
            }

            this.fileName = this.docType + '_' + this.policyNumber + '.pdf';
        },
        clientInit: function () {},
        reset: function(){}
    });

    return {
        EclipsePolicyDoc : EclipsePolicyDoc
    };
};
