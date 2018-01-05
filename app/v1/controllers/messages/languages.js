const parseXml = require('xml2js').parseString;
const needle = require('needle');
const app = require('../../app');
const githubLanguageSourceUrl = 'https://raw.githubusercontent.com/smartdevicelink/rpc_spec/master/MOBILE_API.xml';
const setupInsertsSql = app.locals.sql.setupSqlInsertsNoError;

function updateLanguages (next) {
    const messageStoreFlow = [
        getRpcSpec,
        parseXml,
        extractLanguages,
        insertLanguages
    ];

    function insertLanguages (languages, next) {
        app.locals.flow(setupInsertsSql(app.locals.sql.insert.languages(languages)), {method: 'parallel'})(next);
    }

    app.locals.flow(messageStoreFlow, {method: 'waterfall'})(function (err, res) {
        if (next) {
           next(); //done 
        }
    });
}

function getRpcSpec (next) {
    needle.get(githubLanguageSourceUrl, function (err, res) {
        next(err, res.body);
    });
}

function extractLanguages (rpcSpec, next) {
    const languages = rpcSpec.interface.enum.find(function (elem) {
        return elem['$'].name === "Language";
    }).element.map(function (language) {
        return language['$'].name.toLowerCase();
    });
    next(null, languages);
}

module.exports = {
    updateLanguages: updateLanguages
}