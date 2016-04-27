module.exports.havenController = function (objectTemplate, getTemplate) {

    // Include model
    var BaseController = getTemplate('./baseController.js').BaseController;
    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
    var Utils;

    // Non-Semotus modules
    if (typeof(require) != 'undefined') {
        Q = require('q');  // Don't use var or js - optimization will force local scope
        _ = require('underscore');
        QHTTP = require('q-io/http');
        Utils = getTemplate('./Utils.js').Utils;
        var testMode = (objectTemplate.config.nconf.get('environment ') != 'production') ? objectTemplate.config.nconf.get('test') || '' : '';
    }

    // Base controller for Haven apps. The controller
    // 1. Sets up the router
    // 2. Setups functions show/hide popups
    // 3. Sets a heartbeat on the app
    var HavenController = BaseController.extend('HavenController', {
        // Global properties
        heartBeatInterval: {isLocal: true},
        shutdownInProgress: {isLocal: true, type: Boolean, value: false},
        activity:          {isLocal: true, type: Boolean, value: true},
        pageSaved:         {isLocal: true, type: Boolean, value: true},
        sessionExpiration: {isLocal: true, type: Number, value: 0},
        pendingPage:       {isLocal: true, type: String, value: null},
        waitCount:         {isLocal: true, type: Number, value: 0}, // seconds waiting for a pending call to complete
        pagesBeingTracked: {isLocal: true, type: Object},
        amorphicStatus:    {isLocal: true, type: String, value: ''},
        doGetStarted:      {isLocal: true, value: false},
        currentFAQ:        {isLocal: true, type: String, value: ''},
        currentResource:   {isLocal: true, type: String, value: ''},

        page: {type: String, value: ''},          // The current page (path with "." as delimiter, e.g. "public.selectquote"
        file: {type: String, value: ''},          // HTML file to load
        popup:             {isLocal:true, type: String, value: ''},          // HTML file to load
        popupDialogId:     {isLocal:true, type: String, value: ''},          // DIV id of the dialog
        error: {type: String},                    // Non-field specific error condition
        status: {type: String},                   // Information status (e.g. saved at at ...)
        amorphicLoaded:     {isLocal: true, type: Boolean, value: true},
        isWaiting: {isLocal: true, type: Boolean, value: false}, 
        isProductSoldIn: function(){
            return false;
        },
        clientInit: function (sessionExpiration) {

            BaseController.prototype.clientInit.call(this);

            if (typeof(bindster) != 'undefined') {
                bindster.alert = function(message) {
                    console.log(message);
                    this.publicServerLog(message);
                }.bind(this);
            }
            if (typeof (AmorphicRouter) != 'undefined') {
                this.router = AmorphicRouter;
                this.route = AmorphicRouter.route(this, havenRoutes);
            }

             // Manage automatic saving
            if (sessionExpiration) { this.sessionExpiration = sessionExpiration; }
            this.activity = true;
            if (this.heartBeatInterval) { clearInterval(this.heartBeatInterval); }
            this.heartBeatInterval = setInterval(function () {
                this.heartBeat();
            }.bind(this), 1000);

            this.pagesBeingTracked={};

            // If refresh called explicity we don't count this as a render for saving page
            // Todo: Implement isDirty on RemoteObjectTemplate to deal with saving
            var refresh = this.refresh;
            this.refresh = function (_defer, hasChanges) {
                if (!this.optimizeRefresh || hasChanges) {
                    this.messageRefresh = true;
                    refresh.call(this);
                }
                this.optimizeRefresh = false;
            }.bind(this);


            var nonProductionEnvironment = typeof(document) != 'undefined' && document.location.hostname.match(/^xyzzy|^localhost|^stage/);
            if (nonProductionEnvironment) { this.doGetStarted = true; }
        },

        publicServerLog: {on: 'server', body: function(message) {
            var t = new Date();
            var time = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate() + ' ' +
                t.toTimeString().replace(/ .*/, '') + ':' + t.getMilliseconds();
            var msg = (time + '(' + objectTemplate.currentSession + ') ' + ' Browser: ' + message);
            console.log(msg);
        }},

        /**
         * Called if an error thrown on server call that is not handled
         */
        handleRemoteError: function (error) {
            this.controller.isWaiting = false;
            this.error = this.getErrorMessage(error);
        },

        /**
         * Setup the controller to display a given file
         * @param page
         * @param file
         */
        pageInit: function (page) {
            this.password = '';
            this.newPassword = '';
            this.confirmPassword = '';
            this.error = '';

            this.scrollTo = page;
        },

        onrender: function(_name) {
            if(this.scrollTo && !this.router.getRoute().__nested){
                $.scrollTo('0px');
            }
            this.scrollTo = null;
            if (this.messageRefresh) {
                this.messageRefresh = false;
            } else {
                this.registerActivity();
            }
        },
        registerActivity: function () {
            this.activity = true;
            this.pageSaved = false;
        },

        showPopup: function(){
            if(this.popup){

                this.popupDialogId = '#' + 'modalDialog';
                $(this.popupDialogId).modal({
                    show: true,
                    backdrop: 'static',
                    keyboard: false
                });

                // TODO: Enable popups to be closed using ESC or clicking outside
                // of the dialog
                /*$(this.popupDialogId).on('hidden.bs.modal', function (e) {
                 $(this.popupDialogId).off('hidden.bs.modal');
                 this.router.popRoute();
                 this.popup = this.popupDialogId = null;
                 }.bind(this));*/
            }
        },

        hidePopup: function(){
            if(this.popup){
                $(this.popupDialogId).modal('hide');
            }
        },

        isPage: function (name) {
            return this.page == name;
        },

        log: function (level, text) {
            (this.__template__.objectTemplate || RemoteObjectTemplate).log(level, text);
        },

        getDisplayTime: function () {
            var date = new Date();
            return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' ' +
                date.toTimeString().replace(/ .*/, '');
        },

        /**
         * Security check on remote calls is execute from semotus before executing a call on the server
         *
         * @param functionName
         * @returns {Boolean} - whether to proceed with call
         */
        validateServerCall: function (functionName) {
            if (functionName.match(/^public/)) { return true; }
            return this.securityContext ? true : false;
        },

        shutdown: function () {
            if (this.heartBeatInterval) { clearInterval(this.heartBeatInterval); }
            if (this.accountCenterController) { this.accountCenterController.shutdown(); }
        },

        heartBeat: function () {
            if (this.activity && !this.pageSaved && amorphic.state == 'live') { this.savePage(); }
            this.activity = false;

            var trackerName;

            if (this.heartBeat.videoStartTime > 0 && !this.heartBeat.sentTenSecondEvent && (((new Date()).getTime() - this.heartBeat.videoStartTime) > 100)) {
                this.heartBeat.sentTenSecondEvent = true;
                //ga('send', 'event', 'VideoClick', 'clickthrough', 'pointonesecond')
                trackerName = ga.getAll()[0].get('name');
                ga(trackerName + '.send', 'event', { eventCategory: 'Homepage', eventAction: 'Engagement', eventLabel: 'Video begins'});
            }


            if (this.heartBeat.videoStartTime > 0 && !this.heartBeat.sentFortyFiveSecondEvent && (((new Date()).getTime() - this.heartBeat.videoStartTime) > 50000)) {
                this.heartBeat.sentFortyFiveSecondEvent = true;

                trackerName = ga.getAll()[0].get('name');
                ga(trackerName + '.send', 'event', { eventCategory: 'Homepage', eventAction: 'Engagement', eventLabel: '50 Seconds'});

            }
        },

        /**
         * Callback from bindster whenever a control's value changes.
         * Use this to check if a page has been updated if it is being
         * tracked
         */
        onchange: function(){
            if(typeof this.pagesBeingTracked[this.page] !== 'undefined') {
                this.pagesBeingTracked[this.page] = true;
            }
        },

        trackPageChanges: function(){
            this.pagesBeingTracked[this.page] = false;
        },

        untrackPageChanges: function(){
            delete this.pagesBeingTracked[this.page];
        },

        /**
         * Attempt to save the page if we have seen a render.  For the time being we try
         * not to do a save while a server call is outstanding
         * TODO: Fix amorphic to serialize calls and manage online/offline state in cooperation with controller
         */
        savePage: function() {
            if (this.shutdownInProgress) { return; }

            this.waitCount = 0;
            this.publicSave();
            this.pageSaved = true;
            return;
        },
        /*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!NEEDS TO BE ENABLED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
        /**
         * Security check on remote calls is execute from semotus before executing a call on the server
         *
         * @param functionName
         * @returns {Boolean} - whether to proceed with call
        validateServerCall: function (functionName) {
            if (functionName.match(/^public/))
                return true;
            return this.securityContext ? true : false;
        }
         */
        addCustomerMetric: function (metric) {
            for(var ix = 0; ix < this.customerMetric.length; ++ix) {
                if (this.customerMetric[ix].key == metric.key) {
                    this.customerMetric[ix].slot = metric.slot;
                    this.customerMetric[ix].ranges = metric.ranges;
                    return;
                }
            }
            this.customerMetric.push(metric);
        },
        getCustomerMetric: function (metric) {
            for(var ix = 0; ix < this.customerMetric.length; ++ix) {
                if (this.customerMetric[ix].key == metric) {
                    return this.customerMetric[ix];
                }
            }
            return null;
        },
        getCustomerMetrics: function () {
            var metrics = {};
            for(var ix = 0; ix < this.customerMetric.length; ++ix) {
                if (this.customerMetric[ix].value) {
                    metrics[this.customerMetric[ix].key] = this.customerMetric[ix].value;
                }
            }
            return metrics;
        },

        pageTrack: {on: 'client', body: function (page, _id) {
            page = page ? page : this.page + (this.sub ? '_' + this.sub : '');
            // Track bookmarks for Google Anlytics
            if (typeof(trackURL) == 'function') {
                trackURL(document.location.pathname + document.location.search + page ? '#' + page : '');
            }
        }},

        getStateCode:    function(stateVal){
            for(var stateCode in Assumptions.stateValues){
                if(Assumptions.stateValues.hasOwnProperty(stateCode)){
                    if(Assumptions.stateValues[stateCode] === stateVal){
                        return stateCode;
                    }
                }
            }
            return null;
        },

        publicGetLocationByZip: {on: 'server', body: function(zip) {
            if (testMode.match(/nozip/)) {
                return Q({city: 'Test City', stateCode: 'MA', lat: 42.1056673, lng: -72.5977452, timezone:'America/New_York'});
            }
            var tempGeo;
            return Q(zip)
                .then(Utils.getGeolocation.bind(this))
                .then(function (geo) {
                    tempGeo = geo;
                    return Utils.getTimezone(geo.lat, geo.lng);
                })
                .then(function (tz) {
                    tempGeo.timezone = tz;
                    return tempGeo;
                })
                .catch(function (error) {
                    console.log('ZIP Code lookup failure ' + error);
                    return null;
                });
        }},

        getHavenPhone: {
            on: 'server', // SecReviewed
            body: function(){
                return Q(objectTemplate.config.nconf.get('havenPhone'));
            }
        },
        havenPhone: {type: String, value: '1-855-744-2836'},
        havenPhoneGet: function(){
            return this.havenPhone || this.getHavenPhone().then(function(phone){
                    this.havenPhone = phone;
                }.bind(this));
        }
    });

    return {HavenController: HavenController};
};
