const ChromecastAPI = require('../index.js')

var client = new ChromecastAPI()

console.log('Searching for devices')

client.on('device', function (device) {
  console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host)

  device.play('https://2.img-dpreview.com/files/p/sample_galleries/6361863532/1584980320.jpg', function () {
    console.log('Playing in chromecast: ' + device.friendlyName)

    setTimeout(function () {
      device.close(function () {
        console.log('Closed')

        client.destroy()
      })
    }, 10000)
  })
})
