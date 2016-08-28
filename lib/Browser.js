/* global module, require */

var os = require('os')
var inherits = require('inherits')
var http = require('http')
var EventEmitter = require('events').EventEmitter
var SsdpClient = require('node-ssdp').Client
var mdns = require('multicast-dns')
var Device = require('./Device').Device
var debug = require('debug')('chromecast-api')

var Browser = function () {
  var self = this
  if (!(self instanceof Browser)) return new Browser()
  debug('Initializing...')
  EventEmitter.call(self)

  // Internal storage
  self._devices = {}

  self._dns = mdns()
  self._dns.on('response', function (response) {
    response.answers.forEach(function (a) {
      debug('DNS [PTR]: ', a)
      if (a.type === 'PTR' && a.name === '_googlecast._tcp.local') {
        var name = a.data.replace('._googlecast._tcp.local', '')
        if (!self._devices[name]) {
          // If not saved, add it to the list
          self._devices[name] = {name: name, host: null}
        }
      }
    })

    var onanswer = function (a) {
      debug('DNS [A]: ', a)
      var name = a.name.replace('.local', '')
      if (a.type === 'A' && self._devices[name] && !self._devices[name].host) {
        self._devices[name].host = a.data

        // Update device
        self._updateDevice({
          name: name,
          addresses: [a.data]
        })
      }
    }

    response.additionals.forEach(onanswer)
    response.answers.forEach(onanswer)
  })

  // Query network
  self.update()
}

module.exports.Browser = Browser

inherits(Browser, EventEmitter)

Browser.prototype._updateDevice = function (device) {
  var self = this
  self.emit('deviceOn', new Device(device))
}

Browser.prototype.update = function () {
  var self = this
  var networkInterfaces = os.networkInterfaces()
  debug('Querying MDNS and SSDP...')
  Object.keys(networkInterfaces).forEach(function (type) {
    networkInterfaces[type].forEach(function (networkInterface) {
      if (networkInterface.internal) return

      // SSDP
      var ssdpBrowser = new SsdpClient({
        unicastHost: networkInterface.address
      })
      ssdpBrowser.on('response', function (headers, statusCode, rinfo) {
        if (statusCode !== 200) return
        if (!headers.LOCATION) return

        http.get(headers.LOCATION, function (res) {
          var body = ''
          res.on('data', function (chunk) {
            body += chunk
          })
          res.on('end', function () {
            var match = body.match(/<friendlyName>(.+?)<\/friendlyName>/)

            if (!match || match.length !== 2) return

            var name = match[1]
            var host = rinfo.address

            if (!self._devices[name]) {
              // New device
              self._devices[name] = {name: name, host: host}

              return self._updateDevice({
                name: name,
                addresses: [host]
              })
            } else if (!self._devices[name].host) {
              // Update device
              self._devices[name].host = host

              self._updateDevice({
                name: name,
                addresses: [host]
              })
            }
          })
        })
      })
      ssdpBrowser.search('urn:dial-multiscreen-org:service:dial:1')
    })
  })

  // MDNS
  self._dns.query('_googlecast._tcp.local', 'PTR')
}

Browser.prototype.destroy = function () {
  var self = this
  self._dns.removeAllListeners()
  self._dns.destroy()
  self._dns = null
}

// DEPRECATED
Browser.prototype.stop = function () {
  var self = this
  // console.warn('ChromecastAPI.Browser().stop() is deprecated, use `destroy()` instead')
  self.destroy()
}
