//Generates the SQL commands necessary to insert this data into the database. For dev use only.
const path = require('path');
const utils = require('../utils.js');
const policy = require(path.resolve('../policy.json'));
const sql = require('sql-bricks'); //generates SQL statements to be logged to the console
const messages = policy.policy_table.consumer_friendly_messages.messages; //consumer friendly messages object
let outputBuffer = ""; //what will get written to file
const outputFileName = 'output.log'; //the name of the output file

//LANGUAGE DEFINITION OUTPUT
//find the first message category and generate the languages table from its languages
const languages = messages[Object.keys(messages)[0]].languages;
const languageNameObjs = Object.keys(languages).map(function (languageName) {
	return {
		id: languageName
	};
});
const languageStatement = sql.insert('languages').values(languageNameObjs).toString();
writeToBuffer(utils.formatInsertOutput(languageStatement));

//CONSUMER FRIENDLY MESSAGE OUTPUT
//transform the language text into SQL insertion statements
let messageObjs = [];
for (let messageCategory in messages) {
	const catObj = messages[messageCategory];
	const languageObjs = Object.keys(catObj.languages).map(function (languageName) {
		const langObj = catObj.languages[languageName];
		return {
			label: langObj.label,
			language_id: languageName,
			line1: langObj.line1,
			line2: langObj.line2,
			message_category: messageCategory,
			text_body: langObj.text_body,
			tts: langObj.tts
		};
	});
	messageObjs = messageObjs.concat(languageObjs);
}

const messageStatement = sql.insert('message_text').values(messageObjs).toString();
writeToBuffer(utils.formatInsertOutput(messageStatement));

//write to file and finish
utils.writeToFile(outputFileName, outputBuffer);

function writeToBuffer (string) {
    outputBuffer += string;   
}
