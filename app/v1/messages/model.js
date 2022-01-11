const app = require('../app');
const setupSqlCommands = app.locals.db.setupSqlCommands;
const sqlBrick = require('sql-bricks-postgres');

async function combineMessageCategoryInfo (messageInfo) {
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

    return categories;
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

async function insertMessagesWithTransaction (isProduction, rawMessageGroups) {
    let wf = {},
        status = isProduction ? "PRODUCTION" : "STAGING";

    await app.locals.db.asyncTransaction(async client => {
        // process message groups synchronously (due to the SQL transaction)
        for (let rawMessageGroup of rawMessageGroups) {
            // clean the message group object for insertion and insert it into the db
            let messageGroup = convertToInsertableGroup(rawMessageGroup, status);
            const insertedGroup = await client.getOne(sqlBrick.insert('message_group', messageGroup).returning('*').toString());
            // filter out any unselected languages
            const selectedLanguages = rawMessageGroup.languages.filter(obj => isProduction || obj.selected);
            // generate array of clean message text objects and do bulk insert
            let messageGroupTexts = selectedLanguages.map(obj => convertToInsertableText(obj, insertedGroup.id));
            if (messageGroupTexts.length < 1) {
                continue;
            }
            client.getMany(sqlBrick.insert('message_text', messageGroupTexts).returning('*').toString());
        }
    });
}

// take an array of message groups and message languages and merge them
async function mergeLanguagesIntoGroups (messageGroups, messageLanguages) {
    messageGroups.forEach(group => {
        group.languages = messageLanguages.filter(language => language.message_group_id == group.id);
    });
    return messageGroups;
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

function transformMessages (info) {
    let template = info[0][0]; //comes back as an array of messages
    const texts = info[1];
    const group = info[2][0];
    const attachedFuncGroups = info[3].map(function (elem) {
        return elem.property_name
    });

    if (!group) {
        return [];
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

    return [template];
}

module.exports = {
    combineMessageCategoryInfo: combineMessageCategoryInfo,
    transformMessages: transformMessages,
    insertMessagesWithTransaction: insertMessagesWithTransaction,
    mergeLanguagesIntoGroups: mergeLanguagesIntoGroups
}
