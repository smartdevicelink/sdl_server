const app = require('../app');
const setupSql = app.locals.sql.setupSqlCommand;
const check = require('check-types');
const model = require('./model.js');
const helper = require('./helper.js');


function getInfo (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    const returnTemplate = !!req.query.template; //coerce to boolean
    if (returnTemplate) { //template mode. return just the shell of a message
        chosenFlow = helper.makeCategoryTemplateFlow();
    }
    else if (req.query.id) { //get messages of a specific id. this is the 'detailed' mode
        chosenFlow = helper.getMessageDetailsFlow(req.query.id);
    }
    else { //get all message info at the highest level, filtering in PRODUCTION or STAGING mode
        chosenFlow = helper.getMessageGroups.bind(null, isProduction);
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
    //convert the JSON to sql-like statements
    const newData = model.convertMessagesJson(req.body);
    //force group status to STAGING
    model.insertMessagesSql(false, newData, function () {
        res.parcel
            .setStatus(200)
            .deliver();
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
    const getAndInsertFlow = app.locals.flow([
        helper.getMessagesDetailsSqlFlow(req.body.id),
        model.insertMessagesSql.bind(null, true) //force group status to PRODUCTION
    ], {method: 'waterfall'});

    getAndInsertFlow(function () {
        res.parcel
            .setStatus(200)
            .deliver();
    });
}

function postUpdate (req, res, next) {
    helper.updateLanguages(function (err) {
        if (err) {
            return res.parcel
                .setStatus(500)
                .deliver();
        }
        res.parcel
            .setStatus(200)
            .deliver();
        return;
    });
}

module.exports = {
    getInfo: getInfo,
    getMessageGroups: helper.getMessageGroups, //used by the groups module
    postAddMessage: postStaging,
    postPromoteMessages: promoteIds,
    postUpdate: postUpdate,
    updateLanguages: helper.updateLanguages
};
