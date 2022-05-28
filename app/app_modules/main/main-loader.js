define([
  "loader"
], function(loader) {
      console.log("2 Executing Main Loader...");

      return loader.request_module({
        id:'module-main',
        htmlURL: '/app/app_modules/main/main.html',
        cssURL: '/app/app_modules/main/main.css',
        viewModelURL: '/app/app_modules/main/main.js'
      });

});
