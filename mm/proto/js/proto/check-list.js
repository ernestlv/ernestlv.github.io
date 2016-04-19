(function($){
	"use strict"
	//check-list
	$('form').on('click', '.form-item .check-list', function(e){
		var $target = $(e.target).parents('li');

		$target.toggleClass('selected');
	});
})(jQuery);