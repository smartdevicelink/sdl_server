const app = require('../app');
const flow = app.locals.flow;
const helper = require('./helper.js');
const model = require('./model.js');
const check = require('check-types');
const cache = require('../../../custom/cache');

function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    const returnTemplate = !!req.query.template; //coerce to boolean

    let chosenFlow; //to be determined

    if (returnTemplate) { //template mode. return just the shell of a functional group, rpcs included
        chosenFlow = flow([
            function (next) {
                next(null, [model.getFunctionGroupTemplate()]); //must be in an array
            }
        ], {method: 'waterfall'});
    }
    else if (req.query.id) { //filter by id
        chosenFlow = helper.createFuncGroupFlow('idFilter', req.query.id, true, isProduction);
    }
    else { //get all apps at the high level, filtering in PRODUCTION or STAGING mode
        chosenFlow = helper.createFuncGroupFlow('statusFilter', isProduction, false, isProduction);
    }

    chosenFlow(function (err, groups) {
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
                "groups": groups
            })
            .deliver();
    });
}

function getGroupNamesStaging (req, res, next) {
    helper.getGroupNamesStaging(function (err, groupNames) {
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
                "names": groupNames
            })
            .deliver();        
    });
}

function postStaging (req, res, next) {
    helper.validateFuncGroup(req, res, function () {
        if (res.parcel.message) {
            res.parcel.deliver();
            return;
        }
        //check in staging mode
        helper.validatePromptExistence(false, req, res, function () {
            if (res.parcel.message) {
                res.parcel.deliver();
                return;
            }
            //force function group status to STAGING
            model.insertFunctionalGroupsWithTransaction(false, [req.body], function (err) {
                if (err) {
                    app.locals.log.error(err);
                    res.parcel
                        .setMessage("Interal server error")
                        .setStatus(500);
                }
                else {
                    cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
                    res.parcel.setStatus(200);
                }
                res.parcel.deliver();
            });
        });
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

    const getFuncGroupsFlow = flow(req.body.id.map(function (id) {
        return helper.createFuncGroupFlow('idFilter', id, true);
    }), {method: 'parallel', eventLoop: true});

    const getAndInsertFlow = app.locals.flow([
        getFuncGroupsFlow,
        function (funcGroups, next) {
            const notNullGroups = funcGroups.map(function (funcGroup) {
                return funcGroup[0];
            }).filter(function (elem) {
                return elem;
            });
            //format the functional groups so it's a single array
            next(null, notNullGroups);
        },
        model.insertFunctionalGroupsWithTransaction.bind(null, true)
    ], {method: 'waterfall'});

    getAndInsertFlow(function () {
        cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
        res.parcel
            .setStatus(200)
            .deliver(); //done
    });

}

module.exports = {
    get: get,
    postAddGroup: postStaging,
    postPromote: promoteIds,
    getNames: getGroupNamesStaging,
    generateFunctionGroupTemplates: helper.generateFunctionGroupTemplates
};
