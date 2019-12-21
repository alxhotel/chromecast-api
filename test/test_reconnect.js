/**
 * Test for device and connection reuse.
 */

var ChromecastAPI = require('../index.js')

var client = new ChromecastAPI()

var media = {
  url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
  cover: {
    title: 'Big Bug Bunny',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
  }
}

console.log('Searching for devices')

client.on('device', function (device) {
  device.play(media, function () {
    console.log('Playing in your chromecast')

    setTimeout(function () {
      device.stop(function (err, status) {
        if (err) console.log('Error', err)
        console.log('Device stopped')

        setTimeout(function () {
          device.play(media, 0, function () {
            console.log('Reconnected and playing :)')
          })
        }, 5000)
      })
    }, 10000)
  })
})
