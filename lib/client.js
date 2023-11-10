const http = require('http');
const EventEmitter = require('events');
const Ssdp = require('node-ssdp').Client;
const mdns = require('multicast-dns');
const parseString = require('xml2js').parseString;
const txt = require('dns-txt')();
const debug = require('debug')('chromecast-api');
const Device = require('./device');
const Scanner = require('./scanner');

/**
* Chromecast client
*/
class Client extends EventEmitter {
    constructor() {
        super();
        debug('Initializing...');

        this.scanner = new Scanner();
        this.scanner.on('device', updateDevice)

    }

    if (!this.devices[name]) {
        // New device
        this.devices[name] = { name: friendlyName, host };
        this.updateDevice(name);
    } else if (!this.devices[name].name || !this.devices[name].host) {
        // Update device
        this.devices[name].name = friendlyName;
        this.devices[name].host = host;
        this.updateDevice(name);
    }

    updateDevice(device) {
        debug('New device: ', device);

        // Add new device
        const newDevice = new Device({
            name,
            friendlyName: device.name,
            host: device.host
        });

        // Add for public storage
        this.devices.push(newDevice);

        this.emit('device', newDevice);
    }

    
}

module.exports = Client;
