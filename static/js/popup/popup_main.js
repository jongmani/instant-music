require.config({
  paths: {
    jquery: '/static/js/lib/jquery/jquery-2.1.0.min',
    underscore: '/static/js/lib/underscore/underscore-min',
    backbone: '/static/js/lib/backbone/backbone-min',
    backboneLocalStorage: '/static/js/lib/backbone/backbone.localStorage',
    text: '/static/js/lib/requirejs/text/text',
    slider: '/static/js/lib/slider/bootstrap-slider',
    bootstrap: '/static/js/lib/bootstrap/js/bootstrap.min'
  }
});

define([
  'jquery',
  'underscore',
  'backbone',
  'views/popup',
  'views/playlist',
  'models/popup'
], function($, _, Backbone, PopupView, PlaylistView, PopupModel) {
  var popupModel = new PopupModel();
  window.popupView = new PopupView({model: popupModel});
  addEventListener("unload", function (event) {
    popupModel.destroy();
    popupView.remove();
  }, true);
});