const check = require('check-types');
const app = require('../app');
const setupSql = app.locals.db.setupSqlCommand;
const model = require('./model.js');
const parseXml = require('xml2js').parseString;
const needle = require('needle');
const githubLanguageSourceUrl = 'https://raw.githubusercontent.com/smartdevicelink/rpc_spec/master/MOBILE_API.xml';

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
    //base check
    if (!check.array(req.body.messages)) {
        res.parcel
            .setStatus(400)
            .setMessage("Required: messages (array)");
        return;
    }
    for (let i = 0; i < req.body.messages.length; i++) {
        const msg = req.body.messages[i];
        if (!check.string(msg.message_category) || !check.boolean(msg.is_deleted) ) {
            res.parcel
                .setStatus(400)
                .setMessage("Required for message: message_category (string), is_deleted (boolean)");
            return;
        }
        for (let j = 0; j < msg.languages.length; j++) {
            const lang = msg.languages[j];
            if (
                !check.string(lang.language_id)
                || !check.boolean(lang.selected)
                || (
                    !check.string(lang.line1)
                    && !check.string(lang.line2)
                    && !check.string(lang.tts)
                    && !check.string(lang.text_body)
                    && !check.string(lang.label)
                    )
                )
                {
                    res.parcel
                        .setStatus(400)
                        .setMessage("Required for language: language_id, selected, and at least one of the following: line1, line2, tts, text_body, label");
                    return;
            }
        }
    }
}

//helper functions

function getMessageGroups (isProduction, cb) {
    const LANG_FILTER = 'en-us';
    //need two pieces of info: all categories of a certain language (just en-us)
    //and the max id of every category. The first piece is so the message text preview is
    //in the language of the user, and the second category is in case an entry for that
    //category in that language doesn't exist, so fall back to another text
    const getMessagesFlow = app.locals.flow([
        setupSql.bind(null, app.locals.sql.getMessages.categoryByLanguage(isProduction, LANG_FILTER)),
        setupSql.bind(null, app.locals.sql.getMessages.categoryByMaxId(isProduction)),
        setupSql.bind(null, app.locals.sql.getMessages.status(isProduction)),
        setupSql.bind(null, app.locals.sql.getMessages.group(isProduction))
    ], {method: 'parallel'});

    const getCategoriesFlow = app.locals.flow([
        getMessagesFlow,
        model.combineMessageCategoryInfo
    ], {method: 'waterfall'});

    getCategoriesFlow(cb);
}

//for one id
function getMessageDetailsFlow (id) {
    const getInfoFlow = app.locals.flow([
        makeCategoryTemplateFlow(),
        setupSql.bind(null, app.locals.sql.getMessages.byId(id)),
        setupSql.bind(null, app.locals.sql.getMessages.groupById(id))
    ], {method: 'parallel'});

    return app.locals.flow([
        getInfoFlow,
        model.transformMessages
    ], {method: 'waterfall'});
}

function makeCategoryTemplateFlow () {
    const getTemplateInfo = app.locals.flow([
        setupSql.bind(null, app.locals.sql.getLanguages),
    ], {method: 'parallel'});

    return app.locals.flow([
        getTemplateInfo,
        generateCategoryTemplate
    ], {method: 'waterfall'});
}

//for an array of ids. filters out PRODUCTION records. meant solely for the promotion route
//doesn't make an object out of the data
function getMessagesDetailsSqlFlow (ids) {
    return app.locals.flow([
        setupSql.bind(null, app.locals.sql.getMessages.groupsByIds(ids)),
        setupSql.bind(null, app.locals.sql.getMessages.byIds(ids))
    ], {method: 'parallel'});
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

//pass an empty array in info[0] to not create the languages array in the template
function generateCategoryTemplate (info, next) {
    const languages = info[0];

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
    next(null, [template]);
}


//language-related functions

function updateLanguages (next) {
    const messageStoreFlow = [
        getRpcSpec,
        parseXml,
        extractLanguages,
        insertLanguages
    ];

    function insertLanguages (languages, next) {
        app.locals.flow(app.locals.db.setupSqlCommands(app.locals.sql.insert.languages(languages)), {method: 'parallel'})(next);
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
    getMessageGroups: getMessageGroups,
    getMessageDetailsFlow: getMessageDetailsFlow,
    makeCategoryTemplateFlow: makeCategoryTemplateFlow,
    getMessagesDetailsSqlFlow: getMessagesDetailsSqlFlow,
    validatePromote: validatePromote,
    validatePost: validatePost,
    updateLanguages: updateLanguages
}