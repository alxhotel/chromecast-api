const ChromecastAPI = require('../index.js')

var client = new ChromecastAPI()

console.log('Searching for devices')

client.on('device', function (device) {
  console.log('Found chromecast: `' + device.friendlyName + '` at ' + device.host)

  device.play('https://file-examples.com/wp-content/uploads/2017/10/file_example_PNG_500kB.png', function () {
    console.log('Playing in chromecast: ' + device.friendlyName)

    setTimeout(function () {
      device.close(function () {
        console.log('Closed')

        client.destroy()
      })
    }, 10000)
  })
})
