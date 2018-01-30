const app = require('../../app');
const utils = require('../policy/utils.js');
const setupSqlCommands = app.locals.sql.setupSqlCommands;
const setupInsertsSql = app.locals.sql.setupSqlInsertsNoError;

function combineMessageCategoryInfo (messageInfo, next) {
    const filteredCategories = messageInfo[0];
    const fallbackCategories = messageInfo[1];
    const allMessages = messageInfo[2]; //for finding how many languages exist per category
    const groups = messageInfo[3];

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
    template = hashifyTemplate(template);

    //fill out the base object first
    template.id = group.id;
    template.message_category = group.message_category;
    template.status = group.status;
    template.created_ts = group.created_ts;
    template.updated_ts = group.updated_ts;
    template.is_deleted = group.is_deleted;

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

function convertMessagesJson (messagesObj) {
    //get all the group-related information first
    const messageGroups = messagesObj.messages.map(function (msg) {
        return {
            id: msg.id, //keep the ID for future use
            message_category: msg.message_category,
            status: msg.status,
            is_deleted: msg.is_deleted
        };
    });

    //now get all the message text information, filtering out unselected messages
    let messageTexts = [];
    for (let i = 0; i < messagesObj.messages.length; i++) {
        const langs = messagesObj.messages[i].languages;
        for (let j = 0; j < langs.length; j++) {
            const text = langs[j];
            if (text.selected) {
                messageTexts.push({
                    language_id: text.language_id,
                    tts: text.tts,
                    line1: text.line1,
                    line2: text.line2,
                    text_body: text.text_body,
                    label: text.label,
                    message_group_id: text.message_category_id //for future reference
                });                
            }
        }        
    }
    
    return [messageGroups, messageTexts];
}


//accepts SQL-like data of message groups and message texts, along with a status to alter the message groups' statuses
//inserts message group and message text information, automatically linking together texts to their groups
//execute immediately
function insertMessageSqlFlow (isProduction, data, next) {
    const messageGroups = data[0];
    const messageTexts = data[1];

    let statusName;
    if (isProduction) {
        statusName = "PRODUCTION";
    }
    else {
        statusName = "STAGING";
    }

    for (let i = 0; i < messageGroups.length; i++) {
        //group status should be changed to whatever the parent function wants
        messageGroups[i].status = statusName;
    }

    //insert message groups
    const insertGroups = app.locals.flow(setupSqlCommands(app.locals.sql.insert.messageGroups(messageGroups)), {method: 'parallel'});
    insertGroups(function (err, res) {
        //flatten the nested arrays to get one array of groups
        const newGroups = res.map(function (elem) {
            return elem[0];
        });

        //create a link between the old message group and the new one using the message category
        //use the old message group to find the matching message group id of the message text
        //use the new message group to replace the message text with the new message group id
        let newGroupCategoryToIdHash = {}; //category to new id
        for (let i = 0; i < newGroups.length; i++) {
            newGroupCategoryToIdHash[newGroups[i].message_category] = newGroups[i].id;
        }
        let oldGroupIdtoIdHash = {}; //old id to category to new id
        for (let i = 0; i < messageGroups.length; i++) {
            oldGroupIdtoIdHash[messageGroups[i].id] = newGroupCategoryToIdHash[messageGroups[i].message_category];
        }        
        //add group id to each message
        for (let i = 0; i < messageTexts.length; i++) {
            messageTexts[i].message_group_id = oldGroupIdtoIdHash[messageTexts[i].message_group_id];
        }

        //insert message texts
        const insertTexts = app.locals.flow(setupInsertsSql(app.locals.sql.insert.messageTexts(messageTexts)), {method: 'parallel'});
        insertTexts(function (err, res) {
            next(); //done
        });
    });
}

module.exports = {
    combineMessageCategoryInfo: combineMessageCategoryInfo,
    transformMessages: transformMessages,
    generateCategoryTemplate: generateCategoryTemplate,
    convertMessagesJson: convertMessagesJson,
    insertMessageSqlFlow: insertMessageSqlFlow
}