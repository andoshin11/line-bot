const moment = require('moment')
const db = require('../db')
const replyText = require('../utils').replyText

module.exports = (replyToken, source) => {
  if (!source.userId) return replyText(replyToken, `ユーザーIDが取得できませんでした。友達登録をしてください。`)

  // find dates user assigned
  return db.collection('calendar').where('userId', '==', source.userId).get()
    .then(snapshot => {
      let message = '【当番日程】\n'

      snapshot.docs.filter(doc => moment(doc.id).isAfter(moment().subtract(1, 'days'))).forEach(doc => {
        message += `・ ${moment(doc.id).format('M月D日')}\n`
      })

      message += '\n頑張りましょう！'

      return replyText(replyToken, message)
    })
}
