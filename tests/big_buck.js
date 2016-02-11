var ChromecastAPI = require('../index.js')

var devices = []

var browser = new ChromecastAPI.Browser()

console.log('Searching for devices')

browser.on('deviceOn', function (device) {
	if (devices.indexOf(device.host) >= 0) {
		return console.log('Also found this chromecast: %s',  device.host)
	}
	devices.push(device.host)
	
	device.play('http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4', 60, function () {
		
		console.log('Playing in your chromecast: %s', device.config.name)

		setTimeout(function () {
			device.pause(function () {
				console.log('Paused')
			})
		}, 30000)

		setTimeout(function () {
			device.stop(function () {
				console.log('Stopped')
			})
		}, 40000)

	})
})