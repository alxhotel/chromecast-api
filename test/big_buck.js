var ChromecastAPI = require('../index.js')

var client = new ChromecastAPI()

console.log('Searching for devices')

client.findDevice(function (device) {
  console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host)

  device.play('http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4', 60, function () {
    console.log('Playing in chromecast: ' + device.name)

    setTimeout(function () {
      device.pause(function () {
        console.log('Paused')
      })
    }, 20000)

    setTimeout(function () {
      device.stop(function () {
        console.log('Stopped')
      })
    }, 30000)

    setTimeout(function () {
      device.close(function () {
        console.log('Closed')

        // Destroy client
        client.destroy(function () {
          console.log('Client destroyed')
        })
      })
    }, 35000)
  })
})
