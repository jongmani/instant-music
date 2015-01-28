require.config({
  paths: {
    jquery: '/static/js/lib/jquery/jquery-2.1.0.min',
    underscore: '/static/js/lib/underscore/underscore-min',
    backbone: '/static/js/lib/backbone/backbone',
    backboneLocalStorage: '/static/js/lib/backbone/backbone.localStorage',
    text: '/static/js/lib/requirejs/text/text',
    slider: '/static/js/lib/slider/bootstrap-slider',
    bootstrap: '/static/js/lib/bootstrap/js/bootstrap.min',
    youtubePlayer: '/static/js/lib/youtube/youtubeplayer',
  }
});

require(['background'], function(){
  //console.log("background ready")
});
