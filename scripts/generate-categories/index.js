//Generates the SQL commands necessary to insert this data into the database. For dev use only.
//load the environment variables from the .env file in the same directory
require('dotenv').config({
	path: '../../.env'
});
const utils = require('../utils.js');
const sql = require('sql-bricks'); //generates SQL statements to be logged to the console
let outputBuffer = ""; //what will get written to file
const outputFileName = 'output.log'; //the name of the output file
const shaid = require('../../lib/shaid'); //module for communicating with SHAID

//CATEGORIES OUTPUT
shaid.getCategories({}, function (err, res) {
	const catObjs = res.map(function (category) {
		return {
		    id: category.id,
		    display_name: category.display_name
		};
	});


    const categoryStatement = catObjs.map(function (category) {
        return `
INSERT INTO categories (id, display_name)
SELECT ${category.id} AS id, '${category.display_name}' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = ${category.id}
    AND c.display_name = '${category.display_name}'
);
    `
    });

    writeToBuffer(categoryStatement.join(''));
	
	//write to file and finish
	utils.writeToFile(outputFileName, outputBuffer);
});

function writeToBuffer (string) {
    outputBuffer += string;   
}
