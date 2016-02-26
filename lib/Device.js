/* global module, require */

var util = require('util')
var Client = require('castv2-client').Client
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver
var EventEmitter = require('events').EventEmitter
var debug = require('debug')('Device')

/**
 * Chromecast
 * Supported Media: https://developers.google.com/cast/docs/media
 * Receiver Apps: https://developers.google.com/cast/docs/receiver_apps
 */

var Device = function (options) {
	EventEmitter.call(this)
	this.config = options
	this.init()
}

module.exports.Device = Device

util.inherits(Device, EventEmitter)

Device.prototype.init = function () {
	this.host = this.config.addresses[0]
	this.playing = false
}

Device.prototype.play = function (resource, seconds, callback) {
	var self = this

	// Use a fresh client
	if (self.client) self.client.close()
	
	debug('Connecting to host: ' + self.host)
	
	self.client = new Client()
	self.client.connect(self.host, function () {
		debug('Connected')
		debug('Launching app...')
		self.emit('connected')
		self.client.launch(DefaultMediaReceiver, function (err, player) {
			if (err) {
				debug(err)
				if(callback) callback(err)
				return
			}
			
			self.player = player
			self._privatePlayMedia(resource, seconds, callback)
			
			player.on('status', function (status) {
				if (status) {
					debug('PlayerState = %s', status.playerState)
					self.emit('status', status)
				}
			})
		})
	})

	self.client.on('error', function (err) {
		console.log('Error: %s', err.message)
		self.client.close()
	})
}

Device.prototype._privatePlayMedia = function (resource, seconds, callback) {
	var self = this

	var options = {
		autoplay: true,
		currentTime: seconds || 0
	}

	if (typeof (resource) === 'string') {
		var media = {
			contentId: resource,
			contentType: 'video/mp4'
		}
	} else {
		var media = {
			contentId: resource.url,
			contentType: resource.contentType || 'video/mp4'
		}
		
		if (resource.subtitles) {
			var tracks = []
			var i = 0
			for (var subs in resource.subtitles) {
				var track = {
					trackId: i,
					type: 'TEXT',
					trackContentId: subs.url,
					trackContentType: 'text/vtt',
					name: subs.name,
					language: subs.language,
					subtype: 'SUBTITLES'
				}
				tracks.push(track)
				i++
			}

			media.tracks = tracks
			options.activeTrackIds = [0]
		}
		
		if (resource.subtitles_style) {
			media.textTrackStyle = resource.subtitles_style
			self.subtitlesStyle = resource.subtitles_style
		}
		
		if (resource.cover) {
			media.metadata = {
				type: 0,
				metadataType: 0,
				title: resource.cover.title,
				images: [{
					url: resource.cover.url
				}]
			}
		}
	}

	self.player.load(media, options, function (err, status) {
		self.playing = true
		if (callback) callback(err, status)
	})
}

Device.prototype.getStatus = function (callback) {
	this.player.getStatus(function(err, status) {
		if (err) {
			debug("Error getStatus: %s", err.message)
			return callback(err)
		}
		
		callback(null, status)
	})
}

Device.prototype.seekTo = function (newCurrentTime, callback) {
	this.player.seek(newCurrentTime, callback)
}

Device.prototype.seek = function (seconds, callback) {
	var self = this
	self.getStatus(function (err, status) {
		if (err) return callback(err)
		var newCurrentTime = status.currentTime + seconds
		self.seekTo(newCurrentTime, callback)
	})
}

Device.prototype.pause = function (callback) {
	this.playing = false
	this.player.pause(callback)
}

Device.prototype.unpause = function (callback) {
	this.playing = true
	this.player.play(callback)
}

Device.prototype.setVolume = function (volume, callback) {
	this.client.setVolume({level: volume}, callback)
}

Device.prototype.stop = function (callback) {
	var self = this
	self.playing = false
	self.player.stop(function() {
		debug('Player stopped')
		
		if(callback) callback()
	})
}

Device.prototype.setVolumeMuted = function (muted, callback) {
	this.client.setVolume({'muted': muted}, callback)
}

Device.prototype.subtitlesOff = function (callback) {
	this.player.media.sessionRequest({
		type: 'EDIT_TRACKS_INFO',
		activeTrackIds: [] // turn off subtitles
	}, callback)
}

Device.prototype.changeSubtitles = function (subIdx, callback) {
	this.player.media.sessionRequest({
		type: 'EDIT_TRACKS_INFO',
		activeTrackIds: [subIdx] // turn off subtitles
	}, callback)
}

Device.prototype.changeSubtitlesSize = function (fontScale, callback) {
	var newStyle = this.subtitlesStyle
	newStyle.fontScale = fontScale
	this.player.media.sessionRequest({
		type: 'EDIT_TRACKS_INFO',
		textTrackStyle: newStyle
	}, callback)
}

Device.prototype.close = function (callback) {
	var self = this
	self.client.stop(self.player, function() {
		self.client.close()
		self.client = null
		debug('Client closed')
		if (callback) callback()
	})
}
