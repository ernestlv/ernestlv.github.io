var LiveChat = {
  settings: {
    trigger: ('#global-footer__help-link--chat'),
    greetings: {
      offline: {
        en: "Live Chat is unavailable at this time, check out our FAQ’s and you can email us at help@valoralife.com or live chat between 9AM and 6PM CST.",
        es: "La Charla en vivo no está disponible en este momento, revise nuestras Preguntas frecuentes y puede enviarnos un correo electrónico a help@valoralife.com o charlar en vivo entre 9a.m. y 6p.m. Hora Central Estándar."
      }
    }
  },

  init: function() {
    LiveChat.bind();
  },

  bind: function() {
    if ( typeof zE !== 'undefined' ) {
      zE( function() {
        $zopim( function() {
          $zopim.livechat.hideAll();
        });
      });

      $( LiveChat.settings.trigger ).on( 'click', function( evt ){
        evt.preventDefault();

        zE( function() {
          $zopim( function() {
            if ( Modernizr.touch ) {
              $zopim.livechat.window.show();
            }
            else {
              $zopim.livechat.window.toggle();
            }

          });
        });
      });
    }
  },

  localizeLiveChat : function( language ) {
    var liveChatGreetings = LiveChat.settings.greetings;

    if ( typeof zE !== 'undefined' ) {
      if ( language === 'es' ) {
        zE( function() {
          $zopim( function() {
            $zopim.livechat.setLanguage( 'es' );
            $zopim.livechat.offlineForm.setGreetings( liveChatGreetings.offline.es );
          });
        });
      } else {
        zE( function() {
          $zopim( function() {
            $zopim.livechat.setLanguage( 'en' );
            $zopim.livechat.offlineForm.setGreetings(liveChatGreetings.offline.en);
          });
        });
      }
    }
  }
};

$(document).ready(function() {
  LiveChat.init();
});
