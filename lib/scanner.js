const http = require('http');
const EventEmitter = require('events');
const Ssdp = require('node-ssdp').Client;
const mdns = require('multicast-dns');
const parseString = require('xml2js').parseString;
const txt = require('dns-txt')();
const debug = require('debug')('chromecast-api');

class Scanner extends EventEmitter {
    constructor() {
        this.scanSSDP();
        this.scanMDNS();
        // Internal storage as data may be received as packets
        this.deviceData = {};

        // Public
        this.devices = {};
    }

    scanSSDP() {
        debug('Scanning SSDP...');

        // SSDP
        this.ssdp = new Ssdp();
        this.ssdp.on('response', (headers, statusCode, rinfo) => {
            if (statusCode !== 200 || !headers.LOCATION) return;

            http.get(headers.LOCATION, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    parseString(body.toString(), { explicitArray: false, explicitRoot: false }, (err, result) => {
                        if (err) return;
                        if (!result.device || !result.device.manufacturer || !result.device.friendlyName ||
                            result.device.manufacturer.indexOf('Google') === -1) return;

                        // Friendly name
                        const matchUDN = body.match(/<UDN>(.+?)<\/UDN>/);
                        const matchFriendlyName = body.match(/<friendlyName>(.+?)<\/friendlyName>/);

                        if (!matchUDN || matchUDN.length !== 2) return;
                        if (!matchFriendlyName || matchFriendlyName.length !== 2) return;

                        // Generate chromecast style name
                        const udn = matchUDN[1];
                        const id = `Chromecast-${udn.replace(/uuid:/g, '').replace(/-/g, '')}._googlecast._tcp.local`;
                        const name = matchFriendlyName[1];
                        const host = rinfo.address;

                        this.emit('device', {id: id, name: name, host: host});
                    });
                });
            });
        });

        // Query SSDP
        this.triggerSSDP();
    }

    triggerSSDP() {
        if (this.ssdp) this.ssdp.search('urn:dial-multiscreen-org:service:dial:1');
    }

    scanMDNS() {
        debug('Querying MDNS...');

        // MDNS
        this.mdnsData = {};
        this.mdns = mdns();
        this.mdns.on('response', (response) => {
            const onEachAnswer = (a) => {
                let id;
                let foundDevice = null;

                if (a.type === 'PTR' && a.name === '_googlecast._tcp.local') {
                    debug('DNS [PTR]: ', a);
                    id = a.data;
                    if(!this.mdnsData[id]) {
                        this.mdnsData[id] = {id: id, name: null, host: null};
                    }
                }

                id = a.name;
                if (a.type === 'SRV') {
                    debug('DNS [SRV]: ', a);
                    if
                    this.emit('device', {id: id, name: null, host: a.data.target});
                }

                if (a.type === 'TXT') {
                    debug('DNS [TXT]: ', a);

                    // Fix for array od data
                    let decodedData = {};
                    if (Array.isArray(a.data)) {
                        a.data.forEach((item) => {
                            const decodedItem = txt.decode(item);
                            Object.keys(decodedItem).forEach((key) => {
                                decodedData[key] = decodedItem[key];
                            });
                        });
                    } else {
                        decodedData = txt.decode(a.data);
                    }

                    const friendlyName = decodedData.fn || decodedData.n;
                    if (friendlyName) {
                        this.emit('device', {id: id, name: friendlyName, host: null});
                    }
                }
            };

            response.answers.forEach(onEachAnswer);
            response.additionals.forEach(onEachAnswer);
        });

        // Query MDNS
        this.triggerMDNS();
    }

    triggerMDNS() {
        if (this.mdns) this.mdns.query('_googlecast._tcp.local', 'PTR');
    }

    destroy() {
        if (this.mdns) {
            this.mdns.removeAllListeners();
            this.mdns.destroy();
            this.mdns = null;
        }

        if (this.ssdp) {
            this.ssdp.removeAllListeners();
            this.ssdp.stop();
            this.ssdp = null;
        }
    }

    updateDevice(data) {
        if(data.id) {
            if(!this.deviceData[data.id]) {
                this.deviceData[data.id] = {id: id, name: null, host: null};
            }
            if(data.name) {
                this.deviceData[data.id].name = data.name;
            }

            if(this.deviceData[data.name]) {
                this.deviceData[data.id].name = this.deviceData[data.name];
            }
        }

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

    update() {
        // Trigger again MDNS
        this.triggerMDNS();

        // Trigger again SSDP
        this.triggerSSDP();
    }
}


module.exports = Scanner;
