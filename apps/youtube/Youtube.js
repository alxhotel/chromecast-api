const Castv2Client = require('castv2-client')
const Application = Castv2Client.Application
const MediaController = Castv2Client.MediaController
const YoutubeController = require('./YoutubeController')

class Youtube extends Application {
  constructor (client, session) {
    super(client, session)

    this.media = this.createController(MediaController)
    this.youtube = this.createController(YoutubeController)

    const self = this

    this.media.on('status', function (status) {
      self.emit('status', status)
    })
  }

  static get APP_ID () { return '233637DE' }

  getStatus (callback) {
    this.media.getStatus.apply(this.media, arguments)
  }

  load (videoId) {
    this.youtube.load.apply(this.youtube, arguments)
  }

  play (callback) {
    this.media.play.apply(this.media, arguments)
  }

  pause (callback) {
    this.media.pause.apply(this.media, arguments)
  }

  stop (callback) {
    this.media.stop.apply(this.media, arguments)
  }

  seek (currentTime, callback) {
    this.media.seek.apply(this.media, arguments)
  }
}

module.exports = Youtube
