//section nav
(function($){
	"use strict"
	function setCurrentSection(id){
		var $target = $(id);
		var $expand = $('aside .expand');
		var $current = $('aside .current');
		if ($expand[0] === $target[0]){
			return;
		}
		$current.removeClass('current');
		$expand.removeClass('expand');
		var $parent = $target.parents('.sub');
		$expand = $parent[0] ? $parent.parent() : $target;
		$expand.addClass('expand');
		$target.addClass('current');
		var $section = $(id+'_sec');
		if ($section[0]){
			$('section.current').removeClass('current');
			$section.addClass('current');
			$(document).scrollTop(0);
		}
	}

	$('body').on('click', 'aside .options a, .btn.snapp', function(e){
		e.preventDefault()
		var id = $(this).attr('href');

		setCurrentSection(id);
	});
})(jQuery);