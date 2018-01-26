const app = require('../../app');
const setupSql = app.locals.sql.setupSqlCommand;
const setupInsertsSql = app.locals.sql.setupSqlInsertsNoError;
const messageUtils = require('./messages');
const languages = require('./languages');
const check = require('check-types');

// const exFlow = app.locals.flow([
//     setupSql(app.locals.sql.getMessages.info(true))
// ], {method: 'waterfall'});
// exFlow(function (err, messages) {
//     //console.log(JSON.stringify(messages, null, 4));
// }); 

//need two pieces of info: all categories of a certain language (just en-us)
//and the max id of every category. The first piece is so the message text preview is
//in the language of the user, and the second category is in case an entry for that
//category in that language doesn't exist, so fall back to another text
function getMessageGroups (isProduction, cb) {
    const LANG_FILTER = 'en-us';

    const getMessagesFlow = app.locals.flow([
        setupSql(app.locals.sql.getMessages.categoryByLanguage(isProduction, LANG_FILTER)),
        setupSql(app.locals.sql.getMessages.categoryByMaxId(isProduction)),
        setupSql(app.locals.sql.getMessages.status(isProduction)),
        setupSql(app.locals.sql.getMessages.group(isProduction))
    ], {method: 'parallel'});

    const getCategoriesFlow = app.locals.flow([
        getMessagesFlow,
        messageUtils.combineMessageCategoryInfo
    ], {method: 'waterfall'});

    getCategoriesFlow(cb);
}

function getInfo (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    const returnTemplate = !!req.query.template; //coerce to boolean
    if (returnTemplate) { //template mode. return just the shell of a message
        chosenFlow = makeCategoryTemplateFlow();
    }
    else if (req.query.id) { //get messages of a specific id 
        chosenFlow = getMessageDetailsFlow(req.query.id);
    }
    /*
    else if (req.query.category) { //filter by message category. this is the 'detailed' mode
        chosenFlow = getCategoryInfoFlow(isProduction, req.query.category);
    }
    */
    else { //get all message info at the highest level, filtering in PRODUCTION or STAGING mode
        chosenFlow = getMessageGroups.bind(null, isProduction);
    }

    chosenFlow(function (err, messages) {
        if (err) {
            app.locals.log.error(err);
            return res.sendStatus(500);
        }
        return res.status(200).send({messages: messages}); 
    }); 
}

function getMessageDetailsFlow (id) {
    const getInfoFlow = app.locals.flow([
        makeCategoryTemplateFlow(),
        setupSql(app.locals.sql.getMessages.byId(id)),
        setupSql(app.locals.sql.getMessages.groupById(id))
    ], {method: 'parallel'});

    return app.locals.flow([
        getInfoFlow,
        messageUtils.transformMessages
    ], {method: 'waterfall'});
}

function getCategoryInfoFlow (isProduction, category) {
    const getInfoFlow = app.locals.flow([
        makeCategoryTemplateFlow(),
        setupSql(app.locals.sql.getMessages.byCategory(isProduction, category)),
        setupSql(app.locals.sql.getMessages.group(isProduction, category))
    ], {method: 'parallel'});

    return app.locals.flow([
        getInfoFlow,
        messageUtils.transformMessages
    ], {method: 'waterfall'});
}

function makeCategoryTemplateFlow () {
    const getTemplateInfo = app.locals.flow([
        setupSql(app.locals.sql.getLanguages),
    ], {method: 'parallel'});

    return app.locals.flow([
        getTemplateInfo,
        messageUtils.generateCategoryTemplate
    ], {method: 'waterfall'});
}

function post (isProduction) {
    return function (req, res, next) {
        validatePost(req, res);
        if (res.errorMsg) {
            return res.status(400).send({ error: res.errorMsg });
        }    
        const messageFlow = addMessageFlow(req.body, isProduction);
        if (messageFlow) {
            messageFlow(function () {
                res.sendStatus(200);
            });
        }
        else {
            res.status(400).send({ error: "No messages to save" });
        }
    }
}

function addMessageFlow (messages, isProduction) {
    const newData = messageUtils.convertMessagesJson(messages, isProduction);
    const messageGroups = newData[0];
    const messageTexts = newData[1];

    if (messageGroups.length === 0) { //the format of the request is correct, but there's no messages to actually store!
        return null;
    }
    //store the sets of data
    return flow([
        flow(setupInsertsSql(app.locals.sql.insert.messageGroups(messageGroups)), {method: 'parallel'}),
        flow(setupInsertsSql(app.locals.sql.insert.messageTexts(messageTexts)), {method: 'parallel'})
    ], {method: 'series'});
}

function validatePost (req, res) {
    //base check
    if (!check.object(req.body.messages)) {
        return res.errorMsg = "Required: messages (object)"
    }
    for (let lang in req.body.messages) {
        const langObj = req.body.messages[lang];
        if (!check.string(langObj.language_id) || !check.string(langObj.message_category) ) {
            return res.errorMsg = "Required for message: language_id, message_category";
        }
    }
}
/*
function del (req, res, next) {
    validateDelete(req, res);
    if (res.errorMsg) {
        return res.status(400).send({ error: res.errorMsg });
    }
    const deleteFlow = flow([
        setupSql(app.locals.sql.delete.messageCategory(req.body.message_category))
    ], {method: 'series'});

    deleteFlow(function () {
        res.sendStatus(200);
    });
}
*/
function validateDelete (req, res) {
    if (!check.number(req.body.message_category)) {
        return res.errorMsg = "Required for deletion: message_category";
    }
}

function postUpdate (req, res, next) {
    languages.updateLanguages(function (err) {
        if (err) {
            return res.sendStatus(500);
        }
        return res.sendStatus(200);
    });
}

module.exports = {
    getInfo: getInfo,
    getMessageGroups: getMessageGroups, //used by the groups module
    postAddMessage: post(false),
    postPromoteMessage: post(true),
    //delete: del,
    postUpdate: postUpdate,
    updateLanguages: languages.updateLanguages
};
