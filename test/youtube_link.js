const ChromecastAPI = require('../index.js')

var client = new ChromecastAPI()

console.log('Searching for devices')

client.on('device', function (device) {
  console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host)

  device.play('https://www.youtube.com/watch?v=LqYIKYEnX7Y', function (err) {
    if (err) return console.log(err)
    console.log('Playing youtube video in chromecast: ' + device.friendlyName)
  })
})
