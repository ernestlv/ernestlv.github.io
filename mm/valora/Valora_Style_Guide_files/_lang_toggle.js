/* global VideoElements, VideoMarkers, LiveChat, Cookies */
/*eslint-disable */
var LangToggle = {
	LANGUAGE_TOGGLE : [
		{
			code	: 'en',
			label	: 'English',
			bodyCls : ''
		},
		{
			code	: 'es',
			label	: 'Español',
			bodyCls : 'spanish-is-active'
		}
	],

	DEFAULT_LANGUAGE_INDEX : 0,

	_DATA : null,

	init : function() {
		LangToggle.loadTranslations(function() {
			var langCode = LangToggle.readCookie();
			var data     = LangToggle._DATA[ langCode[1] ];

			LangToggle.toggleLink( langCode[0] );

			// set zopim/zendesk live chat language
			LiveChat.localizeLiveChat( langCode[1] );
			LangToggle.bind();
			if (data) { LangToggle.translateText( data ); }
		});
	},

	loadTranslations : function( callback ) {
		var jsonFilePath = $('#body-wrapper').data('page');

		if ( !LangToggle._DATA ) {
			$.getJSON( jsonFilePath, function( data ) {
				LangToggle._DATA = data;
				callback();
			});
			return;
		}
		callback();
	},

	toggleLink : function( currentIndex ) {
		var currentIndex;
		var nextIndex 		= currentIndex === 0 ? 1 : 0;
		var nextLanguage 	= LangToggle.LANGUAGE_TOGGLE[ nextIndex ];
		var currLanguage 	= LangToggle.LANGUAGE_TOGGLE[ currentIndex ];

		$('#body-wrapper')
			.removeClass( nextLanguage.bodyCls )
			.addClass( currLanguage.bodyCls );
		$('.js-language-toggle > a')
			.data( 'lang-index', nextIndex )
			.html( nextLanguage.label );
	},

	localize : function( languageCode ) {
		LangToggle.loadTranslations(function() {
			var data = LangToggle._DATA[ languageCode ];

			LangToggle.translateText(data);
			console.log('localized for ', languageCode );
		});
	},

	bind : function() {
		$('.js-language-toggle').on('click', 'a', function( evt ) {
			var $link 		= $(this);
			var index 		= $link.data('lang-index');
			var language 	= LangToggle.LANGUAGE_TOGGLE[ index ];

			evt.preventDefault();
			LangToggle.toggleLink( index );
			LangToggle.localize( language.code );

			// set zopim/zendesk live chat language
			LiveChat.localizeLiveChat( language.code );

			// set cookie
			Cookies.set( 'valoraLifeLang', language.code );
			return false;
		});
	},

	readCookie: function() {
		var cookieCode = Cookies.get('valoraLifeLang');
		var cookieIndex;

		if ( cookieCode === 'es' ) {
			cookieIndex = 1;
		} else {
			cookieIndex = 0;
		}
		return [ cookieIndex, cookieCode ];
	},

	translateText: function( data ) {
		var markerTimes = $('#body-wrapper').hasClass('spanish-is-active') ?
			VideoMarkers.ES : VideoMarkers.EN;
		var videoOverlayTimings = $('#body-wrapper').hasClass('spanish-is-active') ?
			VideoOverlayTimings.ES : VideoOverlayTimings.EN;

		$.each( data, function( key, val ) {
			var elementLang = $( '*[data-lang="'+key+'"]' );

			if ( elementLang.length > 0 ) {
				if ( elementLang[0].localName === "img" ) {
					elementLang.attr( 'src', val ) ;
				} else if ( elementLang[0].localName === "source" ) {
					if ( VideoElements.valoraVideo ) {

						if ( $('.video--marker-player').length ) {

							// Override meta event to pass custom markers on the re-init that
							// occurs when the event is fired on src change; in the source
							// this built to re-establish the markers provided in the initial
							// options (which we don't want)
							VideoElements.valoraVideo
							.off('loadedmetadata')
							.on('loadedmetadata', function(e) {
								var scope = this;

								VideoElements.resetText();

						        // remove existing markers if already initialized
						        // (and set new ones)
						        scope.markers.reset(markerTimes);

						        // update UI for markers whose time changed
						        scope.on('timeupdate', function() {
						        	scope.markers.updateTime();
						        });
							});
						}

						// Change the src, triggering our custom loadedmetadata event above
						VideoElements.valoraVideo.src(val);
					}
				} else {
					elementLang.html( val );
				}
			}
		});

		//Set timings for video overlays if they have overlays
		if ( VideoElements.valoraVideo && VideoElements.videoOverlay ){
			var videoSource = VideoElements.valoraVideo.options_.sources[0].src;

			// set the timing start and end (they are different in spanish/english)
			// by accessing the overlay __timings object
			// and changing the timing to the those hardcoded in videoOverlayTimings.js
			if ( videoSource.indexOf('options') !== -1 ) {
			 	VideoElements.videoOverlay.overlays[0].__timings[0].start = videoOverlayTimings[0].start;
			 	VideoElements.videoOverlay.overlays[0].__timings[0].end;
			} else if ( videoSource.indexOf('apply') !== -1 ) {
			 	VideoElements.videoOverlay.overlays[0].__timings[0].start = videoOverlayTimings[1].start;
			 	VideoElements.videoOverlay.overlays[0].__timings[0].end   = videoOverlayTimings[1].end;
			} else if ( videoSource.indexOf('current') !== -1 ) {
			 	VideoElements.videoOverlay.overlays[0].__timings[0].start = videoOverlayTimings[2].start;
			 	VideoElements.videoOverlay.overlays[0].__timings[0].end   = videoOverlayTimings[2].end;
			} else if ( videoSource.indexOf('home') !== -1 ) {
			 	VideoElements.videoOverlay.overlays[0].__timings[0].start = videoOverlayTimings[3].start;
			 	VideoElements.videoOverlay.overlays[0].__timings[0].end   = videoOverlayTimings[3].end;
			 	VideoElements.videoOverlay.overlays[1].__timings[0].start = videoOverlayTimings[4].start;
			 	VideoElements.videoOverlay.overlays[1].__timings[0].end   = videoOverlayTimings[4].end;
			 	VideoElements.videoOverlay.overlays[1].__timings[1].start = videoOverlayTimings[5].start;
			 	VideoElements.videoOverlay.overlays[1].__timings[1].end   = videoOverlayTimings[5].end;
			}

			//if on the home page...
			if ( $('.video--marker-player' ).length){
				var isIphone = false;

				//check if device is iPhone
				if ( (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) ) {
			 		isIphone = true;
				}

				// check if video is ready
				// then run the lettering animation for either spanish or english
				VideoElements.valoraVideo.ready(function(){
			  		if ( !isIphone && !$('.spanish-is-active').length && !$('.en-is-animated').length ) {
			  			LetteringAnimation.animateHomeEn();
			  		} else {
			  			LetteringAnimation.animateHomeEs();
			  		}
		  		});
			}
		}
	}
};

$(document).ready(function() {
  LangToggle.init();
});

