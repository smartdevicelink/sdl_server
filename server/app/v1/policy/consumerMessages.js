let app = require('../app.js'),
  sql = app.locals.db.sqlCommand,
  bricks = require('sql-bricks');

let consumer_friendly_messages = {
    "version": "000.000.001", //TODO: update this to actual version
    "messages": {}
}

let view = bricks.select('language_id', 'message_category', 'status', 'max(id) AS id').from('message_text').groupBy('message_category', 'language_id', 'status').toString()
let gmt = bricks.select('message_text.*').from(`(${view}) gmt`).join('message_text').on({"message_text.id": "gmt.id"}).toString()

sql(gmt, function(err, res){
  if(err) {
    console.error(err)
  } else {
    consumer_friendly_messages.messages = generateMessages(res.rows);
  }
})

function generateMessages(data){
  let message = {}
  data.map(function(item){
    if(message[item.message_category] == undefined){
      message[item.message_category] = {
                                        "languages":{}
                                      }
    }
    if(message[item.message_category].languages[item.language_id] == undefined){
      message[item.message_category].languages[item.language_id] = {};
      if(item.label != undefined){message[item.message_category].languages[item.language_id].label = item.label}
      if(item.line1 != undefined){message[item.message_category].languages[item.language_id].line1 = item.line1}
      if(item.line2 != undefined){message[item.message_category].languages[item.language_id].line2 = item.line2}
      if(item.text_body != undefined){message[item.message_category].languages[item.language_id].text_body = item.text_body}
      if(item.tts != undefined){message[item.message_category].languages[item.language_id].tts = item.tts}
    }
  })
  return message
}

module.exports = consumer_friendly_messages;