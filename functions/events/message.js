const client = require('../client')
const replyText = require('../utils').replyText

module.exports = event => {
  const message = event.message
  switch(message.typs) {
    case 'text':
      return handleText(message, event.replyToken, event.source)
    default:
      throw new Error(`Unknown message: ${JSON.stringify(message)}`)
  }
}

const handleText = (message, replyToken, source) => {
  switch (message.text) {
    case 'profile':
      if (source.userId) {
        return client.getProfile(source.userId)
          .then(profile => replyText(
            replyToken,
            [
              `Display name: ${profile.displayName}`,
              `User ID: ${source.userId}`,
              `Status message: ${profile.statusMessage}`
            ]
          ))
      } else {
        return replyText(replyToken, 'User IDを取得できませんでした')
      }
    default:
      return replyText(replyToken, message.text)
  }
}

