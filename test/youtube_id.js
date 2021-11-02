const ChromecastAPI = require('../index.js')

const client = new ChromecastAPI()

console.log('Searching for devices')

client.on('device', function (device) {
  console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host)

  device.play({ v: 'Z7R8XRKqHAI' }, function () {
    console.log('Playing youtube video in chromecast: ' + device.friendlyName)
  })
})
