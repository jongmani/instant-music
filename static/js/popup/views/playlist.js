define([
  'jquery',
  'underscore',
  'backbone',
  'views/song'
], function($, _, Backbone, SongView) {
  var PlaylistView = Backbone.View.extend({
    el: '#expanded-container',

    initialize: function() {
      var playlistModel = this.model;
      var bg = chrome.extension.getBackgroundPage();

      if (!bg.playerWrapper.get('player')) {
        console.log("aborting playlistView initialize because player isn't ready");
        return;
      }

      this.listenTo(playlistModel.get('songs'), 'add', function (song) {
        var songView = new SongView({ model: song });
        this.$('.playlist-songs').prepend(songView.render().el);
      });

      this.listenTo(playlistModel, 'change:currentSong', function (playlist) {
        this.highlightCurrentSong(playlist.changed.currentSong);
      });

      // Empty the current playlist and populate with newly loaded songs
      this.$('#song-search-form-group').empty();
      this.$('.playlist-songs').empty();
      
      var songs = playlistModel.get('songs').models;
      // Fetch song models from bg.Songs's localStorage
      // Pass in reset option to prevent fetch() from calling "add" event
      // for every Song stored in localStorage
      if (playlistModel.get('musicChart').source == "myself") {
        playlistModel.get('songs').fetch({ reset: true });
        songs = playlistModel.get('songs').models;
      }

      // Add a search form
      var userLocale = chrome.i18n.getMessage("@@ui_locale");
      if (userLocale == "ko" || userLocale == "ko-kr") {
        var inputEl = '<input class="form-control flat" id="song-search-form" type="search" placeholder="싸이 챔피언">' +
          '<a href="javascript:void(0)" id="open-favorites"><span class="search-heart-icon fa fa-heart"></span></a>'+
          '<span class="search-input-icon fui-search"></span>';
      } else {
        var inputEl = '<input class="form-control flat" id="song-search-form" type="search" placeholder="John Lennon Imagine">' +
          '<a href="javascript:void(0)" id="open-favorites"><span class="search-heart-icon fa fa-heart"></span></a>'+
          '<span class="search-input-icon fui-search"></span>';
      }
      this.$('#song-search-form-group').append(inputEl);
      var form = this.$('input');
      $(form).keypress(function (e) {
        if (e.charCode == 13) {
          var query = form.val();
          playlistModel.lookUpAndAddSingleSong(query);
        }
      });

      this.renderSongs(songs);
    },

    // Highlight the given song
    highlightCurrentSong: function (currentSong) {
      var currentVideoId = currentSong.get('videoId');
      _.each($('.list-group-item'), function (item) {
        if (item.id == currentVideoId)
          $(item).addClass('active');
        else
          $(item).removeClass('active');
      });
    },

    renderSongs: function() {

      var playlistModel = this.model;

      // Empty old songs
      this.$('.playlist-songs').empty();

      // Fetch songs to render
      var songs = playlistModel.get('songs').models;
      if (playlistModel.get('musicChart').source == "myself") {
        playlistModel.get('songs').fetch({ reset: true });
        songs = playlistModel.get('songs').models;
      }

      // Create and render a song view for each song model in the collection
      _.each(songs, function (song) {
        var songView = new SongView({ model: song });
        this.$('.playlist-songs').append(songView.render().el);
      }, this);

      // Highlight the currently played song
      var currentSong = playlistModel.get('currentSong');
      if (currentSong)
        var currentVideoId = currentSong.get('videoId');
      else {
        var firstSong = playlistModel.get('songs').at(0);
        if (!firstSong) {
          // FIXME: this should be done via triggering event and by Popup model
          $('.music-info').text(chrome.i18n.getMessage("try_different_chart"));
          $('.music-info').fadeOut(2000);
          return;
        }
        var currentVideoId = firstSong.get('videoId');
      }

      _.find($('.list-group-item'), function (item) {
        if (item.id == currentVideoId)
          return $(item).addClass('active');
      });
    },

    clearFavorites: function() {
      localStorage.clear();
    }
  });

  return PlaylistView;

});
