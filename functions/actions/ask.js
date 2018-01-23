const client = require('../client')

module.exports = replyToken => {
  const message = {
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
          data: 'action=request',
          mode: 'date',
        }
      ]
    }
  }

  return client.replyMessage(replyToken, message)
}

