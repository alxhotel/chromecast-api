/**
 * Test for device and connection reuse.
 * Recommended to be run with DEBUG=castv2 to see underlying protocol communication.
 */

var ChromecastAPI = require('../index.js')

var browser = new ChromecastAPI.Browser()

var media = {
	url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
	cover: {
		title: 'Big Bug Bunny',
		url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
	}
}

function testCast(device, media) {
	device.play(media, 0, function () {
		console.log('Playing in your chromecast')

		setTimeout(function () {
			device.stop(function (err, status) {
				console.log('Device stopped')
				setTimeout(function () {
					device.play(media, 0, function(){
						console.log('Reconnected and playing :)')
					})
				}, 5000)
			})
		}, 10000)
	})
}

console.log('Searching for devices')

browser.on('deviceOn', function (device) {
	testCast(device, media)
})