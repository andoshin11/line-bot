const functions = require('firebase-functions')
const db = require('../db')
const client = require('../client')
const replyText = require('../utils').replyText

module.exports = event => {
  console.log('handleFollow called')
  const source = event.source
  const replyToken = event.replyToken
  const userId = source.userId
  console.log(`userId: ${userId}`)

  // add user to Firestore
  return client.linkRichMenuToUser(userId, functions.config().line.default_richmenu)
    .then(() => {
      return client.getProfile(userId)
        .then(profile => {
          console.log('profile retrived')
          console.log(profile)
          return db.collection('users').doc(userId).set({ name:profile.displayName })
          .then(ref => replyText(replyToken, 'ユーザーを登録しました！'))
        })
    })
}

