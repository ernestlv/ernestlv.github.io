module.exports.Analytics = function (objectTemplate, getTemplate) {

    getTemplate('./static/Assumptions.js').Assumptions;
    getTemplate('./Utils.js').Utils;

    // Non-Semotus modules
    if (typeof(require) != 'undefined') {
        _ = require('underscore');
    }

    // A universal analytics event with all possible properties

    var AnalyticsEvent = objectTemplate.create('AnalyticsEvent', {
        event:          {type: String, value: ''},
        subEvent:       {type: String, value: ''}, // Mainly for analytics events
        startTime:      {type: Date},
        endTime:        {type: Date},
        xPos:           {type: Number, value: 0},
        yPos:           {type: Number, value: 0},
        propertyName:   {type: String, value: ''},
        value:          {type: String, value: ''},
        /**
         * Constructor
         * @param properties to set that must match property definitions
         * @throws an exception if properties don't match
         */
        init: function (props) {
            var ourProps = AnalyticsEvent.getProperties();
            _.each(props, function (value, key) {
                if (ourProps[key]) {
                    this[key] = value;
                } else {
                    throw 'invalid data in AnalyticsEvent constructor';
                }
            }.bind(this));

            // Fill out the times and/or default
            if (!this.startTime && !this.endTime) { this.startTime = new Date(); }
            if (!this.endTime) { this.endTime = this.startTime; }
            if (!this.startTime) { this.startTime = this.endTime; }
        },
        getName: function () {
            return (this.event == 'Analytics') ? this.subEvent : this.event;
        },
        getDescription: function () {
            return this.propertyName ? this.propertyName + '=' + this.value : this.value;
        }
    });

    // A cluster of events logged at the same time.  The cluster is simply bracketed
    // for convenience of writing efficiently and keeping document sizes reasonable

    var AnalyticsContainer = objectTemplate.create('AnalyticsContainer',  {
        ipAddress:          {type: String},
        analyticsEvents:    {type: Array, of: AnalyticsEvent, value: []},
        userAgent:          {type: String},
        referrer:           {type: String},
        firstEventTime:     {type: Date},
        lastEventTime:      {type: Date},
        page:               {type: String},
        scrollDepth:        {type: Number},
        scrollHistory:      {type: String, value: ''},  // Comma separated number as pairs of scroll position and time offset
        mouseMoveHistory:   {type: String, value: ''},  // Comma separate numbers as triplets of x, y and time offset,

        setTimeByEvent: function(start, end) {
            if (!this.firstEventTime || (start.getTime() < this.firstEventTime.getTime())) {
                this.firstEventTime = start;
            }
            if (end && (end.getTime() > this.lastEventTime.getTime())) {
                this.lastEventTime = end;
            }
        },

        init: function (visitor, userAgent, referrer) {
            this.visitor = visitor;
            this.userAgent = userAgent;
            this.referrer = referrer;
            this.firstEventTime = new Date();
            this.lastEventTime = new Date();
        },
        addEvent: function (props) {
            var event = new AnalyticsEvent(props);
            this.analyticsEvents.push(event);
            this.setTimeByEvent(event.startTime, event.endTime);
            if (this.visitor)
                this.visitor.setTimeByEvent(event.startTime, event.endTime);
        },
        setVisitor: function (visitor) {
            this.visitor = visitor;
               this.analyticsEvents.forEach(function (event) {
                this.visitor.setTimeByEvent(event.startTime, event.endTime);
            }.bind(this));
        }
    });

    var Dimension = objectTemplate.create('Dimension', {
        name:       {type: String},
        value:      {type: String}
    });

    // A visitor which ties together based on the Google visitor id
    var Visitor = objectTemplate.create('Visitor', {
        visitorId:              {type: String},
        analyticsContainers:    {type: Array, of: AnalyticsContainer, value: []},
        firstEventTime:         {type: Date},
        lastEventTime:          {type: Date},
        dimensions:             {type: Array, of: Dimension, value: []},
        channel:                {type: String},

        setTimeByEvent: function(start, end) {
            if (start.getTime() < this.firstEventTime.getTime()) {
                this.firstEventTime = start;
             }
            if (end && start.getTime() > this.lastEventTime.getTime()) {
                this.lastEventTime = end;
            }
        },
        setCustomer: function(customer) {
            this.customer = customer;
        },
        init: function (visitorId, channel) {
            this.visitorId = visitorId;

            this.channel = channel;

            this.firstEventTime = new Date();
            this.lastEventTime = new Date();
        },
        getDimension:   function(name) {
            var dim  = _.find(this.dimensions, function (d) {return d.name == name});
            if (!dim) {
                dim = new Dimension();
                dim.name = name;
                this.dimensions.push(dim);
            }
            return dim;
        },
        setDimension:   function(name, value) {
            this.getDimension(name).value = value;
        },
    });
    Dimension.mixin({
        visitor: {type: Visitor}
    });
    AnalyticsContainer.mixin({
        visitor:            {type: Visitor}
    });
    AnalyticsEvent.mixin({
        analyticsContainer: {type: AnalyticsContainer}
    });
    return {
        AnalyticsEvent:     AnalyticsEvent,
        AnalyticsContainer: AnalyticsContainer,
        Visitor:            Visitor,
        Dimension:          Dimension
    };
};

module.exports.Analytics_mixins = function (_objectTemplate, _requires) {};
