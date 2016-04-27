/*global DifferenceWeBelieve*/
module.exports.differenceController = function(objectTemplate, _getTemplate) {
    var DifferenceController = objectTemplate.create('DifferenceController', {
        init: function(controller) {
            this.controller = controller;
        },
        routeEntered: function() {
            var routeEntered = function() {
                this.initializeClientLibraries();
            }.bind(this);

            setTimeout(routeEntered, 100);
        },
        routeExited: function() {
            DifferenceWeBelieve.destroy();
        },
        initializeClientLibraries: function() {
            DifferenceWeBelieve.init();
        }
    });

    return {
        DifferenceController: DifferenceController
    };
};
