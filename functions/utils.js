const db = require('./db')
const client = require('./client')

exports.replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts]
  return client.replyMessage(token, texts.map(text => ({ type: 'text', text })))
}

exports.multicast = texts => {
  texts = Array.isArray(texts) ? texts : [texts]
  return db.collection('users').get()
    .then(snapshot => snapshot.docs.map(doc => doc.id))
    .then(users => client.multicast(users, texts))
}

