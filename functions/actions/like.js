const moment = require('moment')
const db = require('../db')
const client = require('../client')
const replyText = require('../utils').replyText
const userReg = /user=(.+)/

module.exports = (replyToken, source, postback) => {
  const userId = source.userId
  const data = postback.data
  const user = data.match(userReg)[1]
  console.log('parsing user')
  console.log(user)

  const STICKERS = [
    {
      packageId: 1,
      stickerId: 2
    },
    {
      packageId: 1,
      stickerId: 4
    },
    {
      packageId: 1,
      stickerId: 5
    },
    {
      packageId: 1,
      stickerId: 13
    },
    {
      packageId: 1,
      stickerId: 106
    },
    {
      packageId: 1,
      stickerId: 125
    },
    {
      packageId: 1,
      stickerId: 138
    },
    {
      packageId: 1,
      stickerId: 409
    },
    {
      packageId: 1,
      stickerId: 427
    },
    {
      packageId: 2,
      stickerId: 28
    },
    {
      packageId: 2,
      stickerId: 41
    },
    {
      packageId: 2,
      stickerId: 144
    },
    {
      packageId: 2,
      stickerId: 150
    },
    {
      packageId: 2,
      stickerId: 171
    },
    {
      packageId: 2,
      stickerId: 172
    },
    {
      packageId: 2,
      stickerId: 501
    },
    {
      packageId: 2,
      stickerId: 516
    }
  ]

  const sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)]

  return client.getProfile(source.userId)
    .then(profile => {
      const name = profile.displayName
      const message = {
        type: 'text',
        text: `${name}さんからいいねが届きました！`
      }
      return client.pushMessage(user, [message])
        .then(() => client.pushMessage(user, { type: 'sticker', packageId: sticker.packageId, stickerId: sticker.stickerId }))
        .then(() => {
          return db.collection('users').doc(user).get()
            .then(doc => {
              const name = doc.data().name
              return replyText(replyToken, `${name}さんにいいねを送りました！`)
            })
        })
    })
}

