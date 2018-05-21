const app = require('../app');
const check = require('check-types');
const model = require('./model.js');
const helper = require('./helper.js');
const async = require('async');
const sql = require('./sql.js');
const cache = require('../../../custom/cache');

function getInfo (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    const returnTemplate = !!req.query.template; //coerce to boolean
    //if hide_deleted is true, then always hide deleted consumer messages regardless of environment
    //this is only for getting functional group details
    const alwaysHideDeleted = req.query.hide_deleted && req.query.hide_deleted == 'true' ? true: false;

    if (returnTemplate) { //template mode. return just the shell of a message
        chosenFlow = helper.makeCategoryTemplateFlow();
    }
    else if (req.query.id) { //get messages of a specific id. this is the 'detailed' mode
        chosenFlow = helper.getMessageDetailsFlow(req.query.id);
    }
    else { //get all message info at the highest level, filtering in PRODUCTION or STAGING mode
        chosenFlow = helper.getMessageGroups.bind(null, isProduction, alwaysHideDeleted);
    }

    chosenFlow(function (err, messages) {
        if (err) {
            app.locals.log.error(err);
            return res.parcel.setStatus(500).deliver();
        }
        return res.parcel
            .setStatus(200)
            .setData({
                "messages": messages
            })
            .deliver();
    });
}


function postStaging (req, res, next) {
    helper.validatePost(req, res);
    if (res.parcel.message) {
        return res.parcel.deliver();
    }
    model.insertMessagesWithTransaction(false, req.body.messages, function(err){
        if(err){
            app.locals.log.error(err);
            res.parcel
                .setMessage("Interal server error")
                .setStatus(500);
        }else{
            cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
            res.parcel.setStatus(200);
        }
        res.parcel.deliver();
    });
}

function promoteIds (req, res, next) {
    helper.validatePromote(req, res);
    if (res.parcel.message) {
		return res.parcel.deliver();
	}
    //make sure the data in id is an array in the end
    if (check.number(req.body.id)) {
        req.body.id = [req.body.id];
    }
    //get all the info from the ids and insert them
    async.waterfall([
        function (callback) {
            async.parallel({
                "groups": function(callback){
                    app.locals.db.getMany(sql.getMessages.groupsByIds(req.body.id), callback);
                },
                "languages": function(callback){
                    app.locals.db.getMany(sql.getMessages.byIds(req.body.id), callback);
                }
            }, callback);
        },
        function (results, callback) {
            model.mergeLanguagesIntoGroups(results.groups, results.languages, callback);
        },
        function (groups, callback) {
            model.insertMessagesWithTransaction(true, groups, callback);
        }
    ], function (err, result) {
        if (err) {
            app.locals.log.error(err);
            res.parcel
                .setMessage("Interal server error")
                .setStatus(500);
        }
        else {
            cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
            res.parcel.setStatus(200);
        }
        res.parcel.deliver();
    });
}

function postUpdate (req, res, next) {
    helper.updateLanguages(function (err) {
        if (err) {
            return res.parcel
                .setStatus(500)
                .deliver();
        }
        cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
        cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
        res.parcel
            .setStatus(200)
            .deliver();
        return;
    });
}

function getMessageNamesStaging (req, res, next) {
    helper.getMessageNamesStaging(function (err, names) {
        if (err) {
            app.locals.log.error(err);
            return res.parcel
                .setStatus(500)
                .setMessage("Internal server error")
                .deliver();
        }
        return res.parcel
            .setStatus(200)
            .setData({
                "names": names
            })
            .deliver();        
    });
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
