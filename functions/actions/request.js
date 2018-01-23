const moment = require('moment')
const db = require('../db')
const replyText = require('../utils').replyText

module.exports = (replyToken, source, postback) => {
  const userId = source.userId
  const params = postback.params
  const date = moment(params.date).format('YYYYMMDD')

  console.log('request called')
  console.log(date)

  return db.collection('calendar').doc(date).get()
    .then(doc => {
      if(doc.data().userId != userId) return replyText(replyToken, 'あなたの担当日ではありません！')

      return db.collection('requests').doc(date).set({ asker: userId })
        .then(() => replyText(replyToken, `${date}の担当変更依頼が作成されました`))
    })
}

