/* global module, require */

var inherits = require('inherits')
var Client = require('castv2-client').Client
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver
var EventEmitter = require('events').EventEmitter
var debug = require('debug')('Device')

/**
 * Chromecast
 * Supported Media: https://developers.google.com/cast/docs/media
 * Receiver Apps: https://developers.google.com/cast/docs/receiver_apps
 */

/**
 * Device
 * @param {Array}  options.address      IP address
 * @param {String} options.name         name
 */
var Device = function (options) {
  var self = this
  if (!(self instanceof Device)) return new Device(options)
  EventEmitter.call(self)

  self.config = options
  self.host = self.config.addresses[0]
  self._playing = false
}

module.exports.Device = Device

inherits(Device, EventEmitter)

Device.prototype.play = function (resource, seconds, callback) {
  var self = this

  // Use a fresh client
  if (self.client) self.client.close()

  debug('Connecting to host: ' + self.host)

  self.client = new Client()
  self.client.connect(self.host, function () {
    debug('Connected')
    self.emit('connected')
    debug('Launching app...')
    self.client.launch(DefaultMediaReceiver, function (err, player) {
      if (err) {
        debug('Error:', err)
        if (callback) callback(err)
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

  var media
  if (typeof resource === 'string') {
    media = {
      contentId: resource,
      contentType: 'video/mp4'
    }
  } else {
    media = {
      contentId: resource.url,
      contentType: resource.contentType || 'video/mp4'
    }

    if (resource.subtitles && resource.subtitles.length >= 1) {
      var tracks = []
      for (var i = 0; i < resource.subtitles.length; i++) {
        var subs = resource.subtitles[i]
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
      }

      media.tracks = tracks
      options.activeTrackIds = [tracks[0].trackId]
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
    self._playing = true
    if (callback) callback(err, status)
  })
}

Device.prototype.getStatus = function (callback) {
  var self = this
  self.player.getStatus(function (err, status) {
    if (err) {
      debug('Error getStatus: %s', err.message)
      return callback(err)
    }

    callback(null, status)
  })
}

Device.prototype.seekTo = function (newCurrentTime, callback) {
  var self = this
  self.player.seek(newCurrentTime, callback)
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
  var self = this
  self._playing = false
  self.player.pause(callback)
}

Device.prototype.unpause = function (callback) {
  var self = this
  self._playing = true
  self.player.play(callback)
}

Device.prototype.setVolume = function (volume, callback) {
  var self = this
  self.client.setVolume({level: volume}, callback)
}

Device.prototype.stop = function (callback) {
  var self = this
  self._playing = false
  self.player.stop(function () {
    debug('Player stopped')
    if (callback) callback()
  })
}

Device.prototype.setVolumeMuted = function (muted, callback) {
  var self = this
  self.client.setVolume({'muted': muted}, callback)
}

Device.prototype.subtitlesOff = function (callback) {
  var self = this
  self.player.media.sessionRequest({
    type: 'EDIT_TRACKS_INFO',
    activeTrackIds: [] // turn off subtitles
  }, callback)
}

Device.prototype.changeSubtitles = function (subId, callback) {
  var self = this
  self.player.media.sessionRequest({
    type: 'EDIT_TRACKS_INFO',
    activeTrackIds: [subId]
  }, callback)
}

Device.prototype.changeSubtitlesSize = function (fontScale, callback) {
  var self = this
  var newStyle = self.subtitlesStyle
  newStyle.fontScale = fontScale
  self.player.media.sessionRequest({
    type: 'EDIT_TRACKS_INFO',
    textTrackStyle: newStyle
  }, callback)
}

Device.prototype.close = function (callback) {
  var self = this
  self.client.stop(self.player, function () {
    self.client.close()
    self.client = null
    debug('Client closed')
    if (callback) callback()
  })
}
