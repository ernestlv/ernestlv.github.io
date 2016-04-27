module.exports.applicationProcessingController = function (objectTemplate, getTemplate) {
    var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;

    var reqSetTime; //TODO: How is this variable instantiated in applicationController
    var intervalId;

    var ApplicationProcessingController = objectTemplate.create('ApplicationProcessingController', {
        init: function(controller) {
            this.controller = controller;
        },
        routeEntered: function() {
            var routeEntered = function() {
                this.beginStatusChecks();
                this.controller.isLoading = false;
            }.bind(this);

            setTimeout(routeEntered, 100);
        },
        routeExited: function() {
            this.endStatusChecks();
        },
        showWaiting: function () {

            var getTargetRouteId = function () {
                var action = this.getAction();
                if(action.route) {
                    return action.route;
                } else if (action.partial) {
                    return action.partial;
                } else {
                    return 'accountCenter';
                }

            }.bind(this);

            var timeout = 1200000;
            var policy = this.controller.customer.applicationPolicy;
            var submitTime = reqSetTime ?  reqSetTime : policy.submittedAt.getTime();
            var routeId = getTargetRouteId();
            var currentTime = (new Date()).getTime();

            if (routeId !== 'applicationProcessing') {
                this.controller.routeToPrivate('accountCenter');
                return;
            } else {
                return currentTime < (submitTime + timeout);
            }
        },
        refresh: function() {
            if (this.showWaiting()) {
                this.controller.publicSave();
            } else {
                this.endStatusChecks();
            }
        },
        beginStatusChecks: function () {
            var pollInterval = 2000;
            var refresh = function() {
                this.refresh();
            }.bind(this);

            intervalId = setInterval(refresh, pollInterval);
        },
        endStatusChecks: function () {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId   = null;
                reqSetTime = null;
                this.controller.refresh();
            }
        },
        getAction: function (policy) {
            var progress = this.testMode ? 'ApplicationSubmitted' : Assumptions.progressById[this.controller.customer.progress];
            var workflowRoutes = this.controller.workflowRoutes;
            var state;
            var subState;
            var routeDefinition;

            var callRouteCondition = function(route) {
                return route.condition.call(this);
            }.bind(this);

            policy = policy || this.controller.customer.applicationPolicy;

            if (progress === 'ApplicationSubmitted') {
                state =  policy.futureWorkflowState || policy.workflowState;
                subState = (state === 'Manual Underwriting') ? ''
                    : policy.futureWorkflowSubState || policy.workflowSubState;
                routeDefinition =  workflowRoutes[state + ':' + subState];

                if (_.isArray(routeDefinition)) {
                    // ??
                    return _.find(routeDefinition, callRouteCondition);
                } else {
                    return routeDefinition;
                }
            }
        }
    });

    return {
        ApplicationProcessingController: ApplicationProcessingController
    };
};
