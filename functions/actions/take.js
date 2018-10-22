const moment = require('moment')
const db = require('../db')
const replyText = require('../utils').replyText
const dateReg = /date=([0-9]+)/

module.exports = (replyToken, source, postback) => {
  const userId = source.userId
  const data = postback.data
  const date = data.match(dateReg)[1]

  return db.collection('requests').doc(date).get()
    .then(doc => {
      if(doc.data().taker) {
        console.log('taker already exists')
        return replyText(replyToken, 'すでに担当者がいます！')
      } else {
        return db.collection('requests').doc(date).update({ taker: userId })
          .then(() => {
            return db.collection('calendar').doc(date).update({ userId: userId })
              .then(() => replyText(replyToken, `${moment(date).format('M月D日')}の担当があなたに変更されました`))
          })
      }
    })
}

