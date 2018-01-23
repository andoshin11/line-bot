const moment = require('moment')

const handleMessage = require('./events/message')
const handleFollow = require('./events/follow')
const handlePostback = require('./events/postback')

module.exports = event => {
  console.log(event)
  console.log(`handleEvent called at: ${moment().format()}`)

  switch (event.type) {
    case 'message':
      return handleMessage(event)
    case 'follow':
      return handleFollow(event)
    case 'postback':
      return handlePostback(event)
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`)
  }
}
