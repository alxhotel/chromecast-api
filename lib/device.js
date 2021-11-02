const Client = require('castv2-client').Client
const EventEmitter = require('events')
const debug = require('debug')('Device')
const utils = require('./utils')

// Supported Apps
const Youtube = require('../apps/youtube/Youtube')
const DefaultMediaReceiver = require('../apps/default/DefaultMediaReceiver')

const SUPPORTED_APPS = {
  [Youtube.APP_ID]: Youtube,
  [DefaultMediaReceiver.APP_ID]: DefaultMediaReceiver
}
const SUPPORTED_APP_IDS = Object.keys(SUPPORTED_APPS)

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
  }

  _connect (callback) {
    // Use a fresh client
    // TODO: reconsider reusing the client
    if (this.client) this.client.close()

    this.client = new Client()

    // TODO: might be useful for callback?
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
        return (app)
          ? session.appId === app.APP_ID
          : SUPPORTED_APP_IDS.includes(session.appId)
      })
      const session = filtered.shift()

      if (session) {
        app = app || SUPPORTED_APPS[session.appId]
        this.client.join(session, app, callback)
      } else if (app) {
        this.client.launch(app, callback)
      } else {
        callback(new Error('no session started'))
      }
    })
  }

  _playYoutube (link, callback) {
    this._launch(Youtube, (err, player) => {
      if (err) return callback(err)

      this._onLaunch(player)

      this.player.load(link, (err, status) => {
        callback(err, status)
      })
    })
  }

  _playMedia (media, opts, callback) {
    this._launch(DefaultMediaReceiver, (err, player) => {
      if (err) return callback(err)

      this._onLaunch(player)

      this.player.load(media, opts, (err, status) => {
        callback(err, status)
      })
    })
  }

  _onLaunch (player) {
    this.player = player

    this.player.on('status', (status) => {
      debug('PlayerState = %s', status.playerState)
      this.emit('status', status)

      // Emit 'finished'
      if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
        this.emit('finished')
      }
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
        this._playYoutube(videoId, callback)
      } else {
        this._playMedia(resource, opts, callback)
      }
    })
  }

  _tryJoin (callback) {
    // We are already connected
    if (this.client) return callback()

    this._connect(() => {
      this._launch(null, (err, player) => {
        if (err) {
          this.client = null
          return callback(err)
        }

        this._onLaunch(player)

        callback()
      })
    })
  }

  _tryConnect (callback) {
    // We are already connected
    if (this.client) return callback()

    this._connect(callback)
  }

  getStatus (callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.player.getStatus(callback)
    })
  }

  getReceiverStatus (callback) {
    if (!callback) callback = noop

    this._tryConnect(() => {
      this.client.getStatus(callback)
    })
  }

  seekTo (newCurrentTime, callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.player.seek(newCurrentTime, callback)
    })
  }

  seek (seconds, callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.getStatus((err, status) => {
        if (err) return callback(err)
        const newCurrentTime = status.currentTime + seconds
        this.seekTo(newCurrentTime, callback)
      })
    })
  }

  pause (callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.player.pause(callback)
    })
  }

  unpause (callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.player.play(callback)
    })
  }

  resume (callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.unpause(callback)
    })
  }

  getVolume (callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.client.getVolume(callback)
    })
  }

  setVolume (volume, callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.client.setVolume({ level: volume }, callback)
    })
  }

  stop (callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.player.stop(callback)
    })
  }

  setVolumeMuted (muted, callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.client.setVolume({ muted: muted }, callback)
    })
  }

  subtitlesOff (callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.player.media.sessionRequest({
        type: 'EDIT_TRACKS_INFO',
        activeTrackIds: []
      }, callback)
    })
  }

  changeSubtitles (subId, callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.player.media.sessionRequest({
        type: 'EDIT_TRACKS_INFO',
        activeTrackIds: [subId]
      }, callback)
    })
  }

  changeSubtitlesSize (fontScale, callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      if (!this.player.subtitlesStyle) return callback(new Error('Subtitle styles not defined'))

      this.player.subtitlesStyle.fontScale = fontScale
      this.player.media.sessionRequest({
        type: 'EDIT_TRACKS_INFO',
        textTrackStyle: this.player.subtitlesStyle
      }, callback)
    })
  }

  getCurrentTime (callback) {
    if (!callback) callback = noop

    this._tryJoin((err) => {
      if (err) return callback(err)

      this.player.getStatus(function (err, status) {
        if (err) return callback(err)

        callback(null, status.currentTime || 0)
      })
    })
  }

  close (callback) {
    if (!callback) callback = noop

    if (!this.client) return

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
