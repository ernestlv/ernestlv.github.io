/*eslint-disable */
$(document).ready(function() {
  var $outerBody = $('.style-bd-outer');

  function escapeTagIdentifiers() {
    $('.style-example').each(function(){
      var $styleExample = $(this),
          html = $styleExample.html(),
          $code = $styleExample.closest('.style-mod').find('.html-code');

      html = html.replace(/</g, '&lt;');
      html = html.replace(/>/g, '&gt;');
      html = html.trim();

      $code.html(html);
    });
  }

  function showCode($mod, $verb) {
    if ($mod.hasClass('details-on')) {
      $verb.text('Show');
      $mod.removeClass('details-on').addClass('details-off');
    } else {
      $verb.text('Hide');
      $mod.removeClass('details-off').addClass('details-on');
    }
  }

  function showAllCode($body, $verbs, $verb, $mods) {
    if ($body.hasClass('details-all-on')) {
      $verbs.text('Show');
      $verb.text('Show');
      $body.removeClass('details-all-on');
      // Clean all mods with an active class, set them to on state
      $mods.removeClass('details-on details-off').addClass('details-off');
    } else {
      $verbs.text('Hide');
      $verb.text('Hide');
      $body.addClass('details-all-on');
      // Clean all mods with an active class, set them to off state
      $mods.removeClass('details-on details-off').addClass('details-on');
    }
  }

  function detailsTriggerOnClick() {
    $outerBody.on('click', '.details-trigger', function(){
      var $detailsTrigger  = $(this),
          $innerBody       = $('.style-guide-inner'),
          $mod             = $detailsTrigger.closest('.style-mod'),
          $mods            = $innerBody.contents().find('.style-mod'),
          $verb            = $detailsTrigger.find('.verb'),
          $verbs           = $innerBody.contents().find('.verb'),
          $body            = $outerBody;

      if ($detailsTrigger.hasClass('code-btn')) {
        showCode($mod, $verb);
      } else {
        showAllCode($body, $verbs, $verb, $mods);
      }
    });
  }

  function toggleNavOnMenuClick() {
    $('.nav-trigger').on('click', function(evt){
      evt.preventDefault();
      $outerBody.toggleClass('nav-active');
    });
  }

  function toggleNavOnComponentClick() {
    $('.style-nav-link').on('click', function(){
      $outerBody.toggleClass('nav-active');
    });
  }

  function fixNavBarOnScroll() {
    $(window).on('scroll', function(){
      var scrollTop = $(window).scrollTop();

      if (scrollTop > 75){
        $outerBody.addClass('sticky');
      } else {
        $outerBody.removeClass('sticky');
      }
    });
  }

  function setLargeView() {
    $('.size-a-large').on('click', function(evt) {
      evt.preventDefault();
      $outerBody.removeClass('auto medium small');
      $outerBody.addClass('large');
    });
  }

  function setMediumSize() {
    $('.size-a-medium').on('click', function(evt) {
      evt.preventDefault();
      $outerBody.removeClass('auto large small');
      $outerBody.addClass('medium');
    });
  }

  function setSmallSize() {
    $('.size-a-small').on('click', function(evt) {
      evt.preventDefault();
      $outerBody.removeClass('auto large medium');
      $outerBody.addClass('small');
    });
  }

  function setAutoSize() {
    $('.size-a-auto').on('click', function(evt) {
      evt.preventDefault();
      $outerBody.removeClass('medium large small');
      $outerBody.addClass('auto');
    });
  }

  function navigateToGroup() {

  }

  function navigateToComponent() {
    $('.style-nav .style-nav-list li a').on('click', function(evt) {
      var link = $(this).attr("href"),
          linkPLus = $(link).offset().top - 46;

      evt.preventDefault();
      $(window).scrollTop(linkPLus);
    });
  }

  escapeTagIdentifiers();
  toggleNavOnMenuClick();
  toggleNavOnComponentClick();
  fixNavBarOnScroll();
  detailsTriggerOnClick();
  navigateToGroup();
  navigateToComponent();
  prettyPrint();
});
