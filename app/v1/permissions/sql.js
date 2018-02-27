//a repository of all the SQL statements
const sql = require('sql-bricks-postgres');

function insertPermissions (permissionObjs) {
    return permissionObjs.map(function (permission) {
        return sql.insert('permissions', 'name', 'type')
            .select
                (
                `'${permission.name}' AS name`,
                `'${permission.type}' AS type`
                )
            .where(
                sql.not(
                    sql.exists(
                        sql.select('*')
                        .from('permissions perm')
                        .where({
                            'perm.name': permission.name
                        })
                    )
                )
            )
            .toString();
    });
}

function insertPermissionRelations (permissionRelationObjs) {
    return permissionRelationObjs.map(function (permissionRelation) {
        return sql.insert('permission_relations', 'child_permission_name', 'parent_permission_name')
            .select
                (
                `'${permissionRelation.child_permission_name}' AS child_permission_name`,
                `'${permissionRelation.parent_permission_name}' AS parent_permission_name`
                )
            .where(
                sql.not(
                    sql.exists(
                        sql.select('*')
                            .from('permission_relations perm_rel')
                            .where({
                                'perm_rel.child_permission_name': permissionRelation.child_permission_name,
                                'perm_rel.parent_permission_name': permissionRelation.parent_permission_name
                            })
                    )
                )
            )
            .toString();
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
