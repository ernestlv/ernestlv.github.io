module.exports.analyticsController = function(objectTemplate, getTemplate) {

    if (typeof(require) != 'undefined') {
        Q = require('q');
        var MailChimpAPI = require('mailchimp').MailChimpAPI;
        var mailChimpAPIKey = objectTemplate.config.nconf.get('mailChimpAPIKey');
        var mailChimpAPI = new MailChimpAPI(mailChimpAPIKey, { version: '1.3', secure: false });
    }

    getTemplate('./customer/Analytics.js').AnalyticsEvent;
    var Dimension = getTemplate('./customer/Analytics.js').Dimension;
    var AnalyticsContainer = getTemplate('./customer/Analytics.js').AnalyticsContainer;
    var Visitor = getTemplate('./customer/Analytics.js').Visitor;
    var heartBeatInterval = 100;

    var AnalyticsController = objectTemplate.create('AnalyticsController', {
        visitorId:              {type: String},
        analyticsContainer:     {type: AnalyticsContainer},
        analyticsContainers:    {type: Array, of: AnalyticsContainer, value: []},
        nextContainerToSave:    {type: Number, value: 0},
        mouseX:                 {type: Number, value: 0},
        mouseY:                 {type: Number, value: 0},
        clickX:                 {type: Number, value: 0},
        clickY:                 {type: Number, value: 0},
        lastMouseX:             {type: Number, value: 0},
        lastMouseY:             {type: Number, value: 0},
        lastScrollTop:          {type: Number, value: 0},
        lastScrollTime:         {type: Number, value: 0},
        lastMouseTime:          {type: Number, value: 0},
        lastFocusTime:          {type: Number, value: 0},
        pendingDimension:       {type: Boolean, value: false},
        visitor:                {type: Visitor, isLocal: true},

        init: function(controller) {
            this.controller = controller;
        },

        clientInit: function (customDimensions, customMetrics, channel) {
            this.customDimensions = customDimensions;
            this.customMetrics = customMetrics;

            this.channel = channel;

            if (typeof(amorphic) != 'undefined') {
                // Record first referrer found in the session from any page we arrive on
                var sessionReferrer = amorphic.getCookie('sessionReferrer');
                if (!sessionReferrer) {
                    sessionReferrer = document.referrer;
                    amorphic.setCookie('sessionReferrer', (document.referrer || ' '), 1);
                }
                this.sessionReferrer = sessionReferrer;

                // Record the first occurrence of any referrer as the original referrer
                var originalReferrer = amorphic.getCookie('originalReferrer');
                if (!originalReferrer || this.originalReferrer == ' ') {
                    amorphic.setCookie('originalReferrer', sessionReferrer, 30); // 30 days
                    originalReferrer = sessionReferrer;
                }
                this.originalReferrer = originalReferrer;

                // Record the time of the first visit
                var timeOfFirstVisit = amorphic.getCookie('timeOfFirstVisit');
                var isFirstVisit = !timeOfFirstVisit;
                if (!timeOfFirstVisit) {
                    timeOfFirstVisit = (new Date()).getTime();
                    amorphic.setCookie('timeOfFirstVisit', timeOfFirstVisit, 999);
                }
            }

            // Clear any containers that may have already been saved
            this.nextContainerToSave = 0;
            this.analyticsContainers = [];

            this.timeOfFirstVisit = timeOfFirstVisit;

            this.visitorId = this.getVisitorId();
            this.visitor = new Visitor(this.visitorId, channel);

            this.createContainer();

            this.lastMouseTime = (new Date()).getTime();
            this.lastScrollTime = (new Date()).getTime();
            this.lastFocusTime = (new Date()).getTime();

            // Capture mouse moves
            if (typeof(window) != 'undefined') {
                $(window).mousemove(function( event ) {
                    this.mouseX = Math.floor(event.pageX);
                    this.mouseY = Math.floor(event.pageY);
                }.bind(this));

                // Capture mouse moves
                $(window).click(function( event ) {
                    this.clickX = Math.floor(event.pageX);
                    this.clickY = Math.floor(event.pageY);
                }.bind(this));

                $(window).focusin(function(event) {
                    if (event.target.tagName && event.target.tagName.toLowerCase() == 'input') {
                        setTimeout(function() {this.lastFocusTime = new Date();}.bind(this), 250);
                    }
                }.bind(this));

                // Establish heartbeat for mousemove and scroll position
                this.heartBeat = setInterval(function () {
                    this.eventHandler($(window).scrollTop(), $(window).height());
                }.bind(this), heartBeatInterval);
            }

            if (this.visitorId) { // Sometimes Google is slow with populating cookie
                this.inspectletEvent(['identify', this.controller.email || this.visitorId]);
                this.addCustomDimension('VisitorID', this.visitorId);
            }

            if (isFirstVisit) {
                // Set 'Not-set' on all the dimensions initially on first time visit
                this.setAllCustomDimensions('Not-set');
            }
        },
        shutdown: function () {
            if (this.heartBeat) { clearInterval(this.heartBeat); }
            this.heartBeat = null;
            $(window).unbind('mousemove');

        },
        getVisitorId: function () {
            if (typeof(amorphic) == 'undefined'){
                return 1;
            }
            var visitorId = _.last(amorphic.getCookie('_ga').split('.'), 2).join('.');
            return visitorId;
        },

        // Referrers as stored in cookies
        originalReferrer:   {type: String, value: ''},
        sessionReferrer:    {type: String, value: ''},
        timeOfFirstVisit:   {type: Number, value: 0},

        loginDate:              {type: Date},
        lastLoggedInWritten:    {type: Date},

        drip_HLACTIVE: {type: Boolean},
        drip_APPSTART: {type: Boolean},
        drip_APPSUBMIT: {type: Boolean},

        /**
         * For Marketing Drip campaign - Update mailchimp list member
         */
        dripUpdate: function(stage){
            if (stage === 'HLACTIVE') {
                if (this.drip_HLACTIVE === null) {
                    this.drip_HLACTIVE = true;
                }
            }
            else if (stage === 'APPLICATION') {
                //also update same MC field as HLACTIVE stage
                if (this.drip_HLACTIVE === null) {
                    this.drip_HLACTIVE = true;
                }
                if (this.drip_APPSTART === null) {
                    this.drip_APPSTART = true;
                }
            }
            else if (stage === 'APPSUBMIT') {
                if (this.drip_APPSUBMIT === null) {
                    this.drip_APPSUBMIT = true;
                }
            }
        },
        dripUpdateSave: function() {
            var email = this.controller.email || this.controller.homeController && this.controller.homeController.signupEmail;
            if (email && this.controller.homeController.subscribed) {
                var mergeVars = {};
                if (this.drip_HLACTIVE) {
                    mergeVars['HLACTIVE'] = 'TRUE';
                    this.drip_HLACTIVE = false;
                }
                if (this.drip_APPSTART) {
                    mergeVars['APPSTART'] = 'TRUE';
                    this.drip_APPSTART = false;
                }
                if (this.drip_APPSUBMIT) {
                    mergeVars['APPSUBMIT'] = 'TRUE';
                    this.drip_APPSUBMIT = false;
                }
                if (this.loginDate && this.lastLoggedInWritten !== this.loginDate) {
                    mergeVars['LASTLOGIN'] = this.controller.formatDate(this.loginDate);
                    this.lastLoggedInWritten = this.loginDate;
                }
                if (mergeVars['HLACTIVE'] || mergeVars['APPSTART'] || mergeVars['APPSUBMIT'] || mergeVars['LASTLOGIN']) {
                    console.log('dripUpdateOnServer ' + JSON.stringify(mergeVars));
                    return Q.ninvoke(mailChimpAPI, 'listUpdateMember', {
                        id: objectTemplate.config.nconf.get('mailChimpHavenList'),
                        email_address: email,
                        merge_vars: mergeVars
                    }).then(function (results) {
                        if (results.errors) {
                            console.log('Controller: error updating in mailchimp ' + results.errors);
                        }
                    }.bind(this), function (error) {
                        console.log('Controller: error updating in mailchimp ' + error.message + ' EMAIL: ' + email);
                    }.bind(this));
                }
            }
            return Q(true);
        },
        loginRegister: function () {
            this.inspectletEvent(['identify', this.controller.email]);
            var userID = this.controller.customer.__id__.replace(/.*-.*-/, '');
            this.ga('set', '&uid', userID); // here user id is set after the pageview hit
            this.addCustomDimension('UserID', userID);
            this.loginDate = new Date();
            this.controller.homeController.subscribed = true;

            //this.ga('create', __analytics_account, {userId: this.controller.customer.__id__.replace(/.*-.*-/, '')});
            //return this.controller.publicSave();
        },
        inspectletMap:  {isLocal: true, type: Object, value: {}},
        inspectletEvent: function (value, force) {
            var strValue = JSON.stringify(value);
            if (!force && this.inspectletMap[strValue]) { return; }
            this.inspectletMap[strValue] = true;
            if (typeof(__insp) != 'undefined') {
                console.log('inspectlet event ' + JSON.stringify(value));
                __insp.push(value);
            }
        },

        createSession: function(){
            //this.ga('send', 'pageview', {'sessionControl': 'start'});
        },

        /**
         * If any dimensions added be sure and update the current page
         * @returns {*}
         */
        preSave: function () {
            if (this.pendingDimension) {
                this.pendingDimension = false;
                this.addCustomEvent('Viewing', this.controller.router.currentRoute.getId());
            }
        },
        refreshVisitorIfStale: function (forceUpdate) {
            return Q(forceUpdate)
                .then(isVisitorStale.bind(this))
                .then(refreshVisitor.bind(this));

            function isVisitorStale () {
                return this.visitor ? this.visitor.isStale() : forceUpdate;
            }
            function refreshVisitor (isStale) {
                return isStale ? Visitor.getFromPersistWithQuery({visitorId: this.visitorId}) : true;
            }
        },
        save: function (txn, channel)
        {
          
            // Find the first visitor with that id
            return Q()
                .then(retrieveVisitor.bind(this))
                .then(processVisitor.bind(this))
                .then(this.dripUpdateSave.bind(this));

            function retrieveVisitor () {
                return this.visitor ? [this.visitor] : Visitor.getFromPersistWithQuery({visitorId: this.visitorId});
            }


            function processVisitor(visitors) {

                this.visitor = visitors.length > 0 ? visitors[0] : new Visitor(this.visitorId, channel);

                // Link it to the customer if we are logged in
                if (this.controller.loggedIn) {
                    this.controller.customer.setAnalytics(this.originalReferrer, this.sessionReferrer, this.timeOfFirstVisit, this.visitorId);
                    this.visitor.setCustomer(this.controller.customer);
                }

                // Update all dimensions
                _.each(this.dimensions, function(d) {
                    var dim = this.visitor.getDimension(d.name);

                    if (dim.value !== d.value) {
                        this.visitor.setDimension(d.name, d.value);
                        if(dim.setDirty) { dim.setDirty(); }
                    }
                }.bind(this));

                // Save any unsaved containers
                for (this.nextContainerToSave = this.nextContainerToSave; this.nextContainerToSave < this.analyticsContainers.length; ++this.nextContainerToSave) {
                    var container = this.analyticsContainers[this.nextContainerToSave];

                    if(container) {
                        container.ipAddress = objectTemplate.incomingIP;
                        container.setVisitor(this.visitor);
                        this.visitor.analyticsContainers.push(container);
                        container.setDirty(txn, true);
                    }
                }
                
                // Save the current container (but don't yet add it to visitor)
                if (this.analyticsContainer) {
                    if (!this.analyticsContainer.ipAddress) {
                        this.analyticsContainer.ipAddress = objectTemplate.incomingIP;
                        this.analyticsContainer.setVisitor(this.visitor);
                    }
                    this.analyticsContainer.setDirty(txn, true);
                }
                
                // Save the current container (but don't yet add it to visitor)
                if (this.analyticsContainer) {
                    if (!this.analyticsContainer.ipAddress) {
                        this.analyticsContainer.ipAddress = objectTemplate.incomingIP;
                        this.analyticsContainer.setVisitor(this.visitor);
                    }
                    this.analyticsContainer.setDirty(txn, true);
                }

                this.visitor.setDirty(txn, true);
            }
        },
        createContainer: function () {
            var userAgent = (typeof(navigator) != 'undefined') ?  navigator.userAgent : 'mocha';
            this.analyticsContainer = new AnalyticsContainer(this.visitor, userAgent, this.originalReferrer);
        },
        ga: function () {
            var stringifiedArguments = _.map(arguments, function(a){ return JSON.stringify(a); }).join(',');
            console.log('ga(' + stringifiedArguments +')');
            ga.apply(window, arguments);
        },
        getDimensionMetrics: function () {
            var results = {};
            if (this.dimensionHash) {
                _.each(this.dimensionHash, function (val, key) {
                    var customDim = this.customDimensions[key];
                    var customMet = this.customMetrics[key];
                    results[customDim ? 'dimension' + customDim : 'metric' + customMet ] = val.value;
                }.bind(this));
            }
            return results;
        },
        addDataChangeEvent: function (bindString, value) {
            this.addEvent({event: 'Set', propertyName: bindString, value: value,
                           startTime: new Date(this.lastFocusTime), endTime: new Date()});
        },
        addEvent: function (obj) {
            if (typeof(amorphic) == 'undefined' || amorphic.state == 'zombie') { return; }
            // If new page start a new container
            if (typeof(this.analyticsContainer.page) == 'string') {
                var page = this.controller.router.currentRoute.getId();
                if (page != this.analyticsContainer.page) {
                    // Clean up any containers that have been saved
                    this.analyticsContainers.push(this.analyticsContainer);
                    this.createContainer();
                    this.analyticsContainer.page = page;
                }
            }
            this.analyticsContainer.addEvent(obj);

            if (!this.visitorId) { // Sometimes Google is slow with populating cookie
                this.visitorId = this.getVisitorId();
                this.inspectletEvent(['identify', this.controller.email || this.visitorId]);
                this.addCustomDimension('VisitorID', this.visitorId);
            }
        },
        addCustomEvent: function (eventName, eventValue) {
            this.addEvent({event: 'Analytics', subEvent: 'Event', propertyName:eventName, value: eventValue});
            this.ga('send', 'event', eventName, 'fire', eventValue, 0, this.getDimensionMetrics());
            this.pendingDimension = false;
        },
        addVirtualPage: function (page) {

            if (typeof(__experiments) != 'undefined') { // Other pages don't have experiments
                // Set experiment variation
                _.each(__experiments, function (e) {
                    if (e.path == page) { __setVariation(e); }
                }.bind(this));
            }

            // If no page set yet goahead and add it
            if (typeof(this.analyticsContainer.page) != 'string') {
                this.analyticsContainer.page = page;
            }
            this.addEvent({event: 'Analytics', subEvent: 'Page View', value: page});
            this.ga('send', 'pageview', _.extend({page: page}, this.getDimensionMetrics()));
            this.pendingDimension = false;
            this.scrollDepth = 0;
            this.controller.registerActivity();
        },
        dimensions:             {type: Array, of: Dimension, value: []},
        dimensionHash:          {isLocal: true, type: Object, value: null},
        getDimension:   function(name) {
            var hash = this.getDimensionHash();
            var dim = hash[name];
            if (!dim) {
                dim = new Dimension();
                dim.name = name;
                hash[name] = dim;
                this.dimensions.push(dim);
            }
            return dim;
        },
        setDimension:   function(name, value) {
            this.getDimension(name).value = value;
        },
        getDimensionHash: function () {
            if (!this.dimensionHash) {
                this.dimensionHash = {};
                _.each(this.dimensions, function(d) {
                    this.dimensionHash[d.name] = d;
                }.bind(this));
            }
            return this.dimensionHash;
        },
        addCustomDimension: function (name, value) {
            var dimension = this.getDimension(name);
            if (dimension.value != value) {
                dimension.value = value;
                this.addEvent({event: 'Analytics', subEvent: 'Dimension', propertyName: name, value: value});
            }
            this.pendingDimension = true;
        },
        addCustomMetric: function (name, value) {
            var dimension = this.getDimension(name);
            if (dimension.value != value) {
                dimension.value = value;
                this.addEvent({event: 'Analytics', subEvent: 'Metric', propertyName: name, value: value});
            }
            this.pendingDimension = true;
        },
        addCustomData: function (name, value) {
            if (this.customDimensions[name]) {
                this.addCustomDimension(name, value);
            } else if (this.customMetrics[name]) {
                this.addCustomMetric(name, value);
            } else {
                console.log(name + ' is not a custom dimension or a custom metric');
            }

        },
        setAllCustomDimensions: function (value) {
            for(var name in this.customDimensions){
                // Exclude VisitorID and UserId
                if(!name.match(/VisitorID|UserID/)){
                    this.addCustomDimension(name, value);
                }
            }
        },
        eventHandler: function(scrollTop, height) {
            var depth = height ? Math.round(10 * scrollTop / height) : 0;
            var time = (new Date()).getTime();
            if (depth > this.analyticsContainer.scrollDepth) {
                this.analyticsContainer.scrollDepth = depth;
            }

            if (this.clickX || this.clickY) {
                this.analyticsContainer.mouseMoveHistory += (this.analyticsContainer.mouseMoveHistory.length ? ',' : '') +
                    '[' + (0 - this.clickX) + ',' + (0 - this.clickY) + ',' + (time - this.lastMouseTime) + ']';
                this.clickX = 0;
                this.clickY = 0;
                this.lastMouseTime = time;
            }

            else if (Math.floor(this.lastMouseX / 10) != Math.floor(this.mouseX / 10) ||
                Math.floor(this.lastMouseY / 10) != Math.floor(this.mouseY / 10)) {
                this.analyticsContainer.mouseMoveHistory += (this.analyticsContainer.mouseMoveHistory.length ? ',' : '') +
                    '[' + this.mouseX + ',' + this.mouseY + ',' + (time - this.lastMouseTime) + ']';
                this.lastMouseTime = time;
            }
            if (scrollTop != this.lastScrollTop) {
                this.analyticsContainer.scrollHistory += (this.analyticsContainer.scrollHistory.length ? ',' : '') +
                    '[' + scrollTop + ',' + (time - this.lastScrollTime) + ']';
                this.lastScrollTime = time;
            }

            this.lastMouseX = this.mouseX;
            this.lastMouseY = this.mouseY;
            this.lastScrollTop = scrollTop;
        }
    });

    return {
        AnalyticsController: AnalyticsController
    };
};
