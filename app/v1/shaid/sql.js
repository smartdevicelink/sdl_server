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

function timestampCheck (tableName, whereObj) {
    return sql.select('max(updated_ts)')
        .from(tableName)
        .where(whereObj)
        .toString();
}

function checkAutoApproval (uuid) {
    return sql.select('app_auto_approval.app_uuid')
        .from('app_auto_approval')
        .where({
            app_uuid: uuid
        })
        .toString();
}

function insertVendors (objs) {
    return objs.map(function (obj) {
        return sql.insert('vendors', {
            vendor_name: obj.vendor_name,
            vendor_email: obj.vendor_email
        })
        .returning('*')
        .toString();
    });
}

function insertAppInfo (objs) {
    return objs.map(function (obj) {
        let insertObj = {
            app_uuid: obj.uuid,
            name: obj.name,
            platform: obj.platform,
            platform_app_id: obj.platform_app_id,
            status: obj.status,
            can_background_alert: obj.can_background_alert,
            can_steal_focus: obj.can_steal_focus,
            default_hmi_level: obj.default_hmi_level,
            tech_email: obj.tech_email,
            tech_phone: obj.tech_phone,
            category_id: obj.category.id,
            vendor_id: obj.vendor_id
        };

        if (obj.approval_status) { //has a defined approval_status. otherwise leave as default
            insertObj.approval_status = obj.approval_status;
        }

        return sql.insert('app_info', insertObj)
            .returning('*')
            .toString();
    });
}

function insertAppCountries (objs) {
    return objs.map(function (obj) {
        return sql.insert('app_countries', {
            app_id: obj.id,
            country_iso: obj.country_iso
        })
        .toString();
    });
}

function insertAppDisplayNames (objs) {
    return objs.map(function (obj) {
        return sql.insert('display_names', {
            app_id: obj.id,
            display_text: obj.display_text
        })
        .toString();
    });
}

function insertAppPermissions (objs) {
    return objs.map(function (obj) {
        return sql.insert('app_permissions', {
            app_id: obj.id,
            permission_name: obj.permission_name,
            hmi_level: obj.hmi_level
        })
        .toString();
    });
}

function insertAppAutoApprovals (objs) {
    return objs.map(function (obj) {
        return sql.insert('app_auto_approval', {
            app_uuid: obj.uuid
        })
        .where(
            sql.not(
                sql.exists(
                    sql.select('*')
                        .from('app_auto_approval aaa')
                        .where({
                            'aaa.app_uuid': obj.uuid
                        })
                )
            )
        )
        .toString();
    });
}

module.exports = {
    insertPermissions: insertPermissions,
    insertPermissionRelations: insertPermissionRelations,
    timestampCheck: timestampCheck,
    checkAutoApproval: checkAutoApproval,
    insertVendors: insertVendors,
    insertAppInfo: insertAppInfo,
    insertAppCountries: insertAppCountries,
    insertAppDisplayNames: insertAppDisplayNames,
    insertAppPermissions: insertAppPermissions,
    insertAppAutoApprovals: insertAppAutoApprovals
}
