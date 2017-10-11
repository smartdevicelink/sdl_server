const fs = require('fs');

module.exports = {
	writeToFile: writeToFile,
	formatInsertOutput: formatInsertOutput
}

function writeToFile (fileName, string) {
    fs.writeFile(fileName, string, function (err) {
        if (err) {
            console.log(err);
        }
    });    
}

function formatInsertOutput (insertString) {
	insertString = insertString + ';';
	const insertStatement = insertString.split("VALUES")[0] + '\n';
	const valuesStatement = insertString.split("VALUES")[1].trim().replace(/\), /g, '),\n');
	return insertStatement + 'VALUES\n' + valuesStatement + '\n\n';
}