const app = require('../app');
const sql = require('./sql.js');

async function storePermissions (permissions) {
    //convert the data into objects that can be directly stored in the database
    let permissionObjs = [];
    let permissionRelationObjs = [];


    for (const perm of permissions) {
        permissionObjs.push({ //add permission
            "name": perm.key,
            "type": perm.type,
            "function_id": perm.function_id || null,
            "display_name": perm.name || null
        });

        if (perm.parent_permissions.length > 0) {
            for (let j = 0; j < perm.parent_permissions.length; j++) {
                permissionRelationObjs.push({ //add permission relation
                    "child_permission_name": perm.key,
                    "parent_permission_name": perm.parent_permissions[j].key
                });
            }
        }
    }

    //insert permissions first, then permission relations
    await app.locals.db.asyncSqls(sql.insertPermissions(permissionObjs));
    await app.locals.db.asyncSqls(sql.insertPermissionRelations(permissionRelationObjs));
}

module.exports = {
    storePermissions: storePermissions
}