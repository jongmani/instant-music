define([
  'jquery',
  'backbone',
], function($, Backbone){
  var PopupModel = Backbone.Model.extend({
    defaults: {
      slider: null
    },
    initialize: function() {}
  });
  return PopupModel;
});