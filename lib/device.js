/* global module, require */

const Client = require('castv2-client').Client
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver
const EventEmitter = require('events')
const mime = require('mime')
const debug = require('debug')('Device')

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

  _launch = (app, callback) => {
    if (!this.client) return

    this.client.getSessions((err, sess) => {
      if (err) return callback(err)

      const session = sess[0]
      if (session && session.appId === app.APP_ID) {
        this.client.join(session, app, callback)
      } else {
        this.client.launch(app, callback)
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

    this._connect(() => {
      debug('Launching app...')
      this._launch(DefaultMediaReceiver, (err, player) => {
        if (err) {
          debug(err)
          callback(err)
          return
        }

        this.player = player
        this._privatePlayMedia(resource, opts, callback)

        this.player.on('status', (status) => {
          debug('PlayerState = %s', status.playerState)
          this.emit('status', status)

          // Emit 'finished'
          if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
            this.emit('finished')
          }
        })
      })
    })
  }

  _privatePlayMedia = (resource, opts, callback) => {
    if (!callback) callback = noop

    let options = {}
    let media = {}

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
        let tracks = []
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

    // If it's a video
    if (media.contentType.indexOf('video') !== -1) {
      options.autoplay = true
      options.currentTime = opts.seconds || 0
    }

    this.player.load(media, options, (err, status) => {
      this.playing = true
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
    this.getStatus((err, status) => {
      if (err) return callback(err)
      const newCurrentTime = status.currentTime + seconds
      this.seekTo(newCurrentTime, callback)
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
    this.playing = false
    this.player.stop(callback)
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
    this.subtitlesStyle.fontScale = fontScale
    this.player.media.sessionRequest({
      type: 'EDIT_TRACKS_INFO',
      textTrackStyle: this.subtitlesStyle
    }, callback)
  }

  close = (callback) => {
    if (!callback) callback = noop

    this.client.stop(this.player, () => {
      this.client.close()
      this.client = null
      debug('Device closed')

      callback()
    })
  }
}

module.exports = Device
