const functions = require('firebase-functions')
const line = require('@line/bot-sdk')

const config = {
  channelAccessToken: functions.config().line.channel_access_token,
  channelSecret: functions.config().line.channel_secret
}

// create LINE client
const client = new line.Client(config)

module.exports = client

