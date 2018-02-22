const app = require('../app');
const setupSql = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');
const helper = require('./helper.js');

function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    const findUnmappedPermissions = setupSql.bind(null, sql.findUnmappedPermissions(isProduction))
    findUnmappedPermissions(function (err, permissions) {
        if (err) {
            return res.parcel
                .setStatus(500)
                .setMessage("Internal server error")
                .deliver();
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

        return res.parcel
            .setStatus(200)
            .setData({
                permissions: permissions,
                unmapped_rpc_count: unmappedRpcCount,
                unmapped_parameter_count: unmappedParameterCount
            })
            .deliver();
    });
}

function post (req, res, next) {
    updatePermissions(function (err) {
        if (err) {
            return res.parcel
                .setStatus(500)
                .setMessage("Internal server error")
                .deliver();
        }
        return res.parcel
            .setStatus(200)
            .deliver();
    });
}

function updatePermissions (next) {
    const queryObj = {
        include_hidden: true, 
        include_parents: true
    };
    const permissionFlow = app.locals.flow([
        app.locals.shaid.getPermissions.bind(null, queryObj), 
        helper.storePermissions
    ], {method: "waterfall"});
    
    permissionFlow(function (err) {
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