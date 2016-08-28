chromecast-api
=================

[![NPM Version](https://img.shields.io/npm/v/chromecast-api.svg)](https://www.npmjs.com/package/chromecast-api)
[![Travis Build](https://travis-ci.org/alxhotel/chromecast-api.svg?branch=master)](https://travis-ci.org/alxhotel/chromecast-api)

chromecast-api is a javascript client library for googlecast's remote playback protocol to play any (compatible) content in the Chromecast device.

## Installation

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
			})
		}, 20000)

		setTimeout(function () {
			//Stop video
			device.stop(function () {
				console.log('Stopped')
			})
		}, 30000)

		setTimeout(function () {
			//Close the streaming
			device.close(function () {
				console.log('Closed')
			})
		}, 40000)
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
            url: 'https://raw.githubusercontent.com/alxhotel/chromecast-api/master/tests/captions_styled.vtt',
            name: 'English',
        },
        {
            language: 'es-ES',
            url: 'https://raw.githubusercontent.com/alxhotel/chromecast-api/master/tests/captions_styled_es.vtt',
            name: 'Spanish',
        }
    ],
    cover: {
        title: 'Big Bug Bunny',
        url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
    },
    subtitles_style: { 
          backgroundColor: '#FFFFFF00', // see http://dev.w3.org/csswg/css-color/#hex-notation
          foregroundColor: '#FFFFFFFF', // see http://dev.w3.org/csswg/css-color/#hex-notation
          edgeType: 'OUTLINE', // can be: "NONE", "OUTLINE", "DROP_SHADOW", "RAISED", "DEPRESSED"
          edgeColor: '#000000FF', // see http://dev.w3.org/csswg/css-color/#hex-notation
          fontScale: 1.2, // transforms into "font-size: " + (fontScale*100) +"%"
          fontStyle: 'BOLD', // can be: "NORMAL", "BOLD", "BOLD_ITALIC", "ITALIC",
          fontFamily: 'Droid Sans',
          fontGenericFamily: 'SANS_SERIF', // can be: "SANS_SERIF", "MONOSPACED_SANS_SERIF", "SERIF", "MONOSPACED_SERIF", "CASUAL", "CURSIVE", "SMALL_CAPITALS",
          //windowColor: '#00000000', // see http://dev.w3.org/csswg/css-color/#hex-notation
          //windowRoundedCornerRadius: 10, // radius in px
          //windowType: 'ROUNDED_CORNERS' // can be: "NONE", "NORMAL", "ROUNDED_CORNERS"
    }
}

browser.on('deviceOn', function (device) {

    // Starting to play Big Buck Bunny exactly at second #0 with example subtitles and cover
    device.play(media, 0, function () {
        console.log('Playing in your chromecast')

        setTimeout(function () {
            device.subtitlesOff(function (err,status) {
                if (err) console.log('Subtitles off: ERROR')
                else console.log('Subtitles off: SUCCESS')
            })
        }, 20000)

        setTimeout(function () {
            device.changeSubtitles(1, function (err, status) {
                if (err) console.log("Subtitles restored and in spanish: ERROR")
                else console.log("Subtitles restored and in spanish: SUCCESS")
            })
        }, 25000)

        setTimeout(function () {
            device.pause(function () {
                console.log('Paused: SUCCESS')
            })
        }, 30000)

        setTimeout(function () {
            device.unpause(function () {
                console.log('Resumed: SUCCESS')
            })
        }, 40000)

        setTimeout(function () {
            device.changeSubtitles(0, function (err, status) {
                if (err) console.log("Change to english subtitles: ERROR")
                else console.log("Change to english subtitles: SUCCESS")
            })
        }, 45000)

        setTimeout(function () {
            console.log('Increase subtitles size')
            device.changeSubtitlesSize(2, function (err, status) {
                if (err) console.log("Increase subtitles: ERROR")
                else console.log("Increase subtitles: SUCCESS")
            })
        }, 50000)

        setTimeout(function () {
            device.seek(10,function (err) {
                if (err) console.log('Seek forward: ERROR')
                else console.log('Seek forward: SUCCESS')
            })
        }, 60000)

        setTimeout(function () {
            device.changeSubtitlesSize(1.2, function (err, status) {
                if (err) console.log("Decrease subtitles: ERROR")
                else console.log("Decrease subtitles: SUCCESS")
            })
        }, 70000)

    })
})

```

## Credit
This is based on [chromecast-js](https://github.com/guerrerocarlos/chromecast-js) by [@guerrerocarlos](https://github.com/guerrerocarlos)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
