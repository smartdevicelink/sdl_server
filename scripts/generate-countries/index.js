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
shaid.getCountries({}, function (err, res) {
    const countryObjs = res.map(function (country) {
        return { 
            iso: country.iso,
            name: country.name
        };
    });

    const countryStatement = countryObjs.map(function (countryObj) {
        countryObj.name = doubleUp(countryObj.name);
        return `
INSERT INTO countries (iso, name)
SELECT '${countryObj.iso}' AS iso, '${countryObj.name}' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = '${countryObj.iso}'
    AND c.name = '${countryObj.name}'
);
    `
    });

    writeToBuffer(countryStatement.join(''));
    
    //write to file and finish
    utils.writeToFile(outputFileName, outputBuffer);
});

function writeToBuffer (string) {
    outputBuffer += string;   
}

function doubleUp (name) {
    return name.replace("'", "''");
}