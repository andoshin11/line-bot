const functions = require('firebase-functions');
const admin = require('firebase-admin')
const line = require('@line/bot-sdk')

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()

const config = {
  channelAccessToken: functions.config().line.channel_access_token,
  channelSecret: functions.config().line.channel_secret
}

// create LINE client
const client = new line.Client(config)

// simple reply method
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts]
  return client.replyMessage(token, texts.map(text => ({ type: 'text', text })))
}

const handleEvent = event => {
  console.log(event)

  switch (event.type) {
    case 'message':
      const message = event.message
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source)
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`)
      }
    case 'follow':
//      return replyText(event.replyToken, 'フォローありがとうございます！')
      return handleFollow(event.replyToken, event.source)
    case 'join':
      return replyText(event.replyToken, `${event.source.type}に参加しました`)
    case 'postback':
      let data = event.postback.data
      if (data === 'DATE' || data === 'TIME' || data == 'DATETIME') {
        data += `(${JSON.stringify(event.postback.params)})`
      }

      // handle postback
      if (data.match(/^action=([a-z]+)/)) {
        const action = data.match(/^action=([a-z]+)/)[1]
        return handleAction(action, event.replyToken, event.source)
      } else {
        return replyText(event.replyToken, `Got postback: ${data}`)
      }
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`)
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

// handle actions
const handleAction = (action, replyToken, source) => {
  console.log('handleAction called')
  console.log(action)
  switch (action) {
    case 'show':
      if (!source.userId) return replyText(replyToken, `ユーザーIDが取得できませんでした。友達登録をしてください。`)

      // find dates user assigned
      db.collection('users').doc(source.userId).get()
        .then(doc => db.collection('calendar').where('userId', '==', doc.id).get()
          .then(snapshot => {
            const dates = []
            snapshot.forEach(doc => dates.push(doc.id))
            console.log('retrived dates')
            dates.map(date => console.log(date))
            return replyText(replyToken, `【当番日程】\n${dates}\n\n頑張りましょう！`)
          })
        )

      break

    default:
        return replyText(replyToken, `登録されていないアクションです: ${action}`)
  }
}

// handle Follow
const handleFollow = (replyToken, source) => {
  console.log('handleFollow called')
  const userId = source.userId
  console.log(`userID: ${userId}`)

  // add user to firestore
  client.getProfile(userId)
    .then(profile => {
      console.log('profile retrived')
      console.log(`profile: ${profile}`)
      db.collection('users').doc(userId).set({ name: profile.displayName })
        .then(ref => replyText(replyToken, 'ユーザーを登録しました!'))
    })
}

exports.handler = functions.https.onRequest((req, res) => {
  // events must be an array
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end()
  }

  // handle events
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.status(200).send(`Success: ${result}`))
    .catch(err => res.status(400).send(err.toString()))
})
