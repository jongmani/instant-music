define([
  // These are path alias that we configured in our bootstrap
  'jquery',     // lib/jquery/jquery
  'backbone'    // lib/backbone/backbone
], function($, Backbone){
  'use strict';
  // Above we have passed in jQuery, Underscore and Backbone
  // They will not be accessible in the global scope
  var Song = Backbone.Model.extend({
    initialize: function() {
      //console.log("Song model init");
    },
    defaults: {
      title: '',
      artist: '',
      rank: '',
      query: '',
      videoId: '',
      youtubeIndex: 0,
    },

    searchForSongsToReplace: function() {
      var youtubeAPIKey = "AIzaSyCmQLZDb4uEZWr3tocvueKi6XjAyBXsdEI";
      var initialSearchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&maxResults=10&videoEmbeddable=true";
      var searchUrl = initialSearchURL + "&key=" + youtubeAPIKey;

      $.ajax({
        context: this,
        url: searchUrl,
        type: "GET",
        data: 'q='+encodeURIComponent(this.get('query')),
        success: function (result) {

          if (result.items.length) {
            var prevVideoId = this.get('videoId');
            var currentYoutubeIdx = this.get('youtubeIndex');
            var nextYoutubeIdx = currentYoutubeIdx == result.items.length-1 ? 0 : currentYoutubeIdx+1;
            var newVideoId = result.items[nextYoutubeIdx].id.videoId;
            var newTitle = result.items[nextYoutubeIdx].snippet.title;
            this.set('videoId', newVideoId);
            this.set('youtubeIndex', nextYoutubeIdx);
            if (!this.get('artist')) { // if artist field is blank, song belongs to personal playlist
              this.set('title', newTitle);
              this.save(); // save the change to localStorage
            }

            var bg = chrome.extension.getBackgroundPage();
            if (bg.Songs.getCurrentSong() == this) {
              // if I renewed this song while playing, play the newly found song
              bg.playerWrapper.get('player').loadVideoById(newVideoId);
            }
          }
          
        },
        error: function (error) {
          // FIXME: tell the user to try again
        }
      });
    }
  });

  return Song;
});
