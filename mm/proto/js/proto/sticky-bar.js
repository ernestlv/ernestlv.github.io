//sticky bar
(function($){
	"use strict"

	$('.sticky-bar').on('click', '.open-lnk', function(e){
		e.preventDefault();
		$('input[name=firstname]').parent().addClass('completed');
		$('input[name=firstname]').val('John');
		$('input[name=lastname]').parent().addClass('completed');
		$('input[name=lastname]').val('Smithbergsonski');
		$('body').addClass('no-scroll');
		$('.sticky-bar').addClass('open');
	});

	$('.sticky-bar').on('click', '.close-lnk, .nav a', function(e){
		e.preventDefault();
		$('body').removeClass('no-scroll');
		$('.sticky-bar').removeClass('open new');
	});

	$('.top-nav').on('click', '.new-lnk', function(e){
		e.preventDefault();
		$('input[name=firstname]').parent().removeClass('completed');
		$('input[name=firstname]').val('');
		$('input[name=lastname]').parent().removeClass('completed');
		$('input[name=lastname]').val('');
		$('body').addClass('no-scroll');
		$('.sticky-bar').addClass('open new');
	});
})(jQuery);