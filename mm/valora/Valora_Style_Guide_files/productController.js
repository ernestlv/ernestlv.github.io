/*global ResponsiveTables BannerJump*/
module.exports.productController = function(objectTemplate, _getTemplate) {
    var ProductController = objectTemplate.create('ProductController', {
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
        routeExited: function() {
            this.destroyClientLibraries();
        },
        destroyClientLibraries: function () {
            ResponsiveTables.destroy();
            BannerJump.destroy();
        },
        initializeClientLibraries: function() {
            ResponsiveTables.init();
            BannerJump.init();
        }
    });

    return {
        ProductController: ProductController
    };
};
