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
  // return client.unlinkRichMenuFromUser('U84b137ce65ec3ed22806a312e27fb396', 'richmenu-b5bad355416adf77f015940bae6cbfea')
  return client.getRichMenuIdOfUser('U84b137ce65ec3ed22806a312e27fb396').then(response => {
    console.log('rich menu list')
    console.log(response)
    return client.replyMessage(replyToken, message)
  })

  return client.replyMessage(replyToken, message)
}

