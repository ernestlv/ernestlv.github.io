(function($){
	"use strict"
	//dropdown events
	$('form').on('focus', '.form-item > .dropdown > input', function(){
		$(this).parents('.dropdown').addClass('open');
	});

	$('form').on('blur', '.form-item > .dropdown > input', function(e){
		$(this).parents('.dropdown').removeClass('open');
	});

	$('form').on('mousedown', '.dropdown', function(e){
		$(this).toggleClass('open');
	});

	$('form').on('mousedown', '.dropdown.open', function(e){
		$(this).find('input').val($(e.target).attr('data-value'));
		$(this).find('li.selected').removeClass('selected');
		$(e.target).addClass('selected');
	});
})(jQuery);