var Nick = Nick || {};
(function($, Nick){
	"use stric"

	var currentChannel = 0;

	var source_header = $('#header-tmpl').html();
	var template_header = Handlebars.compile(source_header);

	var source_tabs = $('#tabs-tmpl').html();
	var template_tabs = Handlebars.compile(source_tabs);

	var source_content = $('#content-tmpl').html();
	var template_content = Handlebars.compile(source_content);
	Handlebars.registerPartial("shows", $("#shows-tmpl").html());

	function sortSchedule(channel){
			channel.schedule.sort(function(a, b){
				titleA = a.seriesTitle.toUpperCase();
				titleB = b.seriesTitle.toUpperCase();
				if (titleA < titleB){
					return -1;
				}
				if (titleA > titleB){
					return 1;
				}
				return 0;
			});
			return channel;
	}

	function sortTime(channel){
			channel.schedule.sort(function(a, b){
				dateA = new Date(a.airTime);
				dateB =  new Date(b.airTime);
				if (dateA < dateB){
					return -1;
				}
				if (dateA > dateB){
					return 1;
				}
				return 0;
			});
			return channel;
	}

	function searchSchedule(channel, value){
		var re = new RegExp(value, 'ig');
		var filteredSchedule = channel.schedule.filter(function(show){
				return show.seriesTitle.search(re) !== -1;
		});
		return filteredSchedule;
	}

	function setCurrentChannel(index){
		currentChannel = index - 0;
		$('.tabs .current').toggleClass('current');
		$('.content .current').toggleClass('current');
		$('#tab-'+index).toggleClass('current');
		$('#content-'+index).toggleClass('current');
	}

	function renderHeader(header){
		var html_header = template_header(header);
		$("header .info").html(html_header);
	}

	function renderTabs(tabs){
		var html_tabs = template_tabs(tabs);
		$(".tabs").html(html_tabs);
	}

	function renderContent(content){
		var html_content = template_content(content);
		$(".content").html(html_content);
		setCurrentChannel(currentChannel);
	}

	function isOnNow(content){
		var now = new Date("2016-05-24T05:12:10.000+0000")
		var shows = content.channels[currentChannel].schedule;
		var len = shows.length-1;
		for (var i=0; i< len; i++){
			var c = new Date( shows[i].airTime );
			var x = new Date( shows[i+1].airTime );
			if (now > c && now < x){
				shows[i].isOnNow = true;
				shows[i+1].isNext = true;
			}
		}
	}


	//deep clones channels and schedules
	function cloneSchedule(content){
		var clonedContent  = $.extend({}, content);
		var clonedChannels = clonedContent.channels.map(function(channel){
			var clonedChannel = $.extend({}, channel);
			var clonedSchedule = clonedChannel.schedule.slice(0);
			clonedChannel.schedule = clonedSchedule;
			return clonedChannel;
		})
		clonedContent.channels = clonedChannels;
		return clonedContent;
	}

	function initSort(){
		$(".sort").on('click', 'a', function(e){
				e.preventDefault();
				var clonedSchedule = cloneSchedule(schedule);
				clonedSchedule.channels.map(sortSchedule);
				renderContent(clonedSchedule);
		});
	}

	function initSearch(){
		$(".search-btn").on('click', function(e){
			var value = $.trim($('.search input').val());
			if (!value){
				renderContent(schedule);
				return;
			}
			var clonedSchedule = cloneSchedule(schedule);
			var channel = clonedSchedule.channels[currentChannel];
			channel.schedule = searchSchedule(channel, value);
			renderContent(clonedSchedule);
		});
	}

	function initSwitchChannel(){
		$(".tabs").on('click', 'a', function(e){
			e.preventDefault();
			var index = $(e.target).attr('data-index') - 0;
			setCurrentChannel(index);
		});
	}

	function initExpand(){
		$(".content").on('click', 'li', function(e){
			e.preventDefault();
			$(this).parent().find('.expand').toggleClass('expand');
			$(this).toggleClass('expand');
		});
	}

	$.extend(Nick, {
		cloneSchedule: cloneSchedule,
		renderHeader: renderHeader,
		renderTabs:renderTabs,
		renderContent:renderContent,
		initSort:initSort,
		initSearch:initSearch,
		initSwitchChannel: initSwitchChannel,
		initExpand: initExpand,
		sortSchedule: sortSchedule,
		sortTime: sortTime,
		searchSchedule: searchSchedule,
		setCurrentChannel:setCurrentChannel,
		isOnNow:isOnNow
	});
})(jQuery, Nick);