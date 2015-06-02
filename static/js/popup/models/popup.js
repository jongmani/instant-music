define([
  'jquery',
  'backbone',
], function($, Backbone){
  var PopupModel = Backbone.Model.extend({
    defaults: {
      slider: null
    },
    initialize: function() {},
    saveRemotePlaylist: function(songs_arr) {

      chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
        $.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token='+token, function (data) {
          var owner = data.email;
          if (owner) {
            var params = {"songs_arr": JSON.stringify(songs_arr), "owner": owner};
            $.post("http://localhost:5000/save_playlist", params, function(data) {
              console.log("Successfully saved a playlist!");
            });
          }
        });
      });

      // var params = {"songs_arr": JSON.stringify(songs_arr), "owner": "woniesong92@cornell.edu"};
      // $.post("http://instantmusic.cloudapp.net/api/save_playlist", songs, function(data) {
      // $.post("http://localhost:5000/save_playlist", params, function(data) {
      //   console.log("Successfully saved a playlist!");
      // });
    },
    getRemotePlaylist: function(callback) {
      // if the user is logged in, get his playlist from DB
      chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
        $.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token='+token, function (data) {
          var owner = data.email;
          if (owner) {
            $.get("http://localhost:5000/get_playlist?owner="+owner, function(songs_arr) {
              if (!_.isEmpty(songs_arr)) {
                callback(JSON.parse(songs_arr));
              } else {
                callback(null)
              }
            })
          }
        });
      });
    }
  });
  return PopupModel;
});