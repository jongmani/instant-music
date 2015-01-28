define([
  'jquery',     // lib/jquery/jquery
  'backbone',
  'models/playlist',
], function($, Backbone, PlaylistModel) {
  'use strict';

  var PlayerWrapper = Backbone.Model.extend({
    defaults: {
      player: null
    },

    initialize: function() {
      var self = this;
      window.Playlist = new PlaylistModel();

      var extensionId = chrome.i18n.getMessage('@@extension_id');
      var addedParam = '*?enablejsapi=1&origin=chrome-extension:\\' + extensionId;
      var filter = { 
        urls: ['https://www.youtube.com/embed/'+addedParam, '*://*.youtube.com/embed/'+addedParam]
      };
      var optParam = ['blocking', 'requestHeaders'];

      // Prepare the iframe to use YoutubeIframeAPI
      var iframe = $('iframe')[0];
      $(iframe).attr('src', $(iframe).attr('src') + addedParam);

      // Attach the necessary headers to play YouTube videos that cannot be played
      // in certain platforms (e.g. chrome extension)
      // Credits to Streamus: https://github.com/MeoMix/StreamusChromeExtension
      chrome.webRequest.onBeforeSendHeaders.addListener(function (req) {
        var customurl = req.url.substring(0, req.url.indexOf('/embed/'));
        var customRefererObject = { name: 'Referer', value: customurl };
        var customUserAgent = 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A403 Safari/8536.25';
        var isRefererPresent;
        $.grep(req.requestHeaders, function (headers) {
          if (headers.name == 'Referer') {
            headers.value = customurl;
          }
          if (headers.name == 'User-Agent') {
            headers.value = customUserAgent;
          }
        });
        if (!isRefererPresent) {
          req.requestHeaders.push(customRefererObject);
        }
        return { requestHeaders: req.requestHeaders };
      }, filter, optParam);


      window.onYouTubeIframeAPIReady = function() {
        //console.log("onYouTubeIframeAPIReady");
        self.set('player', self.YoutubePlayer('myframe')); // FIXME: might have to get rid of 'new' keyword
        YT.Player.prototype.playNextSong = function() {
          var nextSong = window.Playlist.getNextSong();
          self.get('player').loadVideoById(nextSong.get('videoId'));
          window.Playlist.set('currentSong', nextSong);
        };

        YT.Player.prototype.playPrevSong = function() {
          var prevSong = window.Playlist.getPrevSong();
          self.get('player').loadVideoById(prevSong.get('videoId'));
          window.Playlist.set('currentSong', prevSong);
        };

        return self.get('player');
      };

      // load YouTube library
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }, // end of initialize

    YoutubePlayer: function (iframeId) {
      var self = this;
      var player = new YT.Player(iframeId, {
        height: '300',
        width: '300',
        events: {
          'onReady': self.onPlayerReady,
          'onStateChange': self.onPlayerStateChange,
          'onError': self.onPlayerError
        }
      });
      return player;
    },

    onPlayerReady: function() {
      window.Playlist.getNewSongs(function () {
        var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
        if (popupWindow && popupWindow.popupView) {
          popupWindow.popupView.setProgress(100);
          // FIXME: do not initialize manually...
          popupWindow.popupView.initialize();
        }
        var firstSong = window.Playlist.get('currentSong');
        playerWrapper.get('player').cueVideoById(firstSong.get('videoId'));

      }, window.Playlist.get('genre'), window.Playlist.get('numSongs'));
    },

    onPlayerStateChange: function (event) {
      var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
      // PLAY
      if (event.data == YT.PlayerState.PLAYING) {
        var currentSong = window.Playlist.get('currentSong');
        chrome.browserAction.setIcon({path: "/static/img/icon48_active.png"});
        playerWrapper.trigger("playing");
        if (popupWindow && popupWindow.popupView) {
          playerWrapper.startSlider(); // startSlider() and stopSlider() not defined?
        } else {
          playerWrapper.showNotification(currentSong.get('videoId'), currentSong.get('title'), currentSong.get('artist'));
        }
      } 

      // PAUSE
      if (event.data != YT.PlayerState.PLAYING) {
        playerWrapper.stopSlider();
        chrome.browserAction.setIcon({path: "/static/img/icon48.png"});
      }

      // ENDED
      if (event.data == YT.PlayerState.ENDED) {
        playerWrapper.get('player').playNextSong();
      }
    },

    onPlayerError: function() {
      //empty
    },

    showNotification: function (videoId, title, artist) {
      var thumbnail = "http://img.youtube.com/vi/"+videoId+"/mqdefault.jpg";
      var notification;

      if (artist) {
        notification = new Notification(title, {
          body: "by "+artist,
          icon: thumbnail
        });
      } else {
        notification = new Notification(title, {
          icon: thumbnail
        });
      }
      setTimeout(function() {
        notification.close();
      }, 3500);
    },

    startSlider: function() {
      var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
      if (!popupWindow) return;
      window.addEventListener('message', this.messageHandler);
    },

    stopSlider: function() {
      window.removeEventListener('message', this.messageHandler);
    },

    messageHandler: function (event) {
      var obj = JSON.parse(event.data);
      var currentTime = obj.info.currentTime;
      var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
      if (typeof currentTime !== 'undefined' && popupWindow && popupWindow.popupView)
        popupWindow.popupView.moveSlider(obj.info.currentTime);
    }

  }); // end of var PlayerWrapper Model
  return PlayerWrapper;
}); // end of define