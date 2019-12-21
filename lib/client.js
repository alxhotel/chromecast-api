/* global require, module */

var util = require('util')
var http = require('http')
var EventEmitter = require('events').EventEmitter
var Ssdp = require('node-ssdp').Client
var mdns = require('multicast-dns')
var parseString = require('xml2js').parseString
var txt = require('dns-txt')()
var debug = require('debug')('chromecast-api')

var Device = require('./device')

var Client = function () {
  var self = this
  EventEmitter.call(this)

  debug('Initializing...')

  // Internal storage
  self._devices = {}

  // Query MDNS
  self.queryMDNS()

  // Query SSDP
  self.querySSDP()
}

module.exports = Client

util.inherits(Client, EventEmitter)

Client.prototype._updateDevice = function (name) {
  var self = this
  const device = self._devices[name]

  debug('New device; ', device)

  self.emit('device', new Device({
    name: name,
    friendlyName: device.name,
    host: device.host
  }))
}

Client.prototype.queryMDNS = function () {
  var self = this
  debug('Querying MDNS...')

  // MDNS
  self._mdns = mdns()
  self._mdns.on('response', function (response) {
    var onEachAnswer = function (a) {
      var name

      if (a.type === 'PTR' && a.name === '_googlecast._tcp.local') {
        debug('DNS [PTR]: ', a)
        name = a.data
        if (!self._devices[name]) {
          // New device
          self._devices[name] = { name: null, host: null }
        }
      }

      name = a.name
      if (a.type === 'SRV' && self._devices[name] && !self._devices[name].host) {
        debug('DNS [SRV]: ', a)
        // Update device
        self._devices[name].host = a.data.target
        if (self._devices[name].name) self._updateDevice(name)
      }

      if (a.type === 'TXT' && self._devices[name] && !self._devices[name].name) {
        debug('DNS [TXT]: ', a)
        var decodedData = txt.decode(a.data)
        if (decodedData.fn) {
          // Update device
          self._devices[name].name = decodedData.fn
          if (self._devices[name].host) self._updateDevice(name)
        }
      }
    }

    response.answers.forEach(onEachAnswer)
    response.additionals.forEach(onEachAnswer)
  })

  // Query MDNS
  self._triggerMDNS()
}

Client.prototype._triggerMDNS = function () {
  var self = this
  if (self._mdns) self._mdns.query('_googlecast._tcp.local', 'PTR')
}

Client.prototype.querySSDP = function () {
  var self = this
  debug('Querying SSDP...')

  // SSDP
  self._ssdp = new Ssdp()
  self._ssdp.on('response', function (headers, statusCode, rinfo) {
    if (statusCode !== 200 || !headers.LOCATION) return

    http.get(headers.LOCATION, function (res) {
      var body = ''
      res.on('data', function (chunk) {
        body += chunk
      })
      res.on('end', function () {
        parseString(body.toString(), { explicitArray: false, explicitRoot: false }, function (err, result) {
          if (err) return
          if (!result.device || !result.device.manufacturer || !result.device.friendlyName ||
            result.device.manufacturer.indexOf('Google') === -1) return

          // Friendly name
          var matchUDN = body.match(/<UDN>(.+?)<\/UDN>/)
          var matchFriendlyName = body.match(/<friendlyName>(.+?)<\/friendlyName>/)

          if (!matchUDN || matchUDN.length !== 2) return
          if (!matchFriendlyName || matchFriendlyName.length !== 2) return

          // Generate chromecast style name
          var udn = matchUDN[1]
          var name = 'Chromecast-' + udn.replace(/uuid:/g, '').replace(/-/g, '') + '._googlecast._tcp.local'
          var friendlyName = matchFriendlyName[1]
          var host = rinfo.address

          if (!self._devices[name]) {
            // New device
            self._devices[name] = { name: friendlyName, host: host }
            self._updateDevice(name)
          } else if (!self._devices[name].name || !self._devices[name].host) {
            // Update device
            self._devices[name].name = friendlyName
            self._devices[name].host = host
            self._updateDevice(name)
          }
        })
      })
    })
  })

  // Query SSDP
  self._triggerSSDP()
}

Client.prototype._triggerSSDP = function () {
  var self = this
  if (self._ssdp) self._ssdp.search('urn:dial-multiscreen-org:service:dial:1')
}

Client.prototype.update = function () {
  var self = this

  // Trigger again MDNS
  self._triggerMDNS()

  // Trigger again SSDP
  self._triggerSSDP()
}

Client.prototype.destroy = function () {
  var self = this

  if (self._mdns) {
    self._mdns.removeAllListeners()
    self._mdns.destroy()
    self._mdns = null
  }

  if (self._ssdp) {
    self._ssdp.removeAllListeners()
    self._ssdp.stop()
    self._ssdp = null
  }
}
