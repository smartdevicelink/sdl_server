const app = require('../../app');
const utils = require('../policy/utils.js');

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

    //combine the two hashes
    for (let category in tempHash) {
        const textInfo = tempHash[category];
        groupsHash[category].text = textInfo.tts; //attach the tts to a custom property so the UI can display a message
        groupsHash[category].language_count = textInfo.language_count;
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

function convertMessagesJson (messagesObj, isProduction) {
    let statusName = "";
    if (isProduction) {
        statusName = 'PRODUCTION';
    }
    else {
        statusName = 'STAGING';
    }

    //get all the group-related information first
    const messageGroups = messagesObj.messages.map(function (msg) {
        return {
            message_category: msg.message_category,
            status: statusName,
            is_deleted: msg.is_deleted
        };
    });
    //now get all the message text information
    let messageTexts = [];
    for (let i = 0; i < messagesObj.messages.length; i++) {
        const category = messagesObj.messages[i].message_category;
        const langs = messagesObj.messages[i].languages;
        for (let j = 0; j < langs.length; j++) {
            const text = langs[j];
            messageTexts.push({
                language_id: text.language_id,
                tts: text.tts,
                line1: text.line1,
                line2: text.line2,
                text_body: text.text_body,
                label: text.label,
                message_category: category
            });
        }        
    }
    
    return [messageGroups, messageTexts];
}

// function convertMessagesJson (messagesObj, isProduction) {
//     let statusName = "";
//     if (isProduction) {
//         statusName = 'PRODUCTION';
//     }
//     else {
//         statusName = 'STAGING';
//     }
//     //break the JSON down into smaller objects for SQL insertion
//     let messagesArray = [];
//     for (let lang in messagesObj.messages) {
//         messagesArray.push(messagesObj.messages[lang]);
//     }
//     //remove entries with selected = false
//     messagesArray = messagesArray.filter(function (msg) {
//         return msg.selected;
//     });

//     //all messages should change to isProduction status
//     return messagesArray.map(function (msg) {
//         return {
//             language_id: msg.language_id,
//             message_category: msg.message_category,
//             label: msg.label,
//             line1: msg.line1,
//             line2: msg.line2,
//             text_body: msg.text_body,
//             tts: msg.tts,        
//             status: statusName,
//             is_deleted: msg.is_deleted
//         };
//     });
// }

module.exports = {
    combineMessageCategoryInfo: combineMessageCategoryInfo,
    transformMessages: transformMessages,
    generateCategoryTemplate: generateCategoryTemplate,
    convertMessagesJson: convertMessagesJson
}