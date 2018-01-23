const replyText = require('../utils').replyText
const handleAction = require('../handleAction')
const actionReg = /^action=([a-z]+)/

module.exports = event => {
  let data = event.postback.data

  if (data.match(actionReg)) {
    const action = data.match(actionReg)[1]
    return handleAction(action, event)
  } else {
    return replyText(event.replyToken, `Got postback: ${data}`)
  }
}

