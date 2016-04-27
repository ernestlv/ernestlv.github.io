/*global LearnSubnav VideoElements*/
module.exports.learnController = function(objectTemplate, _getTemplate) {
    var LearnController = objectTemplate.create('LearnController', {
        init: function(controller) {
            this.controller = controller;
        },
        routeEntered: function() {
            var routeEntered = function() {
                this.controller.scrollSet('top');
                this.initializeClientLibraries();
            }.bind(this);

            setTimeout(routeEntered, 100);
        },
        routeExited: function () {
            this.destroyClientLibraries();
        },
        initializeClientLibraries: function() {
            LearnSubnav.init();
            VideoElements.init();
        },
        destroyClientLibraries: function () {
            VideoElements.destroy();
            LearnSubnav.destroy();
        },
        updateActiveLearnTab: function() {
            var activeClass = 'learn-subnav__link--active';
            $('.' + activeClass).removeClass(activeClass);

            LearnSubnav.highlightActiveSection();
        }
    });

    return {
        LearnController: LearnController
    };
};
