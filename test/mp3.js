// Play content directly using the "device", to avoid MDNS.
const Device = require('../lib/device')
const opts = { name: 'chromecast', friendlyName: 'Chromecast', host: '192.168.1.11' }
const device = new Device(opts)
device.play('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3')
