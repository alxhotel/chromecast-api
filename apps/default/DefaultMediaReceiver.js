const mime = require('mime')

const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver

class DefaultMediaReceiverApp extends DefaultMediaReceiver {
  load (resource, opts, callback) {
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

    DefaultMediaReceiver.prototype.load.call(this, media, options, callback)
  }
}

module.exports = DefaultMediaReceiverApp
