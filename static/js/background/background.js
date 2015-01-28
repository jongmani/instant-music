define([
  'jquery',
  'underscore',
  'backbone',
  'models/player', // FIXME: name could be missleading here. change this
], function($, _, Backbone, PlayerWrapper) {
  'use strict';

  function getPopupWindow() {
    return chrome.extension.getViews({ type: "popup" })[0];
  }

  // Copy the selected video's url to user's clipboard
  window.copyLink = function (link) {
    var container = $('textarea#copy-link').val(link).select();
    document.execCommand('copy');
    container.val('');
  };

  $(function() {
    // Listen to network failures and return when they happen
    window.addEventListener('online', function() {
      chrome.runtime.reload();
      return;
    });

    window.playerWrapper = new PlayerWrapper(); // Instantiates everything!

    var popupWindow = getPopupWindow();

    // Listen to shortcut events
    // Notice: command events are fired twice when popup is open
    // in chrome v 33.0 GTK build
    chrome.commands.onCommand.addListener(function (command) {
      var popupWindow = getPopupWindow();
      var player = window.playerWrapper.get('player');
      switch (command) {
        case "togglePlay":
          if (!player) return;
          
          var currentState = player.getPlayerState();
          if (currentState == 1) {
            if (popupWindow) {
              popupWindow.$('#play-button').show();
              popupWindow.$('#pause-button').hide();  
            }
            player.pauseVideo();
          } else {
            if (popupWindow) {
              popupWindow.$('#play-button').hide();
              popupWindow.$('#pause-button').show();  
            }
            player.playVideo();
          }
          break;
        case "playNextSong":
          player.playNextSong();
          break;
        case "playPrevSong":
          player.playPrevSong();
          break;
        case "toggleLoopActive":
          if (Playlist.get('loopActive') == true) Playlist.set('loopActive', false);
          else Playlist.set('loopActive', true);
          break;
      }
    });
  });
});
