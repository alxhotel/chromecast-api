// eslint-disable-next-line
const YOUTUBE_REGEX = /(?:http(?:s?):\/\/)?(?:www\.)?(?:music\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/
const URI_REGEX = /\w+:(\/?\/?)[^\s]+/
const PATH_REGEX = /(\\\\?([^\\/]*[\\/])*)([^\\/]+)/

/**
* Utils
**/
class Utils {
  static getYoutubeId (obj) {
    if (!obj || typeof obj !== 'string') return null

    const youtubeMatch = obj.match(YOUTUBE_REGEX)
    const uriMatch = obj.match(URI_REGEX)
    const pathMatch = obj.match(PATH_REGEX)

    if (youtubeMatch && youtubeMatch.length > 1) {
      // Extract the video id
      return youtubeMatch[1]
    } else if ((uriMatch && uriMatch.length > 1) || (pathMatch && pathMatch.length > 1)) {
      // URI or path to file
      return null
    } else {
      // Looks like a possible video id (lets try)
      return obj
    }
  }
}

module.exports = Utils
