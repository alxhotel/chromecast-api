chromecast-api
=================

chromecast-api is a javascript client library for googlecast's remote playback protocol that uses DefaultMediaReceiver to play any (compatible) content in the Chromecast.

## Installation

From npm:

	npm install chromecast-api 

## Usage

```js
var ChromecastAPI = require('chromecast-api')

var browser = new ChromecastAPI.Browser()

browser.on('deviceOn', function (device) {
	
	var urlMedia = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4';

    device.play(urlMedia, 0, function () {
        console.log('Playing in your chromecast')

		setTimeout(function () {
			//Pause the video
			device.pause(function () {
				console.log('Paused')
			});
		}, 30000)

		setTimeout(function () {
			//Stop video
			device.stop(function () {
				console.log('Stopped')
			});
		}, 40000)

		setTimeout(function () {
			//Close the streaming
			device.close(function () {
				console.log('Closed')
			});
		}, 50000)
    })
})

```

## Subtitles and Cover

To include subtitles and a cover image, use an Object instead of a string in the *play method*:

```js

var ChromecastAPI = require('chromecast-api')

var browser = new ChromecastAPI.Browser()

var media = {
    url : 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
    subtitles: [
	{
        language: 'en-US',
        url: 'http://carlosguerrero.com/captions_styled.vtt',
        name: 'English',
    },
    {
        language: 'es-ES',
        url: 'http://carlosguerrero.com/captions_styled_es.vtt',
        name: 'Spanish',
    }
    ],
    cover: {
        title: 'Big Bug Bunny',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
    },
    subtitles_style: { 
          backgroundColor: '#FFFFFFFF', // see http://dev.w3.org/csswg/css-color/#hex-notation
          foregroundColor: '#000FFFF', // see http://dev.w3.org/csswg/css-color/#hex-notation
          edgeType: 'DROP_SHADOW', // can be: "NONE", "OUTLINE", "DROP_SHADOW", "RAISED", "DEPRESSED"
          edgeColor: '#AA00FFFF', // see http://dev.w3.org/csswg/css-color/#hex-notation
          fontScale: 1.5, // transforms into "font-size: " + (fontScale*100) +"%"
          fontStyle: 'BOLD_ITALIC', // can be: "NORMAL", "BOLD", "BOLD_ITALIC", "ITALIC",
          fontFamily: 'Droid Sans',
          fontGenericFamily: 'CURSIVE', // can be: "SANS_SERIF", "MONOSPACED_SANS_SERIF", "SERIF", "MONOSPACED_SERIF", "CASUAL", "CURSIVE", "SMALL_CAPITALS",
          windowColor: '#AA00FFFF', // see http://dev.w3.org/csswg/css-color/#hex-notation
          windowRoundedCornerRadius: 10, // radius in px
          windowType: 'ROUNDED_CORNERS' // can be: "NONE", "NORMAL", "ROUNDED_CORNERS"
    }
}


browser.on('deviceOn', function (device) {
	// Starting to play Big Buck Bunny exactly in the first minute with example subtitles and cover
	device.play(media, 60, function () {
		console.log('Playing in your chromecast')

		setTimeout(function () {
			console.log('Subtitles off')
			device.subtitlesOff (function(err,status) {
				if(err) console.log("Error")
				console.log("Subtitles removed")
			});
		}, 20000)

		setTimeout(function () {
			console.log('Subtitles on')
			device.changeSubtitles(1, function (err, status) {
				if(err) console.log("Error")
				console.log("Subtitles restored")
			});
		}, 25000)

		setTimeout(function () {
			device.pause(function () {
				console.log('Paused')
			});
		}, 30000)

		setTimeout(function () {
			device.unpause(function () {
				console.log('Resumed')
			});
		}, 40000)

		setTimeout(function () {
			console.log('Change subtitles language')
			device.changeSubtitles(0, function (err, status) {
				if(err) console.log("Error")
				console.log("English subtitles restored")
			});
		}, 45000)

		setTimeout(function () {
			console.log('Increase subtitles size')
			device.changeSubtitlesSize(10, function (err, status) {
				if(err) console.log("Error")
				console.log("Subtitles size increased")
			});
		}, 50000)

		setTimeout(function () {
			device.seek(30,function () {
				console.log('Seeked forward')
			});
		}, 60000)

		setTimeout(function () {
			console.log('Decrease subtitles size')
			device.changeSubtitlesSize(1, function (err, status) {
				if(err) console.log("Error")
				console.log("Subtitles size decreased")
			});
		}, 70000)

	})
}

```

## Misc
This is a fork from chromecast-js