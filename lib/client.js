const http = require('http')
const EventEmitter = require('events')
const Ssdp = require('node-ssdp').Client
const mdns = require('multicast-dns')
const parseString = require('xml2js').parseString
const txt = require('dns-txt')()
const debug = require('debug')('chromecast-api')
const Device = require('./device')

/**
* Chromecast client
*/
class Client extends EventEmitter {
  constructor () {
    super()
    debug('Initializing...')

    // Internal storage
    this._devices = {}

    // Public
    this.devices = []

    // Query MDNS
    this.queryMDNS()

    // Query SSDP
    this.querySSDP()
  }

  _updateDevice (name) {
    const device = this._devices[name]

    debug('New device: ', device)

    // Add new device
    const newDevice = new Device({
      name: name,
      friendlyName: device.name,
      host: device.host
    })

    // Add for public storage
    this.devices.push(newDevice)

    this.emit('device', newDevice)
  }

  queryMDNS () {
    debug('Querying MDNS...')

    // MDNS
    this._mdns = mdns()
    this._mdns.on('response', (response) => {
      const onEachAnswer = (a) => {
        let name

        if (a.type === 'PTR' && a.name === '_googlecast._tcp.local') {
          debug('DNS [PTR]: ', a)
          name = a.data
          if (!this._devices[name]) {
            // New device
            this._devices[name] = { name: null, host: null }
          }
        }

        name = a.name
        if (a.type === 'SRV' && this._devices[name] && !this._devices[name].host) {
          debug('DNS [SRV]: ', a)
          // Update device
          this._devices[name].host = a.data.target
          if (this._devices[name].name) this._updateDevice(name)
        }

        if (a.type === 'TXT' && this._devices[name] && !this._devices[name].name) {
          debug('DNS [TXT]: ', a)

          // Fix for array od data
          let decodedData = {}
          if (Array.isArray(a.data)) {
            a.data.forEach((item) => {
              const decodedItem = txt.decode(item)
              Object.keys(decodedItem).forEach((key) => {
                decodedData[key] = decodedItem[key]
              })
            })
          } else {
            decodedData = txt.decode(a.data)
          }

          const friendlyName = decodedData.fn || decodedData.n
          if (friendlyName) {
            // Update device
            this._devices[name].name = friendlyName
            if (this._devices[name].host) this._updateDevice(name)
          }
        }
      }

      response.answers.forEach(onEachAnswer)
      response.additionals.forEach(onEachAnswer)
    })

    // Query MDNS
    this._triggerMDNS()
  }

  _triggerMDNS () {
    if (this._mdns) this._mdns.query('_googlecast._tcp.local', 'PTR')
  }

  querySSDP () {
    debug('Querying SSDP...')

    // SSDP
    this._ssdp = new Ssdp()
    this._ssdp.on('response', (headers, statusCode, rinfo) => {
      if (statusCode !== 200 || !headers.LOCATION) return

      http.get(headers.LOCATION, (res) => {
        let body = ''
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => {
          parseString(body.toString(), { explicitArray: false, explicitRoot: false }, (err, result) => {
            if (err) return
            if (!result.device || !result.device.manufacturer || !result.device.friendlyName ||
              result.device.manufacturer.indexOf('Google') === -1) return

            // Friendly name
            const matchUDN = body.match(/<UDN>(.+?)<\/UDN>/)
            const matchFriendlyName = body.match(/<friendlyName>(.+?)<\/friendlyName>/)

            if (!matchUDN || matchUDN.length !== 2) return
            if (!matchFriendlyName || matchFriendlyName.length !== 2) return

            // Generate chromecast style name
            const udn = matchUDN[1]
            const name = `Chromecast-${udn.replace(/uuid:/g, '').replace(/-/g, '')}._googlecast._tcp.local`
            const friendlyName = matchFriendlyName[1]
            const host = rinfo.address

            if (!this._devices[name]) {
              // New device
              this._devices[name] = { name: friendlyName, host: host }
              this._updateDevice(name)
            } else if (!this._devices[name].name || !this._devices[name].host) {
              // Update device
              this._devices[name].name = friendlyName
              this._devices[name].host = host
              this._updateDevice(name)
            }
          })
        })
      })
    })

    // Query SSDP
    this._triggerSSDP()
  }

  _triggerSSDP () {
    if (this._ssdp) this._ssdp.search('urn:dial-multiscreen-org:service:dial:1')
  }

  update () {
    // Trigger again MDNS
    this._triggerMDNS()

    // Trigger again SSDP
    this._triggerSSDP()
  }

  destroy () {
    if (this._mdns) {
      this._mdns.removeAllListeners()
      this._mdns.destroy()
      this._mdns = null
    }

    if (this._ssdp) {
      this._ssdp.removeAllListeners()
      this._ssdp.stop()
      this._ssdp = null
    }
  }
}

module.exports = Client
