const functions = require('firebase-functions');
const admin = require('firebase-admin')
const line = require('@line/bot-sdk')
const moment = require('moment')

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
  console.log(`handleEvent called at: ${moment().format()}`)

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
        return handleAction(action, event.replyToken, event.source, event.postback)
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
const handleAction = (action, replyToken, source, postback) => {
  console.log(`handleAction called at: ${moment().format()}`)
  console.log(action)
  switch (action) {
    case 'show':
      if (!source.userId) return replyText(replyToken, `ユーザーIDが取得できませんでした。友達登録をしてください。`)

      // find dates user assigned
      return db.collection('calendar').where('userId', '==', source.userId).get()
        .then(snapshot => {
          console.log(`calendar dates retrived at: ${moment().format()}`)
          const dates = []
          snapshot.forEach(doc => {
            if(moment(doc.id).isAfter(moment().subtract(1, 'days'))) dates.push(moment(doc.id).format('M月D日'))
          })
          console.log('retrived dates')
          dates.map(date => console.log(date))
          let message = '【当番日程】\n'
          dates.forEach(date => {
            message += `・ ${date}\n`
          })
          message += '\n頑張りましょう！'
          return replyText(replyToken, message)
        })
    case 'ask':
      return client.replyMessage(
        replyToken,
        {
          type: 'template',
          altText: '当番変更依頼',
          template: {
            type: 'buttons',
            text: '当番変更を依頼したい日付を選択してください',
            title: '日付を選択',
            thumbnailImageUrl: 'https://gyazo.com/770ec6a2732d77c457678d0bc87b4e98.png',
            actions: [
              {
                label: 'select date',
                type: 'datetimepicker',
                data: 'action=select',
                mode: 'date',
              }
            ]
          }
        }
      )
    case 'select':
      const userId = source.userId
      const date = moment(postback.params.date).format('YYYYMMDD')
      console.log('select called')
      console.log(date)

      // validate date asignee
      return db.collection('calendar').doc(date).get()
        .then(doc => {
          console.log('doc retrived')
          console.log(doc.data().userId)
          if (doc.data().userId != userId) return replyText(replyToken, 'あなたの担当日ではありません！')

          return db.collection('requests').doc(date).set({
            asker: userId
          }).then(() => replyText(replyToken, `${postback.params.date}の担当変更依頼が作成されました`))
        })
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
  console.log(`onRequest called at: ${moment().format()}`)
  // events must be an array
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end()
  }

  // handle events
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => {
      console.log(`Promise.all resolved at: ${moment().format()}`)
      res.status(200).send(`Success: ${result}`)
    })
    .catch(err => res.status(400).send(err.toString()))
})

// when request is created
exports.createRequest = functions.firestore
  .document('requests/{request}')
  .onCreate(event => {
    console.log('new request created')
    const newRequest = event.data.data()
    const asker = newRequest.asker

    console.log('asker')
    console.log(asker)

    return db.collection('users').get()
      .then(snapshot => {
        let users = []
        snapshot.forEach(doc => {
          users.push(doc.id)
        })
        console.log('users')
        console.log(users)
        return client.multicast(users, [{type: 'text', text: '新しいリクエストが作成されました'}])
      })
  })
