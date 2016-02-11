/**
 * Test for all device calls.
 * Recommended to be run with DEBUG=castv2 to see underlying protocol communication.
 */

var ChromecastAPI = require('../index.js')

var browser = new ChromecastAPI.Browser()

console.log('Searching for devices')

browser.on('status', function (status) {
	console.log('Status: ', status)
})

var media = {
	url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
	 subtitles: [{
        language: 'en-US',
        url: 'http://carlosguerrero.com/captions_styled.vtt',
        name: 'English'
    },
    {
        language: 'es-ES',
        url: 'http://carlosguerrero.com/captions_styled_es.vtt',
        name: 'Spanish'
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
	device.play(media, 0, function () {

		console.log('Playing in your chromecast')

		setTimeout(function () {
			console.log('Lowering volume')
			device.setVolume(0.25, function (err, newVol) {
				if (err)
					console.log("There was an error changing the volume.")
				else
					console.log('Volume Changed to: ' + newVol.level)
			})
		}, 15000)

		setTimeout(function () {
			console.log('Muting audio')
			device.setVolumeMuted(true, function (err, newVol) {
				if (err)
					console.log("There was an error muting the volume.")
				else
					console.log('NewVol: ', newVol)
			})
		}, 18000)

		setTimeout(function () {
			console.log('Unmuting audio')
			device.setVolumeMuted(false, function (err, newVol) {
				if (err)
					console.log("there was an error muting the volume.")
				else
					console.log('NewVol: ', newVol)
			})
		}, 19500)

		setTimeout(function () {
			console.log('Subtitles off')
			device.subtitlesOff(function (err, status) {
				if (err)
					console.log("Error setting subtitles off...")
				else
					console.log("Subtitles removed")
			})
		}, 20000)

		setTimeout(function () {
			console.log("Restoring audio")
			device.setVolume(0.5, function (err, newVol) {
				if (err)
					console.log("There was an error changing the volume.")
				else
					console.log('Volume Changed to: ' + newVol.level)
			})
		}, 21000)


		setTimeout(function () {
			console.log('Subtitles on')
			device.changeSubtitles(1, function (err, status) {
				if (err)
					console.log("Error restoring subtitles...")
				else
					console.log("Subtitles restored")
			})
		}, 25000)

		setTimeout(function () {
			device.pause(function () {
				console.log('Paused')
			})
		}, 30000)

		setTimeout(function () {
			device.unpause(function () {
				console.log('Unpaused')
			})
		}, 40000)

		setTimeout(function () {
			console.log('English subtitles!')
			device.changeSubtitles(0, function (err, status) {
				if (err)
					console.log("Error restoring subtitles...")
				else
					console.log("English subtitles restored")
			})
		}, 45000)

		setTimeout(function () {
			console.log('Increasing subtitles size...')
			device.changeSubtitlesSize(10, function (err, status) {
				if (err)
					console.log("Error increasing subtitles size...")
				else
					console.log("Subtitles size increased")
			})
		}, 46000)

		setTimeout(function () {
			device.seek(30, function () {
				console.log('Seeking forward')
			})
		}, 50000)

		setTimeout(function () {
			console.log('Decreasing subtitles size...')
			device.changeSubtitlesSize(1, function (err, status) {
				if (err)
					console.log("Error...")
				else
					console.log("Subtitles size decreased")
			})
		}, 60000)

		setTimeout(function () {
			device.pause(function () {
				console.log('Paused')
			})
		}, 70000)

		setTimeout(function () {
			device.seek(30, function () {
				console.log('Seeking forward')
			})
		}, 80000)

		setTimeout(function () {
			device.seek(30, function () {
				console.log('Seeking forward')
			})
		}, 85000)

		setTimeout(function () {
			device.unpause(function () {
				console.log('Unpaused')
			})
		}, 90000)


		setTimeout(function () {
			device.seek(-30, function () {
				console.log('Seeking backwards')
			})
		}, 100000)

		setTimeout(function () {
			device.seekTo(0, function () {
				console.log('Seeking back to start')
			})
		}, 110000)

		setTimeout(function () {
			device.seekTo(300, function () {
				console.log('Seeking to exactly 5 mins')
			})
		}, 120000)

		setTimeout(function () {
			device.getStatus(function (err, status) {
				device.seekTo(status.media.duration - 100, function () {
					console.log('Seeking to 100 sec before end')
				})
			})
		}, 130000)

		setTimeout(function () {
			device.stop(function () {
				console.log('Stopped')
			})
		}, 150000)
		
		//Stop sending heartbeat
		setTimeout(function () {
			device.close(function () {
				console.log('Closed')
			})
		}, 160000)
		
	})
})