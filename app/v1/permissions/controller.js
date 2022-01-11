const app = require('../app');
const sql = require('./sql.js');
const helper = require('./helper.js');

async function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    
    try {
        let permissions = await app.locals.db.asyncSql(sql.findUnmappedPermissions(isProduction));

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
    } catch (err) {
        console.log(err);
        return res.parcel
            .setStatus(500)
            .setMessage("Internal server error")
            .deliver();
    }
}

async function post (req, res, next) {
    try {
        await updatePermissions();
        return res.parcel
            .setStatus(200)
            .deliver();
    } catch (err) {
        return res.parcel
            .setStatus(500)
            .setMessage("Internal server error")
            .deliver();
    }
}

async function updatePermissions () {
    const queryObj = {
        include_hidden: true, 
        include_parents: true
    };

    const permissions = await app.locals.shaid.getPermissions(queryObj);
    await helper.storePermissions(permissions);
    
    app.locals.log.info("Permission information updated");
}

module.exports = {
    get: get,
    post: post,
    update: updatePermissions
};