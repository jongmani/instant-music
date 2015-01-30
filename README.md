Instant Music
=========

What is Instant Music?
-------------
Instant Music is a chrome extension that lets you listen to mainstream music in your favorite genre without having to open another heavy music player. You don't even need to come up with your own playlist because Instant Music automatically pulls famous music charts from iTunes, BillBoard, and Melon, and plays songs using YouTube videos as source. If there is any song you wish to play, you can search for it by the song's title and the artist's name, and watch it appears in your playlist instantly. And yes, of course you can create your own playlists too.

<div style="text-align:center"><a href="https://www.youtube.com/watch?v=CNTgTXFrTuY
" target="_blank"><img src="http://i.imgur.com/wZJaUzp.png" 
alt="Instant Music" width="600" height="400" /></a></div>

Download: (Chrome Webstore)[https://chrome.google.com/webstore/detail/instant-music/ehebnoicojclpjjblbacdjmpjpkocmml]

Contributing
============

Contributing to Instant Music is extremely easy because of the nature of a chrome extension. The backend is already taken care of, and all there is to care about is the frontend. The bugs usually stem from silent patches from YouTube or slight link modifications of music charts and other API's. I built Instant Music when I knew nothing about Backbone.js.

Libraries/frameworks used
------
* HTML, JavaScript, CSS
* Backbone.js, require.js, underscore.js
* Bootstrap, FlatUI
* YouTube IFrame API
* YouTube Data API (v3)
* Melon Chart API

Setting up development environment
-------------
1. Fork this repository.
2. In your favorite directory, clone the forked repo
```sh
$ git clone https://github.com/[your_github_handle]/instant-music.git
```
3. If you find a bug, [post it as an issue](https://github.com/woniesong92/instant-music/issues/new). You can work on any of the existing issues too.
4. Fix the bug. When you think you have fixed the bug, run manual tests until you are confident that your patch works. Then commit it and push it to your repo.
```sh
$ git add .
$ git commit -m 'fixed bug for the issue #32'
$ git push origin master
```
5. Go to your forked repository and submit a pull request.
6. The pull request goes under review and when everything seems suitable, it will be deployed.