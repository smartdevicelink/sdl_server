const app = require('../app');
const setupSqlCommands = app.locals.db.setupSqlCommands;
const sqlBrick = require('sql-bricks-postgres');
const async = require('async');

function combineMessageCategoryInfo (messageInfo, next) {
    const filteredCategories = messageInfo.categoryByLanguage;
    const fallbackCategories = messageInfo.categoryByMaxId;
    const allMessages = messageInfo.messageStatuses; //for finding how many languages exist per category
    const groups = messageInfo.messageGroups;

    //add fallback categories first by category name, then use filtered categories for overwriting
    let groupsHash = {};
    for (let i = 0; i < groups.length; i++) {
        groupsHash[groups[i].message_category] = groups[i];
        groupsHash[groups[i].message_category].languages = [];
    }

    let tempHash = {};
    for (let i = 0; i < fallbackCategories.length; i++) {
        tempHash[fallbackCategories[i].message_category] = fallbackCategories[i];
    }
    for (let i = 0; i < filteredCategories.length; i++) {
        tempHash[filteredCategories[i].message_category] = filteredCategories[i];
    }

    //add language count for each category
    for (let i = 0; i < allMessages.length; i++) {
        if (tempHash[allMessages[i].message_category].language_count === undefined) {
            tempHash[allMessages[i].message_category].language_count = 0;
        }
        tempHash[allMessages[i].message_category].language_count++;
    }

    //if there's a deleted category, the tempHash may have those deleted categories included
    //because it's using a different query, and we do not want that info for the groupsHash if that happens
    //combine the two hashes
    for (let category in tempHash) {
        const textInfo = tempHash[category];
        if (groupsHash[category]) { //existence check
            groupsHash[category].text = textInfo.tts; //attach the tts to a custom property so the UI can display a message
            groupsHash[category].language_count = textInfo.language_count;
        }
    }

    let categories = [];
    for (let category in groupsHash) {
        categories.push(groupsHash[category]);
    }

    next(null, categories);
}

function convertToInsertableGroup(messageGroupObj, statusOverride = null){
    return {
        message_category: messageGroupObj.message_category || null,
        status: statusOverride || messageGroupObj.status || null,
        is_deleted: messageGroupObj.is_deleted || false
    };
}

function convertToInsertableText (messageTextObj, messageGroupIdOverride = null) {
    return {
        language_id: messageTextObj.language_id || null,
        tts: messageTextObj.tts || null,
        line1: messageTextObj.line1 || null,
        line2: messageTextObj.line2 || null,
        text_body: messageTextObj.text_body || null,
        label: messageTextObj.label || null,
        message_group_id: messageGroupIdOverride || messageTextObj.message_group_id || null
    };
}

function insertMessagesWithTransaction (isProduction, rawMessageGroups, callback) {
    let wf = {},
        status = isProduction ? "PRODUCTION" : "STAGING";

    app.locals.db.runAsTransaction(function (client, callback) {
        // process message groups synchronously (due to the SQL transaction)
        async.eachSeries(rawMessageGroups, function (rawMessageGroup, callback) {
            let insertedGroup = null;
            async.waterfall([
                function (callback) {
                    // clean the message group object for insertion and insert it into the db
                    let messageGroup = convertToInsertableGroup(rawMessageGroup, status);
                    let insert = sqlBrick.insert('message_group', messageGroup).returning('*');
                    client.getOne(insert.toString(), callback);
                },
                function (group, callback) {
                    insertedGroup = group;
                    // filter out any unselected languages
                    async.filter(rawMessageGroup.languages, function (obj, callback) {
                        callback(null, (isProduction || obj.selected));
                    }, callback);
                },
                function (selectedLanguages, callback) {
                    // generate array of clean message text objects and do bulk insert
                    let messageGroupTexts = selectedLanguages.map(function (obj) {
                        return convertToInsertableText(obj, insertedGroup.id);
                    });
                    if (messageGroupTexts.length < 1) {
                        callback(null, []);
                        return;
                    }
                    let insert = sqlBrick.insert('message_text', messageGroupTexts).returning('*');
                    client.getMany(insert.toString(), callback);
                }
            ], callback);
        }, callback);
    }, function (err,result) {
        // done either successfully or post-rollback
        callback(err);
    });
}

// take an array of message groups and message languages and merge them
function mergeLanguagesIntoGroups (messageGroups, messageLanguages, callback){
    async.each(messageGroups, function (group, callback) {
        async.filter(messageLanguages, function (language, callback) {
            callback(null, language.message_group_id == group.id);
        }, function (err, languages) {
            group.languages = languages;
            callback();
        });
    }, function (err) {
        callback(err, messageGroups);
    });
}

function hashifyTemplate (template) {
    let languageHash = {};
    for (let i = 0; i < template.languages.length; i++) {
        languageHash[template.languages[i].language_id] = template.languages[i];
    }
    template.languages = languageHash;
    return template;
}

function arrayifyTemplate (template) {
    let languageArray = [];
    for (let lang in template.languages) {
        languageArray.push(template.languages[lang]);
    }
    template.languages = languageArray;
    return template;
}

function transformMessages (info, next) {
    let template = info[0][0]; //comes back as an array of messages
    const texts = info[1];
    const group = info[2][0];
    const attachedFuncGroups = info[3].map(function (elem) {
        return elem.property_name
    });

    if (!group) {
        return next(null, []);
    }

    template = hashifyTemplate(template);

    //fill out the base object first
    template.id = group.id;
    template.message_category = group.message_category;
    template.status = group.status;
    template.created_ts = group.created_ts;
    template.updated_ts = group.updated_ts;
    template.is_deleted = group.is_deleted;
    template.functional_group_names = attachedFuncGroups;

    //fill out the languages hash
    for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        template.languages[text.language_id] = {
            id: text.id,
            language_id: text.language_id,
            selected: true,
            message_category_id: text.message_group_id,
            line1: text.line1,
            line2: text.line2,
            tts: text.tts,
            text_body: text.text_body,
            label: text.label
        }
    }

    template = arrayifyTemplate(template);

    next(null, [template]);
}

module.exports = {
    combineMessageCategoryInfo: combineMessageCategoryInfo,
    transformMessages: transformMessages,
    insertMessagesWithTransaction: insertMessagesWithTransaction,
    mergeLanguagesIntoGroups: mergeLanguagesIntoGroups
}
