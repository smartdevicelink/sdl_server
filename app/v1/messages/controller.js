const app = require('../app');
const check = require('check-types');
const model = require('./model.js');
const helper = require('./helper.js');
const sql = require('./sql.js');
const cache = require('../../../custom/cache');

async function getInfo (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    const returnTemplate = !!req.query.template; //coerce to boolean
    //if hide_deleted is true, then always hide deleted consumer messages regardless of environment
    //this is only for getting functional group details
    const alwaysHideDeleted = req.query.hide_deleted && req.query.hide_deleted == 'true' ? true: false;

    try {
        let messages;
        if (returnTemplate) { //template mode. return just the shell of a message
            messages = await helper.makeCategoryTemplate();
        }
        else if (req.query.id) { //get messages of a specific id. this is the 'detailed' mode
            if (Number.isNaN(Number(req.query.id))) {
                return res.parcel.setStatus(400).setMessage("id must be an integer").deliver();
            }
            messages = await helper.getMessageDetails(req.query.id);
        }
        else { //get all message info at the highest level, filtering in PRODUCTION or STAGING mode
            messages = await helper.getMessageGroups(isProduction, alwaysHideDeleted);
        }
        return res.parcel
            .setStatus(200)
            .setData({
                "messages": messages
            })
            .deliver();
    } catch (err) {
        app.locals.log.error(err);
        return res.parcel.setStatus(500).deliver();
    }
}

async function postStaging (req, res, next) {
    helper.validatePost(req, res);
    if (res.parcel.message) {
        return res.parcel.deliver();
    }
    try {
        await model.insertMessagesWithTransaction(false, req.body.messages);
        cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
        res.parcel.setStatus(200);
        res.parcel.deliver();
    } catch (err) {
        app.locals.log.error(err);
        res.parcel
            .setMessage("Interal server error")
            .setStatus(500);
        res.parcel.deliver();
    }
}

async function promoteIds (req, res, next) {
    helper.validatePromote(req, res);
    if (res.parcel.message) {
		return res.parcel.deliver();
	}
    //make sure the data in id is an array in the end
    if (check.number(req.body.id)) {
        req.body.id = [req.body.id];
    }

    try {
        const results = await Promise.all([
            app.locals.db.asyncSql(sql.getMessages.groupsByIds(req.body.id)),
            app.locals.db.asyncSql(sql.getMessages.byIds(req.body.id))
        ]);
        //get all the info from the ids and insert them
        const messageGroups = await model.mergeLanguagesIntoGroups(results[0], results[1]);
        await model.insertMessagesWithTransaction(true, messageGroups);
        
        cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
        res.parcel.setStatus(200);
        res.parcel.deliver();
    } catch (err) {
        app.locals.log.error(err);
        res.parcel
            .setMessage("Interal server error")
            .setStatus(500);
        res.parcel.deliver();
    }
}

async function postUpdate (req, res, next) {
    try {
        await helper.updateLanguages();
        cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
        cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
        res.parcel
            .setStatus(200)
            .deliver();
    } catch (err) {
        return res.parcel
            .setStatus(500)
            .deliver();
    }
}

async function getMessageNamesStaging (req, res, next) {
    try {
        const names = await helper.getMessageNamesStaging();
        return res.parcel
            .setStatus(200)
            .setData({
                "names": names
            })
            .deliver(); 
    } catch (err) {
        app.locals.log.error(err);
        return res.parcel
            .setStatus(500)
            .setMessage("Internal server error")
            .deliver();
    }
}

module.exports = {
    getInfo: getInfo,
    getMessageGroups: helper.getMessageGroups, //used by the groups module
    postAddMessage: postStaging,
    postPromoteMessages: promoteIds,
    postUpdate: postUpdate,
    updateLanguages: helper.updateLanguages,
    getNames: getMessageNamesStaging,
};
