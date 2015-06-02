define([
  'jquery',
  'underscore',
  'backbone',
  'text!/templates/song.html'
], function($, _, Backbone, songHTML) {
  var SongView = Backbone.View.extend({

    // A SongView represents each song's view inside Playlist View
    songTemplate: _.template(songHTML),

    events: {
      'mousedown': "playSelectedSong"
    },

    initialize: function() {
      //console.log("songView: init");
      // Disable showing context menu on right click
      // because I have to show my options menu on right click
      this.$el.bind('contextmenu', function() {
        return false;
      });

      // disable selecting text
      this.$el.attr('unselectable', 'on')
              .css('user-select', 'none')
              .on('selectstart', false);

      // when videoId is changed manually, change its DOM list-group-item id
      this.model.on('change:videoId', this.onVideoIdChanged, this);
      this.model.on('change:title', this.render, this);
    },

    render: function() {
      this.$el.html(this.songTemplate({ song: this.model.toJSON() }));
      return this;
    },

    playSelectedSong: function(e) {
      var bg = chrome.extension.getBackgroundPage();
      // Left click on options menu (User right clicks, and THEN chooses an option)
      if (e.which == 1) {

        // Watch on Youtube: open a new tab that shows YouTube video of selected song
        if (this.$('.youtube-link')[0] == e.target || this.$('.youtube-link').find(e.target)[0]) {
          var videoId = this.model.get('videoId');
          var youtubeLink = "http://www.youtube.com/watch?v="+videoId;
          chrome.tabs.create({ url: youtubeLink });
          bg.playerWrapper.get('player').pauseVideo();
          this.$('.my-options').fadeOut(200);
          return false;
        }

        // Copy link: copy the selected song's YouTube link
        if (this.$('.copy-link')[0] == e.target || this.$('.copy-link').find(e.target)[0]) {
          var videoId = this.model.get('videoId');
          var youtubeLink = "http://www.youtube.com/watch?v="+videoId;
          bg.copyLink(youtubeLink);
          this.$('.my-options').fadeOut(200);
          return false;
        }

        if (this.$('.replace-song-link')[0] == e.target || this.$('.replace-song-link').find(e.target)[0]) {
          this.model.searchForSongsToReplace();
          this.$('.my-options').fadeOut(200);
          return false;
        }

        if (this.$('.delete-link')[0] == e.target || this.$('.delete-link').find(e.target)[0]) {
          this.model.destroy();
          this.$el.empty();
          this.$('.my-options').fadeOut(200);
          return false;
        }

        if (this.$('.add-to-favorites-link')[0] == e.target || this.$('.add-to-favorites-link').find(e.target)[0]) {
          this.model.save();
          this.$('.my-options').fadeOut(200);
          // TODO: tell the user this has been done
          return false;
        }

        $('.my-options').fadeOut(200);

        // *NOTE: It is possible to add "Download Song" if
        // it is not against policy
        
        bg.Playlist.set('currentSong', this.model);
        bg.playerWrapper.get('player').loadVideoById(this.model.get('videoId'));
      }
      // Right click: show options menu instead of default contextmenu
      if (e.which == 3 || e.ctrlKey && e.which == 1) {

        $('.my-options').not(this.$('.my-options')).fadeOut(200);
        this.$('.my-options').fadeToggle(200);

        // i18n for menu options
        this.$('.youtube-link-text').text(chrome.i18n.getMessage('watch'));
        this.$('.copy-link-text').text(chrome.i18n.getMessage('clip'));
        this.$('.delete-link-text').text(chrome.i18n.getMessage('delete'));
        this.$('.favorites-text').text(chrome.i18n.getMessage('add_to_favorites'));
        this.$('.replace-song-text').text(chrome.i18n.getMessage('renew'));

        var songHeight = this.$el.height();
        var $optionsMenu = this.$('table.my-options');
        if (songHeight > 44) $optionsMenu.height(68);

        return;
      }
    },

    onVideoIdChanged: function() {
      var newVideoId = this.model.get('videoId');
      var $songDiv = this.$('.list-group-item');
      $songDiv.attr('id', newVideoId);
    }

  });

  return SongView;
});