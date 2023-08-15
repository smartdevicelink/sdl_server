const check = require('check-types');
const app = require('../app');
const setupSql = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');
const model = require('./model.js');
const parseXml = require('xml2js').parseString;
const https = require('https');
const promisify = require('util').promisify;

//validation functions

function validatePromote (req, res) {
    if (!check.array(req.body.id) && !check.number(req.body.id)) {
        res.parcel
            .setStatus(400)
            .setMessage("Required: id (array) or id (number)");
    }
    return;
}

function validatePost (req, res) {
    if (!check.array(req.body.messages)) {
        res.parcel
            .setStatus(400)
            .setMessage("Required: messages (array)");
        return;
    }
    for (let i = 0; i < req.body.messages.length; i++) {
        let foundEnUsObj = false;
        const msg = req.body.messages[i];
        if (!check.string(msg.message_category) || !check.boolean(msg.is_deleted) ) {
            res.parcel
                .setStatus(400)
                .setMessage("Required for message: message_category (string), is_deleted (boolean)");
            return;
        }
        for (let j = 0; j < msg.languages.length; j++) {
            const lang = msg.languages[j];
            if (lang.language_id === 'en-us' && lang.selected === true) {
                foundEnUsObj = true;
            }
            if (
                !check.string(lang.language_id)
                || !check.boolean(lang.selected)
                )
                {
                    res.parcel
                        .setStatus(400)
                        .setMessage("Required for language: language_id, selected");
                    return;
            }
        }
        if (!foundEnUsObj) {
            res.parcel
                .setStatus(400)
                .setMessage("There must be a en-us language object defined");
            return;
        }
    }
}

//helper functions

async function getMessageGroups (isProduction, alwaysHideDeleted) {
    //TODO: make the language choice configurable
    const LANG_FILTER = 'en-us';
    //need two pieces of info: all categories of a certain language (just en-us)
    //and the max id of every category. The first piece is so the message text preview is
    //in the language of the user, and the second category is in case an entry for that
    //category in that language doesn't exist, so fall back to another text
    const messageInfo = {
        categoryByLanguage: app.locals.db.asyncSql(sql.getMessages.categoryByLanguage(isProduction, LANG_FILTER)),
        categoryByMaxId: app.locals.db.asyncSql(sql.getMessages.categoryByMaxId(isProduction)),
        messageStatuses: app.locals.db.asyncSql(sql.getMessages.status(isProduction)),
        messageGroups: app.locals.db.asyncSql(sql.getMessages.group(isProduction, null, alwaysHideDeleted))
    };

    for (let prop in messageInfo) {
        messageInfo[prop] = await messageInfo[prop]; // resolve all promises into each property
    }

    return await model.combineMessageCategoryInfo(messageInfo);
}

//for one id
async function getMessageDetails (id) {
    const info = await Promise.all([
        makeCategoryTemplate(),
        app.locals.db.asyncSql(sql.getMessages.byId(id)),
        app.locals.db.asyncSql(sql.getMessages.groupById(id)),
        app.locals.db.asyncSql(sql.getAttachedFunctionalGroupsById(id))
    ]);

    return await model.transformMessages(info);
}

async function makeCategoryTemplate () {
    const languages = await app.locals.db.asyncSql(sql.getLanguages);

    let template = getBaseTemplate();

    for (let i = 0; i < languages.length; i++) {
        const lang = languages[i].id;
        template.languages.push({
            id: 0,
            language_id: lang,
            selected: false,
            message_category_id: 0,
            line1: "",
            line2: "",
            tts: "",
            text_body: "",
            label: ""
        });
    }
    return [template];
}

//for an array of ids. filters out PRODUCTION records. meant solely for the promotion route
//doesn't make an object out of the data
async function getMessagesDetailsSql (ids) {
    return await Promise.all([
        app.locals.db.asyncSql(sql.getMessages.groupsByIds(ids)),
        app.locals.db.asyncSql(sql.getMessages.byIds(ids)),
    ]);
}

function getBaseTemplate () {
    return {
        id: 0,
        message_category: "",
        status: "",
        is_deleted: false,
        created_ts: 0,
        updated_ts: 0,
        languages: []
    };
}

//language-related functions

async function updateLanguages () {
    const rpcSpec = await getRpcSpec();
    const parsedSpec = await promisify(parseXml)(rpcSpec); 
    const languages = await extractLanguages(parsedSpec);
    await app.locals.db.asyncSqls(sql.insert.languages(languages));

    app.locals.log.info("Language list updated");
}

async function getRpcSpec () {
    return new Promise(resolve => {
        https.request(app.locals.config.rpcSpecXmlUrl, { method: 'GET' }, (response) => {
            let aggregateResponse = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                aggregateResponse += chunk;
            });
            response.on('end', () => {
                resolve(aggregateResponse);
            })
        }).end();
    });
}

async function extractLanguages (rpcSpec) {
    const languages = rpcSpec.interface.enum.find(function (elem) {
        return elem['$'].name === "Language";
    }).element.map(function (language) {
        return language['$'].name.toLowerCase();
    });
    return languages;
}

async function getMessageNamesStaging () {
    const names = await app.locals.db.asyncSql(sql.getMessageNamesStaging);
    return names.map(elem => elem.message_category);
}

module.exports = {
    getRpcSpec: getRpcSpec,
    getMessageGroups: getMessageGroups,
    getMessageDetails: getMessageDetails,
    makeCategoryTemplate: makeCategoryTemplate,
    getMessagesDetailsSql: getMessagesDetailsSql,
    validatePromote: validatePromote,
    validatePost: validatePost,
    updateLanguages: updateLanguages,
    getMessageNamesStaging: getMessageNamesStaging
}
