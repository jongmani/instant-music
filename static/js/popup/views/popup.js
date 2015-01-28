define([
  'jquery',
  'underscore',
  'backbone',
  'bootstrap',
  'slider',
  'models/popup',
  'views/playlist',
  'text!/templates/popup_template.html'
], function($, _, Backbone, Bootstrap, Slider, PopupModel, PlaylistView, popupHTML){
  var Playlist;
  var playerWrapper;
  var youtubePlayer;

  var PopupView = Backbone.View.extend({
    popupTemplate: _.template(popupHTML),
    el: '#main-container',
    events: {
      'click #play-button': 'play',
      'click #pause-button': 'pause',
      'click #next-button': 'playNext',
      'click #prev-button': 'playPrev',
      'click #caret-down': 'expandPlaylist',
      'click #loop-button': 'toggleLoop',
      'click #shuffle-button': 'toggleShuffle',
      'click .requested-songs-button': 'loadNewSongs',
      'click .genre-submenu': 'loadNewSongs',
      'click #billboard': 'changePlaylist',
      'click #melon': 'changePlaylist',
      'click #itunes': 'changePlaylist',
      'click #myself': 'setupPersonalPlaylist',
      'click #open-favorites': 'setupPersonalPlaylist',
      'click #restart-yes': 'refreshApp'
    },

    // Everytime a popup is opened, the view should gather information
    // from background (what song is playing, its status, etc.) and initialize.
    // Songs has a separate view for itself. Other than that, everything
    // is populated at this step.
    // If the user opens popup before background page is ready, the initialize
    // process aborts. When OnPlayerReady event fires from background page,
    // it will be restarted manually.
    initialize: function() {
      window.userLocale = chrome.i18n.getMessage("@@ui_locale");
      // If background is not ready, abort initializing
      var bg = chrome.extension.getBackgroundPage();

      Playlist = bg.Playlist;
      playerWrapper = bg.playerWrapper;
      if (playerWrapper) {
        youtubePlayer = playerWrapper.get('player');
      }

      if (!youtubePlayer || typeof youtubePlayer.getDuration !== 'function') {
        return;
      }

      //Render
      this.render();

      this.playlistView = new PlaylistView({ model: Playlist });
      this.listenTo(Playlist, 'change:loopActive', function() {
        $('#loop-button').toggleClass('fa-spin', Playlist.get('loopActive'));
      });
      this.listenTo(Playlist.get('songs'), 'add', function (song) {
        this.$('#info-bar').empty().fadeIn(1000).prepend("<span class='info-msg'>"+chrome.i18n.getMessage('added_to_favorites')+"</span>").fadeOut(1000);
      });
      this.listenTo(Playlist, 'change:musicChart', function (playlist) {
        var chartName = playlist.get('musicChart').source;
        $('.language-button').removeClass('selected');
        $('#'+chartName).parent().addClass('selected');
      });

      this.listenTo(playerWrapper, 'playing', function () {
        this.updateCurrentSongInfo(Playlist.get('currentSong'));
      });

      // Highlight appropriate music charts
      var musicChartSource = Playlist.get('musicChart').source;
      $('#'+musicChartSource).parent().addClass('selected');

      // Populate genre options on top right
      // FIXME: should be refactored
      this.populateGenres();
      
      // this should be refactored too.
      var currentSong = Playlist.get('currentSong');
      if (currentSong) {
        this.updateCurrentSongInfo(currentSong);
      }

      // Construct a time slider and tell background to
      // start listening to YouTube time update events
      this.setSlider();
      bg.playerWrapper.startSlider();

      // Move the slider handle to the right position
      this.moveSlider(youtubePlayer.getCurrentTime());

      // Create a volume slider and register its events
      var volume = youtubePlayer.getVolume();
      // Check if volume slider has already been created
      if (!$('#volume-slider').hasClass('slider-vertical')) {
        $('#volume-slider').slider({
          id: "volume-slider",
          min: 0,
          max: 100,
          reversed: true,
          value: (typeof volume !== 'undefined') ? volume : 100, 
          orientation: "vertical",
          tooltip: "hide"
        }).on('slide', function (e) {
          youtubePlayer.setVolume(e.value);
        });

        // If user hovers on volume icon and its children, the slider will appear
        $('#volume-button, #volume-mute-button, #volume-slider')
          .mouseenter(function () {
            $('#volume-slider').show();
          })
          .mouseleave(function () {
            $('#volume-slider').hide();
          }
        );
      }
      $('#volume-button, #volume-mute-button').click(function () {
        $(this).toggle();
        if ($('#volume-button')[0] == this) {
          // Mute
          youtubePlayer.mute();
          $('#volume-slider .slider-track').addClass('mute');
          $('#volume-mute-button').toggle();
          $('#volume-mute-button').css('display', 'inline-block');
        } else {
          // Unmute
          youtubePlayer.unMute();
          $('#volume-slider .slider-track').removeClass('mute');
          $('#volume-button').toggle();
        }
      });

      // Highlight appropriate numSongs link on right top
      // ex) if numSongs = 10, add class 'selected' to 10
      var numSongs = Playlist.get('numSongs');
      _.find($('.requested-songs-button'), function (e) {
        if ($(e).text().split(' ')[0] == numSongs)
          return $(e).addClass('selected');
      });

      // Check if mute and show the right icon
      if (youtubePlayer.isMuted()) {
        $('#volume-slider .slider-track').addClass('mute');
        $('#volume-button').hide();
        $('#volume-mute-button').show();
        $('#volume-mute-button').css('display', 'inline-block');
      }

      // Check if Shuffle and show the right icon
      $('#shuffle-button').toggleClass('active-shuffle', Playlist.get('shuffleActive'));
      $('#loop-button').toggleClass('fa-spin', Playlist.get('loopActive'));

      window.addEventListener('online', function (e) {
        // Close the popup when the internet connection comes back,
        // so background can reinitialize well
        window.close();
        return;
      });

    }, // end of Init

    render: function() {
      this.$el.html(this.popupTemplate());
      return this;
    },

    play: function (e) {
      $(e.target).toggle();
      $('#pause-button').toggle();
      console.log("play button")
      youtubePlayer.playVideo();
    },

    pause: function (e) {
      $(e.target).toggle();
      $('#play-button').toggle();
      youtubePlayer.pauseVideo();
    },

    playPrev: function() {
      youtubePlayer.playPrevSong();
    },

    // When reached the end of playlist, we automatically play the first song
    // When (isLoopActive), playNext() replays the current song
    // When (isShuffleActive), playNext() plays a randomly selected song from the list
    playNext: function() {
      var bg = chrome.extension.getBackgroundPage();
      youtubePlayer.playNextSong();
    },

    expandPlaylist: function() {
      $('#expanded-container').toggle();
    },

    showVolume: function() {
      $('#volume-slider').show();
    },

    hideVolume: function() {
      $('#volume-slider').hide();
    },

    // Show song title, artist, endingTime
    updateCurrentSongInfo: function (song) {
      $('.song-info').text(song.get('title'));
      $('.artist-info').text(song.get('artist'));
      var bg = chrome.extension.getBackgroundPage();
      var endingTime = youtubePlayer.getDuration();
      var slider = this.model.get('slider');
      if (slider) {
        slider.slider('setAttribute', 'max', endingTime);
        //console.log("popupView: set slider max to: "+endingTime);
      }
      $('#ending-time').text(this.secondConverter(endingTime));
      // FIXME: play button should be changed based on the change:attribute event
      // from the player
      if (youtubePlayer.getPlayerState() == 1) {
        $('#play-button').hide();
        $('#pause-button').show();
      }
    },

    // Construct a slider.
    // If current ending time is not available because song is not loaded to player yet,
    // just set the value as 100 so it seems like the slider is ready to user
    setSlider: function() {
      var bg = chrome.extension.getBackgroundPage();
      var slider = this.model.get('slider');
      if (slider) {
        return;
      }

      var endingTime = youtubePlayer.getDuration();
      slider = $('.slider').slider({ 
        "id": "progress-slider", 
        "tooltip": 'hide', 
        "value": "0",
        "max": (endingTime) ? endingTime : 100 // if endingTime == 0, NaN or undefined, init with 100
      });
      
      this.model.set('slider', slider);

      // attach events
      $('.slider-handle, .slider-track').mousedown(function (e) {
        bg.stopSlider();
      });
      $(slider).bind('slideStop', function (e) {
        youtubePlayer.seekTo(slider.slider('getValue'));
      });
    },

    toggleLoop: function (e) {
      Playlist.set('loopActive', !Playlist.get('loopActive'));
    },

    toggleShuffle: function (e) {
      var bg = chrome.extension.getBackgroundPage();
      Playlist.set('shuffleActive', !Playlist.get('shuffleActive'));
      $(e.target).toggleClass('active-shuffle');
    },

    // Load new songs from Billboard and YouTube
    // This is called when a genre changes or new numSongs has been set
    loadNewSongs: function (e) {
      var self = this;
      var bg = chrome.extension.getBackgroundPage();
      var genre;
      var numSongs;
      // User set a different locale for the playlist (also the music chart's source)

      if (e == "calledFromChangePlayList") {
        $('.many-songs').hide();

      // User set a new number of songs to be loaded
      } else if (isFinite($(e.target).text().split(' ')[0])) {
        numSongs = $(e.target).text().split(' ')[0];
        Playlist.set('numSongs', numSongs);
        $('.requested-songs-button').removeClass('selected');
        $(e.target).parent().addClass('selected');
      
      // User set a new genre for the playlist
      } else {
        $('.many-songs').hide();
        genre = $(e.target).text().split(' ')[0];
        Playlist.set('genre', genre);
        $('.genre-submenu').removeClass('selected');
        $(e.target).parent().addClass('selected');
        $('button#current-genre').text(genre);
      }

      genre = genre || Playlist.get('genre');
      numSongs = numSongs || Playlist.get('numSongs');
      
      //CHECK: FIXED ON FLIGHT
      var musicChartSource = Playlist.get('musicChart').source;
      if (musicChartSource == 'billboard' && genre == chrome.i18n.getMessage("j_pop")) {
        $('li.100-songs').hide();
        $('li.50-songs').show();
      } else if (musicChartSource == 'billboard' && (genre == chrome.i18n.getMessage("electronic") || genre == chrome.i18n.getMessage("club") || genre == chrome.i18n.getMessage("rock"))) {
        $('li.100-songs').hide();
        $('li.50-songs').hide();
        $('li.25-songs').show();
        if (numSongs > 25) {
          numSongs = 25;
          Playlist.set('numSongs', numSongs);
          $('.requested-songs-button').removeClass('selected');
          $('li.25-songs').addClass('selected');
        }
      } else if (musicChartSource == 'billboard' && genre == chrome.i18n.getMessage("rap")) {
        $('li.100-songs').hide();
        $('li.50-songs').hide();
        $('li.25-songs').hide();
        numSongs = 10;
        Playlist.set('numSongs', numSongs);
        $('.requested-songs-button').removeClass('selected');
        $('li.10-songs').addClass('selected');
      } else {
        $('li.requested-songs-button').show();
      }

      // Is it okay for a view to call some function that's in a model?
      Playlist.getNewSongs(function() {
        //self.playlistView.initialize()
        //self.playlistView.remove();
        //self.playlistView = new PlaylistView({ model: Playlist });
        self.playlistView.renderSongs();
        self.setProgress(100);
      }, genre, numSongs);
    },

    // Populate genres on right top
    populateGenres: function (options) {
      $('ul#genre-container').empty();
      var chart = Playlist.get('musicChart').chart;
      $.each(chart, function (idx, el) {
        var item = $("<li class='genre-submenu'><a href='#'>"+el.genre+"</a></li>");
        $('ul#genre-container').append(item);
      });

      if (userLocale == "ja" || userLocale == 'ja-jp') {
        $('ul#genre-container').css('font-size', '0.7em');
      }

      if (options) { // options indicate that type of music chart was changed
        // so we need to set a new genre manually
        var newGenre = chart[0].genre;
        Playlist.set('genre', newGenre);
      }

      var currentGenre = Playlist.get('genre');
      $('button#current-genre').text(currentGenre);
      _.find($('.genre-submenu'), function (e) {
        if ($(e).text().split(' ')[0] == currentGenre)
          return $(e).addClass('selected');
      });
    },

    // Set progress. When progress is 100%, make it disappear smoothly
    setProgress: function (progressInPercent) {
      //console.log('set progerss called: '+progressInPercent);
      $('#status-bar').show();
      $('.progress-bar').css('width', progressInPercent+'%');
      if (progressInPercent == 100) {
        $('#expanded-container').fadeOut(200).fadeIn(200);
        $('#status-bar').fadeOut(1000);
      }
    },

    hideProgressBar: function() {
      $('#status-bar').hide();
    },

    // Move slider to the song's current time
    moveSlider: function (currentTime) {
      var slider = this.model.get('slider');
      if (!slider || typeof currentTime === 'undefined') {
        return;
      }
      slider.slider('setValue', currentTime);
      $('#elapsed-time').text(this.secondConverter(parseInt(currentTime)));
    },

    // Convert seconds into hh:mm:ss format and return a string
    secondConverter: function (seconds) {
      seconds = parseInt(seconds);
      if (seconds < 10) return '0:0'+seconds;
      else if (seconds < 60) return '0:'+seconds; 
      var hrs = 0;
      var mins = 0;
      if (seconds >= 3600) {
        hrs = Math.floor(seconds / 3600);
        seconds %= 3600;
      }
      if (seconds >= 60) {
        mins = Math.floor(seconds / 60);
        seconds = parseInt(seconds % 60);
      }
      hrs = (hrs < 10 ? "0"+hrs : ""+hrs);
      mins = (mins < 10 ? "0"+mins : ""+mins);
      seconds = (seconds < 10 ? "0"+seconds : ""+parseInt(seconds));
      if (parseInt(hrs)) return hrs+':'+mins+':'+seconds;
      else if (parseInt(mins)) return mins+':'+seconds;
    },

    // Change playlist to a different locale and a music chart
    // (Billboard to Melon, Melon to Billboard)
    changePlaylist: function (e) {
      $('.language-button').removeClass('selected');
      $(e.target).parent().addClass('selected');
      var chartName = $(e.target).text();
      var locale = (chartName == chrome.i18n.getMessage("melonChart")) ? "ko" : "en";
      var bg = chrome.extension.getBackgroundPage();
      if (Playlist) {
        if (locale == "ko") 
          Playlist.set('genre', chrome.i18n.getMessage("k_pop_new"));
        else 
          Playlist.set('genre', chrome.i18n.getMessage("pop"));

        Playlist.setMusicChart(chartName); // this is different from setting an attribute
      }

      this.populateGenres("musicChartChanged");
      this.loadNewSongs("calledFromChangePlayList")
    },

    setupPersonalPlaylist: function (e) {
      $('.language-button').removeClass('selected');
      $(e.target).parent().addClass('selected');
      
      Playlist.setMusicChart();
      this.populateGenres("musicChartChanged");
      Playlist.get('songs').reset();

      //this.playlistView.initialize();
      
      this.playlistView.renderSongs();
      $('li.requested-songs-button').hide();
      $('li.many-songs').show();
      this.setProgress(100); // FIXME: this should be called automatically by views that watch models
    },

    showErrorMessage: function (msg) {
      // FIXME: this should be done via triggering event and by Popup model
      $('.music-info').text(msg);
      $('.music-info').fadeOut(2000);
    },

    refreshApp: function() {
      window.close();
      chrome.runtime.reload();
    }
  });

  return PopupView;
});
