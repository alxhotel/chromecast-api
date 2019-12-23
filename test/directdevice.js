// Play content directly using the "device", to avoid MDNS.
const Device = require('../lib/device')
const opts = { name: 'chromecast', friendlyName: 'Chromecast', host: '192.168.1.11' }
const device = new Device(opts)
device.play('http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4')
