define([
  'jquery',
  'underscore',
  'backbone',
  'bootstrap',
  'slider',
  'models/popup'
], function($, _, Backbone, Bootstrap, Slider, PopupModel){

  var SliderView = Backbone.View.extend({

    tagName: "li",

    className: "document-row",

    events: {
      "click .icon":          "open",
      "click .button.edit":   "openEditDialog",
      "click .button.delete": "destroy"
    },

    initialize: function() {
      this.listenTo(this.model, "change", this.render);
    },

    render: function() {
      //
    }

  });

});