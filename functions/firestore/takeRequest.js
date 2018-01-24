const functions = require('firebase-functions')
const moment = require('moment')
const db = require('../db')
const multicast = require('../utils').multicast

module.exports = functions.firestore
  .document('requests/{date}')
  .onUpdate(event => {
    console.log('takeRequest called')
    const newValue = event.data.data()
    const previousValue = event.data.previous.data()

    if (previousValue.taker && previousValue.asker) {
      // すでにtakerとaskerが設定されていた場合は何もしない
      return
    }

    const date = event.params.date
    return db.collection('users').doc(newValue.taker).get()
      .then(doc => {
        const name = doc.data().name
        const text = `${name}さんが${moment(date).format('M月D日')}の当番を引き受けてくれました！`
        const message = {
          type: 'template',
          altText: '当番変更依頼承諾',
          template: {
            type: 'buttons',
            title: '当番が変更されました',
            text: text,
            thumbnailImageUrl: 'https://i.gyazo.com/663ab96f58a944aecb28ed8fb8e71b77.png',
            actions: [
              {
                label: 'いいねを送る',
                type: 'postback',
                data: `action=like&user=${newValue.taker}`
              }
            ]
          }
        }
        return multicast(message)
      })
  })

