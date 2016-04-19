(function($){
	"use strict"
	//text field events
	$('form').on('focus', '.form-item input', function(){
		$(this).parents('.form-item').addClass('completed');
	});

	$('form').on('blur', '.form-item input', function(e){
		! $(this).val() && $(this).parents('.form-item').removeClass('completed');
	});
})(jQuery);