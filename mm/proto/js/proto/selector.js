(function($){
	"use strict"
	//radio button events
	$('form').on('click', '.form-item .selector', function(e){
		$(this).parents('.form-item').addClass('completed');
		$(this).find('.selected').removeClass('selected');
		$(e.target).addClass('selected');
	});
})(jQuery);