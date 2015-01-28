define([
  'jquery',
  'backbone'
], function($, Backbone){
  var Slider = Backbone.Model.extend({
    initialize: function() {},
    defaults: {
      title: '',
      artist: '',
      rank: '',
      query: '',
      videoId: '',
      youtubeIndex: 0,
    }
  });

  return Slider;
});
