//Generates the SQL commands necessary to insert this data into the database. For dev use only.
const utils = require('../utils.js');
const sql = require('sql-bricks'); //generates SQL statements to be logged to the console
let outputBuffer = ""; //what will get written to file
const outputFileName = 'output.log'; //the name of the output file

//HMI LEVELS OUTPUT
const hmiLevelObjs = [
    {
        id: "HMI_FULL"
    },
    {
        id: "HMI_LIMITED"
    },
    {
        id: "HMI_BACKGROUND"
    },
    {
        id: "HMI_NONE"
    }
];


const hmiLevelStatement = hmiLevelObjs.map(function (hmiLevelObj) {
    return `
INSERT INTO hmi_levels (id)
SELECT '${hmiLevelObj.id}' AS id
WHERE NOT EXISTS (
    SELECT * FROM hmi_levels hl
    WHERE hl.id = '${hmiLevelObj.id}'
);
`
});

writeToBuffer(hmiLevelStatement.join(''));

//write to file and finish
utils.writeToFile(outputFileName, outputBuffer);

function writeToBuffer (string) {
    outputBuffer += string;   
}
