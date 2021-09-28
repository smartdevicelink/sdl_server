const app = require('../app');
const helper = require('./helper.js');
const model = require('./model.js');
const check = require('check-types');
const cache = require('../../../custom/cache');

async function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    const returnTemplate = !!req.query.template; //coerce to boolean

    let groups; //to be determined

    try {
        if (returnTemplate) { //template mode. return just the shell of a functional group, rpcs included
            groups = [await helper.generateFunctionGroupTemplates(isProduction)];
        }
        else if (req.query.id) { //filter by id
            if (Number.isNaN(Number(req.query.id))) {
                return res.parcel.setStatus(400).setMessage("id must be an integer").deliver();
            }
            groups = await helper.createFuncGroupFlow('idFilter', req.query.id, true, isProduction);
        }
        else { //get all apps at the high level, filtering in PRODUCTION or STAGING mode
            groups = await helper.createFuncGroupFlow('statusFilter', isProduction, false, isProduction);
        }
        return res.parcel
            .setStatus(200)
            .setData({
                "groups": groups
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

async function getGroupNamesStaging (req, res, next) {
    try {
        const groupNames = await helper.getGroupNamesStaging();
        return res.parcel
            .setStatus(200)
            .setData({
                "names": groupNames
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

async function postStaging (req, res, next) {
    helper.validateFuncGroup(req, res);
    if (res.parcel.message) {
        res.parcel.deliver();
        return;
    }
    //check in staging mode
    await helper.validatePromptExistence(false, req, res);
    if (res.parcel.message) {
        res.parcel.deliver();
        return;
    }
    //force function group status to STAGING
    try {
        await model.insertFunctionalGroupsWithTransaction(false, [req.body]);
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

    const funcGroups = await Promise.all(req.body.id.map(id => helper.createFuncGroupFlow('idFilter', id, true)));

    const notNullGroups = funcGroups.map(funcGroup => funcGroup[0])
        .filter(elem => elem);

    await model.insertFunctionalGroupsWithTransaction(true, notNullGroups);

    cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
    res.parcel
        .setStatus(200)
        .deliver(); //done
}

module.exports = {
    get: get,
    postAddGroup: postStaging,
    postPromote: promoteIds,
    getNames: getGroupNamesStaging,
    generateFunctionGroupTemplates: helper.generateFunctionGroupTemplates
};
