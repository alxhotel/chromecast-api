/* global module, require */

var Client = require('castv2-client').Client
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver
var EventEmitter = require('events')
var mime = require('mime')
var debug = require('debug')('Device')

/**
 * Device
 * @param {Object} opts               Options
 * @param {String} opts.name          name
 * @param {String} opts.friendlyName  Friendly name
 * @param {Array}  opts.host          IP address
 */
class Device extends EventEmitter {

  constructor(opts) {
    super()
    this.name = opts.name
    this.friendlyName = opts.friendlyName
    this.host = opts.host

    this.client = null
    this.playing = false
    this.subtitlesStyle = null
  }

  _connect = (callback) => {
    var self = this

    // Use a fresh client
    if (self.client) self.client.close()

    self.client = new Client()
    self.client.on('error', (err) => {
      debug('Error: %s', err.message)
      self.client.close()
    })

    debug('Connecting to device: ' + self.host)

    self.client.connect(self.host, () => {
      debug('Connected')
      self.emit('connected')

      callback()
    })
  }

  _launch = (app, callback) => {
    var self = this

    if (!self.client) return

    self.client.getSessions((err, sess) => {
      if (err) return callback(err)

      var session = sess[0]
      if (session && session.appId === app.APP_ID) {
        self.client.join(session, app, callback)
      } else {
        self.client.launch(app, callback)
      }
    })
  }

  play = (resource, opts, callback) => {
    // Handle optional parameters
    if (typeof opts === 'function') {
      callback = opts
      opts = {}
    }
    if (!callback) callback = noop

    var self = this

    self._connect(() => {
      debug('Launching app...')
      self._launch(DefaultMediaReceiver, (err, player) => {
        if (err) {
          debug(err)
          callback(err)
          return
        }

        self.player = player
        self._privatePlayMedia(resource, opts, callback)

        self.player.on('status', (status) => {
          debug('PlayerState = %s', status.playerState)
          self.emit('status', status)

          // Emit 'finished'
          if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
            self.emit('finished')
          }
        })
      })
    })
  }

  _privatePlayMedia = (resource, opts, callback) => {
    if (!callback) callback = noop

    var self = this
    var options = {}
    var media = {}

    if (typeof resource === 'string') {
      media = {
        contentId: resource,
        contentType: mime.getType(resource) || 'video/mp4'
      }
    } else {
      // By default
      media = {
        contentId: resource.url,
        contentType: resource.contentType || mime.getType(resource.url) || 'video/mp4'
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

      // Config subtitles
      if (resource.subtitles_style) {
        media.textTrackStyle = resource.subtitles_style
        self.subtitlesStyle = resource.subtitles_style
      }

      // Config cover
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

    // If it's a video
    if (media.contentType.indexOf('video') !== -1) {
      options.autoplay = true
      options.currentTime = opts.seconds || 0
    }

    self.player.load(media, options, (err, status) => {
      self.playing = true
      callback(err, status)
    })
  }

  getStatus = (callback) => {
    this.player.getStatus(callback)
  }

  seekTo = (newCurrentTime, callback) => {
    this.player.seek(newCurrentTime, callback)
  }

  seek = (seconds, callback) => {
    var self = this
    self.getStatus((err, status) => {
      if (err) return callback(err)
      var newCurrentTime = status.currentTime + seconds
      self.seekTo(newCurrentTime, callback)
    })
  }

  pause = (callback) => {
    this.playing = false
    this.player.pause(callback)
  }
  
  unpause = (callback) => {
    this.playing = true
    this.player.play(callback)
  }

  resume = (callback) => this.unpause(callback)

  setVolume = (volume, callback) => {
    this.client.setVolume({ level: volume }, callback)
  }

  stop = (callback) => {
    var self = this
    self.playing = false
    self.player.stop(callback)
  }

  setVolumeMuted = (muted, callback) => {
    this.client.setVolume({ muted: muted }, callback)
  }

  subtitlesOff = (callback) => {
    this.player.media.sessionRequest({
      type: 'EDIT_TRACKS_INFO',
      activeTrackIds: []
    }, callback)
  }

  changeSubtitles = (subId, callback) => {
    this.player.media.sessionRequest({
      type: 'EDIT_TRACKS_INFO',
      activeTrackIds: [subId]
    }, callback)
  }

  changeSubtitlesSize = (fontScale, callback) => {
    var self = this
    self.subtitlesStyle.fontScale = fontScale
    this.player.media.sessionRequest({
      type: 'EDIT_TRACKS_INFO',
      textTrackStyle: self.subtitlesStyle
    }, callback)
  }

  close = (callback) => {
    var self = this
    if (!callback) callback = noop

    self.client.stop(self.player, () => {
      self.client.close()
      self.client = null
      debug('Device closed')

      callback()
    })
  }
}

module.exports = Device
