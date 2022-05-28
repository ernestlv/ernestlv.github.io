define([
  "jquery",
  "knockout"
], function($, KO) {

      console.log("1 Executing Module app ...");

      var observables = {};

      function request_module(dependencies) {
        var htmlPromise, cssPromise, viewModelPromise, argsPromise
        var {id, htmlURL, cssURL, viewModelURL, viewModel} = dependencies;

        console.log("3 Requesting Module:", id, htmlURL, cssURL, viewModelURL, viewModel);

        if (htmlURL) {
          htmlPromise = $.ajax({
            url:htmlURL,
            dataType:'html'
          });
        } else {
          htmlPromise = Promise.resolve(undefined);
        }

        if (cssURL) {
          cssPromise = $.ajax({
            url:cssURL,
            dataType:'text'
          });
        } else {
          cssPromise = Promise.resolve(undefined);
        }

        if (viewModel || viewModelURL) {
          if (typeof viewModelURL === "string") {
            viewModelPromise = System.import(viewModelURL).then(function(module){
              console.log("8 request_module: viewModelURL resolved for:", viewModelURL);
              return module.default;
            });
            argsPromise = Promise.resolve(undefined);
          } else {
            viewModelPromise = System.import(viewModel.url).then(function(module){
              console.log("8 request_module: viewModel resolved for:", viewModel);
              return module.default;
            });
            argsPromise = Promise.resolve(viewModel.args);
          }
        } else {
          viewModelPromise = Promise.resolve(undefined);
          argsPromise = Promise.resolve(undefined);
        }

        return Promise.all([htmlPromise, cssPromise, viewModelPromise, argsPromise]).then(function([html, css, ViewModel, args]){
          console.log("9 request_module: html, css, model dependencies resolved for module:", id);
          var viewModel;
          if (ViewModel) {
            console.log("9.1 Creating viewModel:", id, ViewModel);
            if (typeof ViewModel === "function") { //true if model module returns a function
              viewModel = new ViewModel(args);
            } else {
              viewModel = ViewModel;
            }
          }
          return { id, html, css, viewModel };
        });
      }

      function request_render(promiseModule, selector) { //module to render and element selector
        console.log("5 request_render: For ", selector);
        return promiseModule.then(function(module){
          console.log("10 Rendering Module:", module.id);
          var el = document.querySelector(selector);
          var { html, css, viewModel } =  module;
          el && css && $(el).append('<style type="text/css">' + css + '</style>');
          el && html && $(el).append(html);
          if (el && viewModel) {
            try {
              KO.applyBindings(viewModel, el);
            } catch(e) {
              console.error(e, "element:", el, "viewModel:", viewModel);
            }
          }
          return module;
        });
      }

      function request_render_child(promiseModule, el, bindingContext) { //module to render in element selector
        console.log("- request_render_child: For ", el);
        return promiseModule.then(function(module){
          console.log(" Rendering Child Module:", module.id);
          var { html, css, viewModel } =  module;
          el && css && $(el).append('<style type="text/css">' + css + '</style>');
          el && html && $(el).append(html);
          if (el && viewModel) {
            try {
              var childContext = viewModel;
              if (bindingContext) {
                childContext = bindingContext.createChildContext(viewModel);
                console.log("created new knockout child context:", childContext);
              }
               KO.applyBindingsToDescendants(childContext, el);
            } catch(e) {
              console.error(e, "element:", el, "viewModel:", viewModel);
            }
          }
          return module;
        });
      }

      function ready(promiseModules, callback) {
        Promise.all(promiseModules).then(callback);
      }

      function has_observable(id) {
        return !!observables[id];
      }

      function create_observable(id, value) {
        if (!this.has_observable(id)) {
          observables[id] = KO.observable(value);
        }
        return observables[id];
      }

      function get_observable(id) {
        return observables[id];
      }

      //ajax request html fragment and injects it in element def by selector
      return {
        request_module,

        request_render,

        request_render_child,

        ready,

        has_observable,

        create_observable,

        get_observable
      };
});
