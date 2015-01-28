define([
  // These are path alias that we configured in our bootstrap
  'jquery',
  'underscore',
  'backbone',
  'backboneLocalStorage',
  '../../common/models/song',
], function($, _, Backbone, LocalStorage, Song){
  var Songs = Backbone.Collection.extend({
    model: Song,
    localStorage: new LocalStorage('songs-backbone'),
    slider: null, // bootstrap-slider object
    comparator: 'rank',

    initialize: function() {
      //console.log("collection/Songs initilize()");
    },
  });

  return Songs;
});
