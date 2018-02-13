const app = require('../app');
const sql = require('./sql.js');

function storePermissions (permissions, next) {
    //convert the data into objects that can be directly stored in the database
    let permissionObjs = [];
    let permissionRelationObjs = [];
    for (let i = 0; i < permissions.length; i++) {
        const perm = permissions[i];
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
    }

    //insert permissions first, then permission relations
    const insertPermissions = app.locals.db.setupSqlCommands(sql.insertPermissions(permissionObjs));
    const insertPermissionRelations = app.locals.db.setupSqlCommands(sql.insertPermissionRelations(permissionRelationObjs));
    const insertArray = [
        app.locals.flow(insertPermissions, {method: 'parallel'}),
        app.locals.flow(insertPermissionRelations, {method: 'parallel'})
    ];
    const insertFlow = app.locals.flow(insertArray, {method: 'series'});
    insertFlow(function () {
        next(); //done
    });
}

module.exports = {
    storePermissions: storePermissions,
}