var ChromecastAPI = require('../index.js')

var devices = []

var browser = new ChromecastAPI.Browser()

console.log('Searching for devices')

browser.on('deviceOn', function (device) {
  if (!devices[device.host]) {
    devices[device.host] = device
    console.log('Found chromecast: `' + device.config.name + '` at ' + device.host)
  }

  device.play('https://file-examples.com/wp-content/uploads/2017/10/file_example_PNG_500kB.png', 0, function () {
    console.log('Playing in chromecast: ' + device.config.name)

    setTimeout(function () {
      device.close(function () {
        console.log('Closed')
      })
    }, 10000)
  })
})
