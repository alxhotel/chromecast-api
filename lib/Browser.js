/* global require, module */

var os = require('os')
var util = require('util')
var http = require('http')
var EventEmitter = require('events').EventEmitter
var SsdpClient = require('node-ssdp').Client
var Device = require('./Device').Device
var debug = require('debug')('chromecast-api')

var Browser = function () {
	debug('Initializing...')
	EventEmitter.call(this)
	this.init()
}

module.exports.Browser = Browser

util.inherits(Browser, EventEmitter)

Browser.prototype.update = function (device) {
	this.device = new Device(device)
	this.emit('deviceOn', this.device)
}

Browser.prototype.init = function () {
	var self = this

	var responseCallback = function (headers, statusCode, rinfo) {
		
		console.log(headers)
		
		if (statusCode !== 200) return
		if (!headers.LOCATION) return

		var request = http.get(headers.LOCATION, function(res) {
			var body = ''
			res.on('data', function(chunk) {
				body += chunk
			})
			res.on('end', function() {
				var match = body.match(/<friendlyName>(.+?)<\/friendlyName>/)
				if (!match || match.length !== 2)
					return
				self.update({
					name: match[1],
					addresses: [rinfo.address]
				})
			})
		})
	}
	
	var networkInterfaces = os.networkInterfaces()
	
	Object.keys(networkInterfaces).forEach(function (type) {
		networkInterfaces[type].forEach(function (networkInterface) {
			if (networkInterface.internal) return
			var ssdpBrowser = new SsdpClient({
				unicastHost: networkInterface.address
			})
			ssdpBrowser.on('response', responseCallback)
			ssdpBrowser.search('urn:dial-multiscreen-org:service:dial:1')
		})
	})
}