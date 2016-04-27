module.exports.ApsOrder = function (objectTemplate, getTemplate) {

    var ApsOrder = objectTemplate.create("ApsOrder", {});

    ApsOrder.STATUSES = {new: 'new', pending: 'pending', complete: 'complete', canceled: 'canceled', noRecord: 'noRecord'};

    return {
        ApsOrder: ApsOrder
    };
};

module.exports.ApsOrder_mixins = function (objectTemplate, requires) {
    var ApsOrder = requires.ApsOrder.ApsOrder,
        Policy = requires.Policy.Policy;
    
    ApsOrder.mixin({
        orderId: {type: String, toServer: false},
        physician: {type: String},
        street: {type: String},
        city: {type: String},
        state: {type: String},
        zip: {type: String},
        speciality: {type: String},

        source: {type: String},
        sourceValues: {type: Array, isLocal: true, value: ['rx', 'app']},
        sourceDescriptions: {type: Object, isLocal: true, value: {rx: 'RX', app: 'Application"'}},

        status: {toServer: false, type: String},
        statusValues: {type: Array, isLocal: true, value: ['new', 'pending', 'complete', 'canceled', 'noRecord']},
        statusDescriptions: {
            type: Object,
            isLocal: true,
            value: {new: 'New', pending: 'Pending', complete: 'Complete', canceled: 'Canceled', noRecord: 'No Record'}
        },

        policy:     {type: Policy},

        init: function (physician, city, state, speciality, source) {
            this.physician = physician;
            this.city = city;
            this.state = state;
            this.speciality = speciality;
            this.source = source ? source.toUpperCase() : 'APP';
            this.status = ApsOrder.STATUSES.new;
        }
    });
};
