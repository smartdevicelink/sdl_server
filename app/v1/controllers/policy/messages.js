const utils = require('./utils');

function messagesSkeleton (isProduction) {
    return function (results, next) {
        const finalMessages = utils.filterArrayByStatus(results, ['message_category', 'language_id'], isProduction);

        //transform the arrays into hashes, slowly constructing the full object from the pruned finalMessages
        function transGeneric (property) {
            return function (element) {
                return [
                    element['message_category'],
                    'languages',
                    element['language_id'],
                    property,
                    element[property]
                ];
            }
        }
        let finalHash = utils.hashify({}, finalMessages, transGeneric('tts'));
        finalHash = utils.hashify(finalHash, finalMessages, transGeneric('line1'));
        finalHash = utils.hashify(finalHash, finalMessages, transGeneric('line2'));
        finalHash = utils.hashify(finalHash, finalMessages, transGeneric('text_body'));
        finalHash = utils.hashify(finalHash, finalMessages, transGeneric('label'));

        const finalObj = {
            "version": "000.000.001", //TODO: what to do with the versioning?
            "messages": hashToMessagesObject(finalHash)
        }
        next(null, finalObj);
    }
}

//transform the hash into a valid consumer friendly message object under the keys
//modifies the original object
function hashToMessagesObject (hash) {
    for (let category in hash) {
        const languages = hash[category].languages;
        //store values as just strings and not as objects
        for (let language in languages) {
            let langText = languages[language];
            const tts = Object.keys(langText.tts)[0];
            const line1 = Object.keys(langText.line1)[0];
            const line2 = Object.keys(langText.line2)[0];
            const textBody = Object.keys(langText.text_body)[0];
            const label = Object.keys(langText.label)[0];
            //clear langText and replace it
            langText = {};
            if (tts !== "null") {
                langText.tts = tts;
            }
            if (line1 !== "null") {
                langText.line1 = line1;
            }
            if (line2 !== "null") {
                langText.line2 = line2;
            }
            if (textBody !== "null") {
                langText.textBody = textBody;
            }
            if (label !== "null") {
                langText.label = label;
            }
            languages[language] = langText;
        }
    }
    return hash;
}


module.exports = {
    messagesSkeleton: messagesSkeleton
}