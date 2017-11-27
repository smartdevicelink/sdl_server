const app = require('../../app');
const utils = require('../policy/utils');
const setupSql = app.locals.sql.setupSqlCommand;

function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment === 'staging' ? false: true;
    const findUnmappedPermissions = setupSql(app.locals.sql.unmappedPermissions(isProduction))
    findUnmappedPermissions(function (err, permissions) {
        if (err) {
            return res.sendStatus(500);
        }
        //get aggregate results
        let unmappedRpcCount = 0;
        let unmappedParameterCount = 0;
        for (let i = 0; i < permissions.length; i++) {
            if (permissions[i].type === 'RPC') {
                unmappedRpcCount++;
            }
            if (permissions[i].type === 'PARAMETER') {
                unmappedParameterCount++;
            }
        }
        permissions = permissions.map(function (perm) {
            return {
                name: perm.name,
                type: perm.type
            }
        });
        return res.status(200).send({
            permissions: permissions,
            unmapped_rpc_count: unmappedRpcCount,
            unmapped_parameter_count: unmappedParameterCount
        });  
    });
}

function post (req, res, next) {
    updatePermissions(function (err) {
        if (err) {
            return res.sendStatus(500);
        }
        return res.sendStatus(200);
    });
}

function updatePermissions (next) {
    app.locals.shaid.queryAndStorePermissions({include_hidden: true, include_parents: true}, function (err) {
        app.locals.log.info("Permission information updated");
        if (next) {
            next(err);
        }
    });
}

module.exports = {
    get: get,
    post: post,
    update: updatePermissions
};