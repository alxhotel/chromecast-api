const ChromecastAPI = require('../index.js')

const client = new ChromecastAPI()

console.log('Searching for devices')

client.on('device', function (device) {
  console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host)

  device.play('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', function (err) {
    if (err) return console.log(err)
    console.log('Playing audio in chromecast: ' + device.friendlyName)
  })
})
