var path = require('path'),
  policy = require(path.resolve('policy.json')),
  sqlBricks = require('sql-bricks'); // generates SQL statements to be logged to the console

var messages = policy.policy_table.consumer_friendly_messages.messages;

var insertInto = sqlBricks.insertInto;

/*
console.log('CREATE TABLE languages (' +
            '"name" CHAR(5) NOT NULL,' +
            'PRIMARY KEY ("name")' +
            ');') // create languages table with necessary columns
*/
console.log('INSERT INTO "languages" ("name")\nVALUES')

 // find the first message category and generate languages table from its languages
let languages = messages[Object.keys(messages)[0]].languages,
    sql = ''
for(var name in languages){
  // generate a single INSERT INTO statement by adding each as a value on a new line
  sql += insertInto('languages', 'name').values(name)
        .toString()
        .replace('INSERT INTO languages (name) VALUES ', '') + ',\n'
}
console.log(sql.slice(0, sql.length - 2) + ';') // drop the hanging comma and \n for an end of statement
/*
console.log('CREATE TABLE "message_text" ( ' +
            '"language_id" TEXT REFERENCES languages (name) ON UPDATE CASCADE ON DELETE CASCADE,' + // languages are verified and referenced from the languages table
            '"message_category" TEXT NOT NULL,' +
            '"tts" TEXT,' +
            '"line1" TEXT,' +
            '"line2" TEXT,' +
            '"text_body" TEXT,' +
            '"status" TEXT NOT NULL DEFAULT \'STAGING\',' +
            '"label" TEXT,' +
            '"created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),' +
            '"updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),' +
            'PRIMARY KEY (language_id, message_category)' +
            ');') // create message_text table with necessary columns
*/
console.log('INSERT INTO "message_text"("label", "language_id", "line1", "line2", "message_category","text_body", "tts")')
console.log('VALUES')
sql = ''
for(var message_category in messages){
  let languages = messages[message_category].languages
  // generate a single INSERT INTO statement for each as a value on a new line
  for(var id in languages){
    let language_id = languages[id]
    sql += insertInto('message_text', 'label', 'language_id', 'line1', 'line2', 'message_category', 'text_body', 'tts')
          .values(language_id.label, id, language_id.line1, language_id.line2, message_category, language_id.textBody, language_id.tts)
          .toString()
          .replace('INSERT INTO message_text (label, language_id, line1, line2, message_category, text_body, tts) VALUES ', '') + ',\n'
  }
}
console.log(sql.slice(0, sql.length - 2) + ';') // drop the hanging comma and \n for an end of statement
console.log('SELECT * FROM message_text ORDER BY message_category, language_id') //display the table and order by category first then id