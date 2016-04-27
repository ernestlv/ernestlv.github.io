/*eslint-disable */
var GlobalHeader = {
  settings: {
    $body: $('body'),
    $header: $('.global-header'),
    $trigger: $('.global-header__nav-trigger-link'),
  },
  init: function() {
    this.settings = {
      $body: $('body'),
      $header: $('.global-header'),
      $trigger: $('.global-header__nav-trigger-link'),
    };
    GlobalHeader.bind();
  },
  bind: function() {

    // highlight active section
    GlobalHeader.highlightActiveSection();

    // mobile: click hamburger to open nav
    GlobalHeader.settings.$trigger.click(function(e){
      e.preventDefault();
      GlobalHeader.settings.$body.toggleClass('js-global-nav-is-open');
    });


    var headerHeight = GlobalHeader.settings.$header.height();

    // tablet and larger: nav compacts once you've scrolled down past the header height
    var controller = new ScrollMagic.Controller();

    new ScrollMagic.Scene({
      triggerElement: 'body',
      triggerHook: 'onEnter',
      duration: '100%'
    })
    .addTo(controller)
    .on('update', function (e) {

      var scrollPos = e.target.controller().info('scrollPos');

      // Only copact if we're past the header height
      if ( scrollPos > headerHeight) {
        GlobalHeader.compactGlobalHeader();
      }
      else {
        GlobalHeader.fullGlobalHeader();
      }

    });

  },
  fullGlobalHeader: function() {
    GlobalHeader.settings.$body.removeClass('js-global-header-is-compact');
  },
  compactGlobalHeader: function() {
    GlobalHeader.settings.$body.addClass('js-global-header-is-compact');
  },
  highlightActiveSection: function() {
    // check URL segment and test against the <li> class,
    // which is in the format global-header__section-item--SEGMENT
    var urlPartsArray  = window.location.pathname.split( '/' ); //
    var activeSection  = urlPartsArray[1].replace('.html',''); // something like 'difference'

    var testString = activeSection;

    // need to generalize test to substrings learn-about, learn-apply,
    if ( activeSection.indexOf('learn') != -1 ) {
      testString = 'learn';
    }

    // faqs and faqs-answsers, etc.
    if ( activeSection.indexOf('faqs') != -1 ) {
      testString = 'faqs';
    }

    // loop over the section list <li>s
    $('.global-header__section-item').each(function() {
      if ( $(this).hasClass('global-header__section-item--' + testString) ) {
        $(this).addClass('global-header__section-item--active');
      }
    });

  }
};

$(document).ready(function() {
  GlobalHeader.init();
});
