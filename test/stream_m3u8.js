const ChromecastAPI = require('../index.js')

var client = new ChromecastAPI()

console.log('Searching for devices')

client.on('device', function (device) {
  console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host)

  device.play('https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8', function (err) {
    if (err) return console.log(err)
    console.log('Playing audio in chromecast: ' + device.friendlyName)
  })
})
