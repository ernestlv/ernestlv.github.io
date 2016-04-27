/*global StickySidebars FAQSubnav */
module.exports.faqsAnswersController = function(objectTemplate, _getTemplate) {
    var FaqsAnswersController = objectTemplate.create('FaqsAnswersController', {
        init: function(controller) {
            this.controller = controller;
        },
        routeEntered: function() {
            var routeEntered = function() {
                this.initializeClientLibraries();
            }.bind(this);

            setTimeout(routeEntered, 100);
        },
        initializeClientLibraries: function() {
            StickySidebars.init();
            FAQSubnav.init();
        },
        routeExited: function(){
            this.destroyClientLibraries();
        },
        destroyClientLibraries: function(){
            FAQSubnav.destroy();
            StickySidebars.destroy();
        }
    });

    return {
        FaqsAnswersController: FaqsAnswersController
    };
};
