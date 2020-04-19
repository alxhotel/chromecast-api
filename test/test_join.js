var ChromecastAPI = require('../index.js')

var client = new ChromecastAPI()

var media = {
  url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
}

console.log('Looking for devices')

client.on('device', function (device) {
  console.log('Found device: ', device)

  console.log('Starting to play')

  device.play(media, () => {
    // Fake a disconnection
    console.log('Faking disconnection')
    device.client = null

    // Give some time to load
    setTimeout(() => {
      console.log('Trying to rejoin')
      device.setVolume(0.5, (err) => {
        if (err) return console.error('Joining failed')
        console.log('Joining works!')
      })
    }, 5000)
  })
})
