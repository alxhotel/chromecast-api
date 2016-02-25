/* global require, module */

var os = require('os')
var util = require('util')
var http = require('http')
var EventEmitter = require('events').EventEmitter
var SsdpClient = require('node-ssdp').Client
var mdns = require('multicast-dns')
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
	this.emit('deviceOn', new Device(device))
}

Browser.prototype.init = function () {
	var self = this

	//Internal storage
	var devices = {}
	var dns = this._dns = mdns()

	dns.on('response', function (response) {
		response.answers.forEach(function (a) {
			debug('DNS [PTR]: ', a)
			if (a.type === 'PTR' && a.name === '_googlecast._tcp.local') {
				var name = a.data.replace('._googlecast._tcp.local', '')
				if (!devices[name]) {
					devices[name] = {name: name, host: null}
				}
			}
		})

		var onanswer = function (a) {
			debug('DNS [A]: ', a)
			var name = a.name.replace('.local', '')
			if (a.type === 'A' && devices[name] && !devices[name].host) {
				devices[name].host = a.data
				
				//Emit
				self.update({
					name: name,
					addresses: [a.data]
				})
			}
		}

		response.additionals.forEach(onanswer)
		response.answers.forEach(onanswer)
	})

	var responseCallback = function (headers, statusCode, rinfo) {
		if (statusCode !== 200)
			return
		if (!headers.LOCATION)
			return

		http.get(headers.LOCATION, function (res) {
			var body = ''
			res.on('data', function (chunk) {
				body += chunk
			})
			res.on('end', function () {
				var match = body.match(/<friendlyName>(.+?)<\/friendlyName>/)
				if (!match || match.length !== 2)
					return
				
				var name = match[1]
				var host = rinfo.address
				
				if (!devices[name]) {
					//New device
					devices[name] = {name: name, host: host}
					
					return self.update({
						name: name,
						addresses: [host]
					})
				} else if(!devices[name].host) {
					//Update device
					devices[name].host = host
					
					self.update({
						name: name,
						addresses: [host]
					})
				}
			})
		})
	}

	var networkInterfaces = os.networkInterfaces()

	Object.keys(networkInterfaces).forEach(function (type) {
		networkInterfaces[type].forEach(function (networkInterface) {
			if (networkInterface.internal)
				return
			
			//SSDP
			var ssdpBrowser = new SsdpClient({
				unicastHost: networkInterface.address
			})
			ssdpBrowser.on('response', responseCallback)
			ssdpBrowser.search('urn:dial-multiscreen-org:service:dial:1')
		})
	})
	//MDNS
	dns.query('_googlecast._tcp.local', 'PTR')
}

Browser.prototype.stop = function () {
	var dns = this._dns
	if (dns) {
		dns.removeAllListeners()
		dns.destroy()
		this._dns = null
	}
}
