const ChromecastAPI = require('../index.js')

const client = new ChromecastAPI()

const media = {
  url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4'
}

console.log('Looking for devices')

client.on('device', function (device) {
  console.log('Found device: ', device)
  console.log('Total devices found: ', client.devices)

  device.play(media, function (err) {
    if (err) return console.log(err)
    console.log('Playing video in chromecast: ' + device.friendlyName)
  })
})
