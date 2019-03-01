//a repository of all the SQL statements
const sql = require('sql-bricks-postgres');

function insertPermissions (permissionObjs) {
    return permissionObjs.map(function (permission) {
        return sql.insert("permissions", permission)
            .onConflict().onConstraint('permissions_pkey').doUpdate().toString();
    });
}

function insertPermissionRelations (permissionRelationObjs) {
    return permissionRelationObjs.map(function (permissionRelation) {
        return sql.insert("permission_relations", permissionRelation)
            .onConflict().onConstraint('permission_relations_pkey').doUpdate().toString();
    });
}

//these get all permissions not assigned to a functional group. permissions of type MODULE are excluded
//since they don't belong in functional groups
function findUnmappedPermissions (isProduction) {
    let chosenPermissionFilter;

    if (isProduction) {
        //filter out mapped permissions so only production entries exist,
        //then find unmapped permissions from that reduced set
        //chosenPermissionFilter = mappedPermsProduction;
        chosenPermissionFilter = sql.select('*').from('view_mapped_permissions_production');
    }
    else {
        //filter out mapped permissions based on highest id,
        //then find unmapped permissions from that reduced set
        //chosenPermissionFilter = mappedPermsStaging;
        chosenPermissionFilter = sql.select('*').from('view_mapped_permissions_staging');
    }

    return sql.select('permissions.name', 'permissions.type')
        .from('(' + chosenPermissionFilter + ') vmp')
        .rightOuterJoin('permissions', {
            'permissions.name': 'vmp.name'
        })
        .where(
            sql.and(
                sql.isNull('vmp.name'),
                sql.notEq('permissions.type', 'MODULE')
            )
        )
        .toString();
}


module.exports = {
    insertPermissions: insertPermissions,
    insertPermissionRelations: insertPermissionRelations,
    findUnmappedPermissions: findUnmappedPermissions
}
