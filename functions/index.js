const functions = require('firebase-functions');
const moment = require('moment')

const db = require('./db')
const client = require('./client')
const handleEvent = require('./handleEvent')
const takeRequest = require('./firestore/takeRequest')
const multicast = require('./utils').multicast

exports.takeRequest = takeRequest

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
    const newRequest = event.data.data()
    console.log('new request')
    console.log(newRequest)
    const asker = newRequest.asker
    const requestDate = moment(event.data.id).format('M月D日')

    console.log('asker')
    console.log(asker)
    console.log('requestDate')
    console.log(requestDate)

    return db.collection('users').get()
      .then(snapshot => {
        const askerName = snapshot.docs.find(doc => doc.id == asker).data().name
        const users = snapshot.docs.map(doc => doc.id)
        console.log('users')
        console.log(users)
        console.log('askerName')
        console.log(askerName)
        const text = `${askerName}さんから${requestDate}の当番変更依頼が届きました！`
        console.log(text)
        const message = {
          type: 'template',
          altText: '新規当番変更依頼',
          template: {
            type: 'buttons',
            text: text,
            title: '新しい当番変更依頼',
            thumbnailImageUrl: 'https://i.gyazo.com/defc2a4e365fe0765b1dfd5057ff8e32.jpg',
            actions: [
              {
                label: '依頼を承諾する',
                type: 'postback',
                data: `action=take&date=${event.data.id}`
              }
            ]

          }
        }
        return multicast(message)
      })
  })

