const Castv2Client = require('castv2-client')
const RequestResponseController = Castv2Client.RequestResponseController
const YoutubeRemote = require('youtube-remote')

const YOUTUBE_URN = 'urn:x-cast:com.google.youtube.mdx'

class YoutubeController extends RequestResponseController {
  constructor (client, sourceId, destinationId) {
    super(client, sourceId, destinationId, YOUTUBE_URN)

    const self = this

    this.screenId = null
    this.remote = null

    this.once('close', function () {
      self.stop()
    })
  }

  load (videoId, callback) {
    if (!callback) callback = noop

    this.playVideo(videoId, function (err, res) {
      if (err) return callback(err)
      callback(null, res)
    })
  }

  playVideo (videoId, listId, callback) {
    if (typeof listId === 'function') {
      callback = listId
      listId = ''
    }
    if (!callback) callback = noop

    const self = this

    this._getScreenId(function (err, screenId) {
      if (err) return callback(err)

      self.remote = new YoutubeRemote(screenId)
      self.remote.playVideo(videoId, listId, callback)
    })
  }

  addToQueue (videoId) {
    this.remote.addToQueue(videoId)
  }

  playNext (videoId) {
    this.remote.playNext(videoId)
  }

  removeVideo (videoId) {
    this.remote.removeVideo(videoId)
  }

  clearPlaylist () {
    this.remote.clearPlaylist()
  }

  _getScreenId (callback) {
    if (!callback) callback = noop

    const self = this

    this._controlRequest({ type: 'getMdxSessionStatus' }, function (err, body) {
      if (err) callback(err)

      try {
        self.screenId = body.data.screenId
      } catch (err) {
        const newErr = new Error('Failed to fetch screen ID')
        return callback(newErr)
      }

      callback(null, self.screenId)
    })
  }

  _controlRequest (data, callback) {
    const self = this

    this.on('message', onMessage)

    function onMessage (response) {
      self.removeListener('message', onMessage)

      if (response.type === 'INVALID_REQUEST') {
        const err = new Error('Invalid request: ' + response.reason)
        return callback(err)
      }

      callback(null, response)
    }

    this.send(data)
  }
}

function noop () {}

// Hack for 'castv2-client'
module.exports = (...args) => new YoutubeController(...args)
