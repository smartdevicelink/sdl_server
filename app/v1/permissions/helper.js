const app = require('../app');
const flame = app.locals.flame;
const sql = require('./sql.js');

function storePermissions (permissions, next) {
    //convert the data into objects that can be directly stored in the database
    let permissionObjs = [];
    let permissionRelationObjs = [];

    flame.async.map(permissions, function (perm, next) {
        permissionObjs.push({ //add permission
            name: perm.key,
            type: perm.type
        });
        if (perm.parent_permissions.length > 0) {
            for (let j = 0; j < perm.parent_permissions.length; j++) {
                permissionRelationObjs.push({ //add permission relation
                    child_permission_name: perm.key,
                    parent_permission_name: perm.parent_permissions[j].key
                });
            }
        }    
        next();    
    }, function () {
        //insert permissions first, then permission relations
        const insertPermissions = app.locals.db.setupSqlCommands(sql.insertPermissions(permissionObjs));
        const insertPermissionRelations = app.locals.db.setupSqlCommands(sql.insertPermissionRelations(permissionRelationObjs));
        const insertArray = [
            app.locals.flow(insertPermissions, {method: 'parallel'}),
            app.locals.flow(insertPermissionRelations, {method: 'parallel'})
        ];
        const insertFlow = app.locals.flow(insertArray, {method: 'series'});
        insertFlow(next);
    });

}

module.exports = {
    storePermissions: storePermissions
}