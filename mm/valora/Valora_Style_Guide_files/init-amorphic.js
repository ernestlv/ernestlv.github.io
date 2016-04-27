/*eslint-disable */
//Override Bindster To Prevent Data-Attributes From Being Evaluated
Bindster.prototype.isOurAttr = function(str) {
    if (hasPrefix(str, 'data-', 5)) { return false; }
    return str.substr(0, this.namespace_prefix.length + 1) === (this.namespace_prefix + ":");
};

controller = {
    loggedIn: false,
    file: false,
    isLoading: false,
    pageTitle: '',
    bodyClass: '',
    popup: '',
    clientLibrariesReady: false,
    homeController: {subscribed: true},
    amorphicStatus: 'online',
    amorphicLoaded: false,
    isTestEnv: false
};

var quoteButton = {
    element: $('#quoteButton')[0],
    defaultText: 'GET A QUOTE',
    loadingText: 'QUOTES LOADING...',
    toggleText: function() {
        if (!controller.amorphicLoaded && this.element.innerText === this.defaultText) {
            this.element.innerText = this.loadingText;
        }
    }
};

var routeTo = function(route) {
    quoteButton.toggleText();
};

var bindster = Bindster.bind(controller, null, controller);
bindster.alert = console.log;

function hasPrefix(string, prefix, chars) {
    return string.substring(0, chars) === prefix;
}
