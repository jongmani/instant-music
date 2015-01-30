define([
  // These are path alias that we configured in our bootstrap
  'jquery',     // lib/jquery/jquery
  'backbone',
  '../../common/models/song',
  '../collections/songs'
], function($, Backbone, Song, Songs){
  'use strict';
  var YOUTUBE_API_KEY = "AIzaSyCcNCtcaV7OSajn9PAzXS3Nh9XVNunkDKI";
  window.AVAILABLE_CHARTS = {
    melonChart: {
      source: "melon",
      chart: [
        {genre: chrome.i18n.getMessage("k_pop_trending"), url: "http://api.instantmusicapp.com/charts/realtime?version=1&page=1&count="},
        {genre: chrome.i18n.getMessage("k_pop_new"), url: "http://api.instantmusicapp.com/newreleases/songs?version=1&page=1&count="},
        {genre: chrome.i18n.getMessage("k_pop_ost"), url: "http://api.instantmusicapp.com/charts/topgenres/DP0300?version=1&page=1&count="},
        {genre: chrome.i18n.getMessage("pop_trending"), url: "http://api.instantmusicapp.com/charts/topgenres/DP0200?version=1&page=1&count="},
        {genre: chrome.i18n.getMessage("j_pop_trending"), url: "http://api.instantmusicapp.com/charts/topgenres/DP0400?version=1&page=1&count="},
        {genre: chrome.i18n.getMessage("classic"), url: "http://api.instantmusicapp.com/charts/topgenres/DP0500?version=1&page=1&count="},
        {genre: chrome.i18n.getMessage("newage"), url: "http://api.instantmusicapp.com/charts/topgenres/DP0800?version=1&page=1&count="},
        {genre: chrome.i18n.getMessage("jazz"), url: "http://api.instantmusicapp.com/charts/topgenres/DP0900?version=1&page=1&count="},
      ]
    },
    billboardChart: {
      source: "billboard",
      chart: [
        {genre: chrome.i18n.getMessage("pop"), url: 'http://www.billboard.com/rss/charts/hot-100'},
        {genre: chrome.i18n.getMessage("rap"), url: "http://www.billboard.com/rss/charts/rap-song"},
        {genre: chrome.i18n.getMessage("electronic"), url: "http://www.billboard.com/rss/charts/dance-electronic-songs"},
        {genre: chrome.i18n.getMessage("club"), url: "http://www.billboard.com/rss/charts/dance-club-play-songs"},
        {genre: chrome.i18n.getMessage("rock"), url: "http://www.billboard.com/rss/charts/rock-songs"},
      ]
    },
    itunesChart: {
      source: "itunes",
      chart: [
        {genre: chrome.i18n.getMessage("us_pop"), url: 'https://itunes.apple.com/us/rss/topsongs/limit='},
        {genre: chrome.i18n.getMessage("uk_pop"), url: 'https://itunes.apple.com/gb/rss/topsongs/limit='},
        {genre: chrome.i18n.getMessage("k_pop"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=51/limit='},
        {genre: chrome.i18n.getMessage("j_pop"), url: 'https://itunes.apple.com/jp/rss/topsongs/limit='},
        {genre: chrome.i18n.getMessage("hiphop"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=18/limit='},
        {genre: chrome.i18n.getMessage("RnB"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=15/limit='},
        {genre: chrome.i18n.getMessage("electronic"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=7/limit='},
        {genre: chrome.i18n.getMessage("jazz"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=11/limit='},
        {genre: chrome.i18n.getMessage("songwriter"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=10/limit='},
        {genre: chrome.i18n.getMessage("classic"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=5/limit='},
        {genre: chrome.i18n.getMessage("reggae"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=24/limit='},
        {genre: chrome.i18n.getMessage("country"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=6/limit='},
        {genre: chrome.i18n.getMessage("easy"), url: 'https://itunes.apple.com/us/rss/topsongs/genre=25/limit='},
      ]
    },
    myChart: {
      source: "myself",
      chart: [
        {genre: chrome.i18n.getMessage("mixed"), url: null}
      ]
    }
  };

  var Playlist = Backbone.Model.extend({
    defaults: {
      currentSong: null,
      nextSong: null,
      prevSong: null,
      genre: null, // initial genre
      loopActive: false,
      shuffleActive: false,
      numSongs: 10, // initial number of songs loaded
      musicChart: null
    },

    initialize: function() {
      // Setting collections/songs as its attribute
      var songs = new Songs();
      this.set('songs', songs);

      var userLocale = chrome.i18n.getMessage("@@ui_locale");
      if (userLocale == "ko" || userLocale == 'ko-kr') {
        this.set('musicChart', window.AVAILABLE_CHARTS.melonChart);
        this.set('genre', this.get('musicChart').chart[0].genre);
      } else if (userLocale == "ja" || userLocale == 'ja-jp') {
        this.set('musicChart', window.AVAILABLE_CHARTS.itunesChart);
        this.set('genre', chrome.i18n.getMessage("j_pop"));
      } else {
        this.set('musicChart', window.AVAILABLE_CHARTS.itunesChart);
        this.set('genre', this.get('musicChart').chart[0].genre);
      }
    },

    searchForSongsToReplace: function() {
      // var youtubeAPIKey = "AIzaSyCmQLZDb4uEZWr3tocvueKi6XjAyBXsdEI"; This is key compromised!!
      var youtubeAPIKey = YOUTUBE_API_KEY;
      var initialSearchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&maxResults=10&videoEmbeddable=true";
      var searchUrl = initialSearchURL + "&key=" + youtubeAPIKey;
    },

    // If loop is active, getNextSong repeats the current song
    // If shuffle is active, getNextSong plays a random song from Songs
    getNextSong: function() {
      var songs = this.get('songs');
      var idx = songs.indexOf(songs.findWhere({ title: this.get('currentSong').get('title') }));
      if (this.get('loopActive')) {
        return songs.at(idx);
      }
      if (this.get('shuffleActive')) {
        var randomIndex = Math.floor((Math.random()*songs.length));
        return songs.at(randomIndex);
      }
      if (idx != songs.length-1) return songs.at(idx+1);
      else return songs.at(0);
    },

    getPrevSong: function() {
      var songs = this.get('songs');
      var idx = songs.indexOf(songs.findWhere({ title: this.get('currentSong').get('title') }));
      if (idx !== 0) return songs.at(idx-1);
      else return songs.at(songs.length-1);
    },

    // Get new songs from Billboard Chart
    // First parse the top <numSongs> from the selected <genre>
    // from Billboard, and then use YouTube gdata api to fetch
    // the songs.
    getNewSongs: function (callback, genre, numSongs) {
      // FIXME: just trigger progress
      var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
      if (popupWindow && popupWindow.popupView) popupWindow.popupView.setProgress(10);
      var playlist = this;
      playlist.get('songs').reset();
      // Inspect Billboard Chart to find pop songs
      var youtubeAPIKey = YOUTUBE_API_KEY;
      //var initialSearchURL = "https://www.googleapis.com/youtube/v3/search?part=id&type=video&order=relevance&safeSearch=strict&videoSyndicated=true&maxResults=1&videoEmbeddable=true";
      var initialSearchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&maxResults=1&videoEmbeddable=true";
      var searchUrl = initialSearchURL + "&key=" + youtubeAPIKey;
      var ajaxCount = 0;
      var musicChart = this.get('musicChart');
      var chartSource = musicChart.source;
      var url;

      // Find the url to get the songs from
      $(musicChart.chart).each(function (idx, genrePair) {
        if (genrePair.genre == genre) {
          url = genrePair.url;
          return false;
        }
      });

      if (chartSource == "melon") { // Melon charts
        $.ajax({
          type: "GET",
          url: url+numSongs,
          success: function (data) {
            if (popupWindow && popupWindow.popupView) popupWindow.popupView.setProgress(30);
            //var songs = data.melon.songs;
            var songs = data.melon.songs.song;
            $(songs).each(function (idx, song) {
              var title = song.songName;
              //var artist = song.artists[0].artistName;
              var artist = song.artists.artist[0].artistName;
              var rank = song.currentRank ? song.currentRank : idx+1;
              var query = title + " " + artist;
              _searchYouTube(title, artist, rank, query, numSongs);
            }); // finished iterating songs
          }, // success
          error: function () {
            var errorMessage = chrome.i18n.getMessage("try_different_chart");
            if (popupWindow && popupWindow.popupView) popupWindow.popupView.showErrorMessage(errorMessage);
            return;
          }
        });
      } else if (chartSource == "billboard") {
        $.get(url, function (data) {
          var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
          if (popupWindow && popupWindow.popupView) popupWindow.popupView.setProgress(30);
          var items = $(data).find("item");
          items = items.slice(0, numSongs);
          var numAvailableSongs = items.length;
          $(items).each(function (idx, item) {
            var title = $(item).find("title").text();
            title = title.substring(title.indexOf(":")+2);
            var artist = $(item).find("artist").text();
            var rank = $(item).find("rank_this_week").text();
            var query = title + " " + artist;
            _searchYouTube(title, artist, rank, query, numAvailableSongs);
          });
        });
      } else {
        $.get(url+numSongs+'/explicit=true/xml', function (data) {
          var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
          if (popupWindow && popupWindow.popupView) popupWindow.popupView.setProgress(30);
          var $feed = $(data).find('feed');
          var $entries = $feed.find('entry');
          var numAvailableSongs = $entries.length;
          $entries.each(function (idx, entry) {
            var title_artist_pair = $(entry).find('title')[0].innerHTML;
            var title = $.trim(title_artist_pair.split(' - ')[0]);
            var artist = $.trim(title_artist_pair.split(' - ')[1]);
            var rank = idx+1;
            var query = title + " " + artist;
            _searchYouTube(title, artist, rank, query, numAvailableSongs);
          });
          return;
        });
      }

      function _searchYouTube (title, artist, rank, query, numAvailableSongs) {
        var songs = playlist.get('songs');
        var videoId;

        $.ajax({
          url: searchUrl,
          type: "GET",
          data: 'q='+encodeURIComponent(query),
          success: function (result) {
            ajaxCount += 1;

            if (result.items.length)
              videoId = result.items[0].id.videoId;
            else 
              videoId = null; // Cannot find the song on YouTube

            var song = new Song({
              title: title,
              artist: artist,
              rank: parseInt(rank),
              query: query,
              videoId: videoId
            });

            console.log(title, videoId);
            
            // Insert songs into the playlist in the order of their ranks
            // *Note: Songs that do not exist on YouTube are ignored
            if (videoId) songs.add(song, { silent: true });

            // All the ajax calls are finished
            if (ajaxCount == numAvailableSongs) {
              var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
              if (popupWindow && popupWindow.popupView) popupWindow.popupView.setProgress(70);
              songs.comparator = 'rank';
              songs.sort();
              // Remove useless playlsit methods
              if (!playlist.get('currentSong')) {
                playlist.set('currentSong', songs.at(0));
              }
              callback();
            }
          },
          error: function () {
            ajaxCount += 1;
            if (ajaxCount == numAvailableSongs) {
              var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
              if (popupWindow) popupWindow.popupView.setProgress(70);
              if (!playlist.get('currentSong')) {
                playlist.set('currentSong', songs.at(0));
              }
              callback();
            }
          } // end of error
        }); // end of second ajax
      } // end of _searchYouTube()
    },

    lookUpAndAddSingleSong: function (query) {
      var playlist = this;
      var youtubeAPIKey = YOUTUBE_API_KEY;
      var initialSearchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&maxResults=1&videoEmbeddable=true";
      var searchUrl = initialSearchURL + "&key=" + youtubeAPIKey;
      var videoId;
      var song;
      $.ajax({
        url: searchUrl,
        type: "GET",
        data: 'q='+encodeURIComponent(query),
        success: function (result) {
          if (result.items.length) {
            videoId = result.items[0].id.videoId;
            song = new Song({ // FIXME: it might be better to keep it as "var song"
              title: result.items[0].snippet.title,
              query: query,
              videoId: videoId
            });
          } else videoId = null; // Cannot find the song on YouTube
          
          if (videoId) {
            playlist.get('songs').add(song);
            song.save(); // save to localStorage
          }
        }, error: function () {
          var errorMessage = "lookUpAndAddSingleSong error: check http://instantmusicapp.com";
          var popupWindow = chrome.extension.getViews({ type: "popup" })[0];
          if (popupWindow && popupWindow.popupView) popupWindow.showErrorMessage(errorMessage);
          return;
        }
      });
    },

    setMusicChart: function (chartName) {
      if (chartName) {
        if (chartName == chrome.i18n.getMessage("melonChart"))
          this.set('musicChart', window.AVAILABLE_CHARTS.melonChart);
        else if (chartName == chrome.i18n.getMessage("billboardChart"))
          this.set('musicChart', window.AVAILABLE_CHARTS.billboardChart);
        else
          this.set('musicChart', window.AVAILABLE_CHARTS.itunesChart);
      // else, the user is looking for a personal favorite chart
      } else {
        this.set('musicChart', window.AVAILABLE_CHARTS.myChart);
      }
    },
  });
  return Playlist;
});
