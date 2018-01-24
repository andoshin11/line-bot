const moment = require('moment')
const replyText = require('./utils').replyText

const handleShow = require('./actions/show')
const handleAsk = require('./actions/ask')
const handleRequest = require('./actions/request')
const handleTake = require('./actions/take')
const handleLike = require('./actions/like')

module.exports = (action, event) => {
  const replyToken = event.replyToken
  const source = event.source
  const postback = event.postback
  console.log(`handleAction called at: ${moment().format()}`)
  console.log(action)

  switch (action) {
    case 'show':
      return handleShow(replyToken, source)
    case 'ask':
      return handleAsk(replyToken)
    case 'request':
      return handleRequest(replyToken, source, postback)
    case 'take':
      return handleTake(replyToken, source, postback)
    case 'like':
      return handleLike(replyToken, source, postback)
    default:
      return replyText(replyToken, `登録されていないアクションです: ${action}`)
  }
}

