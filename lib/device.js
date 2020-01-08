/* global module, require */

const Client = require('castv2-client').Client
const EventEmitter = require('events')
const mime = require('mime')
const utils = require('./utils')
const debug = require('debug')('Device')

// Apps
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver
const Youtube = require('../apps/youtube/Youtube')

/**
 * Device
 * @param {Object} opts               Options
 * @param {String} opts.name          name
 * @param {String} opts.friendlyName  Friendly name
 * @param {String} opts.host          IP address
 */
class Device extends EventEmitter {
  constructor (opts) {
    super()
    this.name = opts.name
    this.friendlyName = opts.friendlyName
    this.host = opts.host

    this.client = null
    this.playing = false
    this.subtitlesStyle = null
  }

  _connect (callback) {
    // Use a fresh client
    if (this.client) this.client.close()

    this.client = new Client()
    this.client.on('error', (err) => {
      debug('Error: %s', err.message)
      this.client.close()
    })

    debug('Connecting to device: ' + this.host)

    this.client.connect(this.host, () => {
      debug('Connected')
      this.emit('connected')

      callback()
    })
  }

  _launch (app, callback) {
    if (!this.client) return

    debug('Launching app...')

    this.client.getSessions((err, sessions) => {
      if (err) return callback(err)

      const filtered = sessions.filter((session) => {
        return session.appId === app.APP_ID
      })
      const session = filtered.shift()

      if (session) {
        this.client.join(session, app, callback)
      } else {
        this.client.launch(app, callback)
      }
    })
  }

  _playYoutube (link, onLaunch, onPlaying) {
    this._launch(Youtube, (err, player) => {
      onLaunch(err, player)

      this.player.load(link, (err, status) => {
        this.playing = true
        onPlaying(err, status)
      })
    })
  }

  _playMedia (media, opts, onLaunch, onPlaying) {
    this._launch(DefaultMediaReceiver, (err, player) => {
      onLaunch(err, player)

      this._privatePlayMedia(media, opts, (err, status) => {
        this.playing = true
        onPlaying(err, status)
      })
    })
  }

  play (resource, opts, callback) {
    // Handle optional parameters
    if (typeof opts === 'function') {
      callback = opts
      opts = {}
    }
    if (!opts) opts = {}
    if (!callback) callback = noop

    this._connect(() => {
      // Identify resource
      resource = resource.v || resource

      const videoId = utils.getYoutubeId(resource)
      if (videoId) {
        this._playYoutube(videoId, onLaunch, callback)
      } else {
        this._playMedia(resource, opts, onLaunch, callback)
      }

      var self = this
      function onLaunch (err, player) {
        if (err) {
          debug('Error: ', err)
          callback(err)
          return
        }

        self.player = player

        self.player.on('status', (status) => {
          debug('PlayerState = %s', status.playerState)
          self.emit('status', status)

          // Emit 'finished'
          if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
            self.emit('finished')
          }
        })
      }
    })
  }

  _privatePlayMedia (resource, opts, callback) {
    if (!callback) callback = noop

    let media = {}
    const options = {}

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
        const tracks = []

        let i = 0
        for (const subs of resource.subtitles) {
          tracks.push({
            trackId: i,
            type: 'TEXT',
            trackContentId: subs.url,
            trackContentType: 'text/vtt',
            name: subs.name,
            language: subs.language,
            subtype: 'SUBTITLES'
          })
          i++
        }

        media.tracks = tracks
        options.activeTrackIds = [0]
      }

      // Config subtitles
      if (resource.subtitles_style) {
        media.textTrackStyle = resource.subtitles_style
        this.subtitlesStyle = resource.subtitles_style
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

    // If it's a video or audio file
    if (media.contentType.indexOf('video') !== -1 || media.contentType.indexOf('audio') !== -1) {
      options.autoplay = true
      options.currentTime = opts.startTime || 0
    }

    this.player.load(media, options, callback)
  }

  getStatus (callback) {
    this.player.getStatus(callback)
  }

  seekTo (newCurrentTime, callback) {
    this.player.seek(newCurrentTime, callback)
  }

  seek (seconds, callback) {
    this.getStatus((err, status) => {
      if (err) return callback(err)
      const newCurrentTime = status.currentTime + seconds
      this.seekTo(newCurrentTime, callback)
    })
  }

  pause (callback) {
    this.playing = false
    this.player.pause(callback)
  }

  unpause (callback) {
    this.playing = true
    this.player.play(callback)
  }

  resume (callback) {
    this.unpause(callback)
  }

  setVolume (volume, callback) {
    this.client.setVolume({ level: volume }, callback)
  }

  stop (callback) {
    this.playing = false
    this.player.stop(callback)
  }

  setVolumeMuted (muted, callback) {
    this.client.setVolume({ muted: muted }, callback)
  }

  subtitlesOff (callback) {
    this.player.media.sessionRequest({
      type: 'EDIT_TRACKS_INFO',
      activeTrackIds: []
    }, callback)
  }

  changeSubtitles (subId, callback) {
    this.player.media.sessionRequest({
      type: 'EDIT_TRACKS_INFO',
      activeTrackIds: [subId]
    }, callback)
  }

  changeSubtitlesSize (fontScale, callback) {
    this.subtitlesStyle.fontScale = fontScale
    this.player.media.sessionRequest({
      type: 'EDIT_TRACKS_INFO',
      textTrackStyle: this.subtitlesStyle
    }, callback)
  }

  close (callback) {
    if (!callback) callback = noop

    this.client.stop(this.player, () => {
      this.client.close()
      this.client = null
      debug('Device closed')

      callback()
    })
  }
}

function noop () {}

module.exports = Device
