const sql = require('sql-bricks-postgres');

//APPROVAL STATUS AND APP UUID FILTER APP FUNCTIONS.
//functions for getting information about only the most recent changes to all app uuids
function getAppInfoFilter (filterObj) {
    //filter by approval status or by app uuid, depending on whether the properties are defined
    let statement = sql.select('max(id) AS id', 'app_uuid')
        .from('app_info');

    if (filterObj && filterObj.app_uuid) {
        statement = statement.where({
            'app_info.app_uuid': filterObj.app_uuid
        });
    }
    statement = statement.groupBy('app_uuid').toString();

    //put the approval status filter on the outside
    if (filterObj && (filterObj.approval_status || filterObj.get_blacklist)) {
        statement = sql.select('app_info.*')
            .from('app_info')
            .join('(' + statement + ') innerai', {
                'innerai.id': 'app_info.id'
            })
            .leftJoin('app_blacklist', {
                'app_info.app_uuid': 'app_blacklist.app_uuid'
            })
        if(filterObj.approval_status){
            statement.where({
                'app_info.approval_status': filterObj.approval_status
            });
        }
        if(filterObj.get_blacklist){
            statement.where(sql.isNotNull('app_blacklist.app_uuid'));
        } else {
            statement.where(sql.isNull('app_blacklist.app_uuid'));
        }
    }

    return statement.toString();
}

function changeAppApprovalStatus (id, statusName, reason) {
    console.log(reason);
    return sql.update('app_info')
        .set({
            approval_status: statusName,
            denial_message: reason
        })
        .where({
            id: id
        })
        .toString();
}

function deleteAutoApproval (uuid) {
    return sql.delete()
        .from('app_auto_approval')
        .where({
            app_uuid: uuid
        })
        .toString();
}

function getFullAppInfoFilter (filterObj) {
    return sql.select('app_info.*')
        .from('app_info')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.id': 'app_info.id'
        })
        .toString();
}

function getAppCountriesFilter (filterObj) {
    //info must be joined with the countries table to get the country name, too
    return sql.select('app_id AS id', 'country_iso', 'countries.name')
        .from('app_countries')
        .join('countries', {
            'app_countries.country_iso': 'countries.iso'
        })
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.id': 'app_countries.app_id'
        })
        .toString();
}

function getAppDisplayNamesFilter (filterObj) {
    return sql.select('id', 'display_text')
        .from('display_names')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.id': 'display_names.app_id'
        })
        .toString();
}

function getAppPermissionsFilter (filterObj) {
    //info must be joined with the permissions table to get the type, too
    return sql.select('app_id AS id', 'permission_name', 'type', 'hmi_level')
        .from('app_permissions')
        .join('permissions', {
            'app_permissions.permission_name': 'permissions.name'
        })
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.id': 'app_permissions.app_id'
        })
        .toString();
}

function getAppCategoryFilter (filterObj) {
    const innerAppInfoSelect = sql.select('app_info.id', 'app_info.category_id')
        .from('app_info')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.id': 'app_info.id'
        });

    return sql.select('categories.id', 'display_name')
        .from('categories')
        .join('(' + innerAppInfoSelect + ') ai2', {
            'ai2.category_id': 'categories.id'
        })
        .toString();
}

function getAppAutoApprovalFilter (filterObj) {
    return sql.select('app_auto_approval.app_uuid')
        .from('app_auto_approval')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.app_uuid': 'app_auto_approval.app_uuid'
        })
        .toString();
}

//ID / APP_UUID FILTER APP FUNCTIONS. They function differently from above since a specific app version is wanted
function getAppInfoId (id) {
    return sql.select('*')
        .from('app_info')
        .where({id: id})
        .toString();
}

function getAppInfoUuid (uuid) {
    return sql.select('*')
        .from('app_info')
        .where({ app_uuid: uuid })
        .toString()
}

function getAppCountriesId (id) {
    return sql.select('app_id AS id', 'country_iso', 'name')
        .from('app_countries')
        .join('countries', {
            'app_countries.country_iso': 'countries.iso'
        })
        .where({
            app_id: id
        })
        .toString();
}

function getAppDisplayNamesId (id) {
    return sql.select('app_id AS id', 'display_text')
        .from('display_names')
        .where({
            app_id: id
        })
        .toString();
}

function getAppPermissionsId (id) {
    return sql.select('app_id AS id', 'permission_name', 'type', 'hmi_level')
        .from('app_permissions')
        .join('permissions', {
            'app_permissions.permission_name': 'permissions.name'
        })
        .where({
            app_id: id
        }).toString();
}

function getAppCategory (id) {
    return sql.select('categories.id', 'display_name')
        .from('categories')
        .join('app_info', {
            'app_info.category_id': 'categories.id'
        })
        .where({
            'app_info.id': id
        })
        .toString();
}

function getAppAutoApproval (id) {
    //find the app uuid from app_info by searching by id, then join with app_auto_approval
    return sql.select('app_auto_approval.app_uuid')
        .from('app_auto_approval')
        .join('app_info', {
            'app_auto_approval.app_uuid': 'app_info.app_uuid'
        })
        .where({
            id: id
        })
        .toString();
}

function timestampCheck (tableName, whereObj) {
    return sql.select('max(updated_ts)')
        .from(tableName)
        .where(whereObj)
        .toString();
}

function versionCheck (tableName, whereObj) {
    return sql.select('version_id')
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

function insertAppInfo (obj) {
    let insertObj = {
        app_uuid: obj.uuid,
        app_short_uuid: obj.short_uuid,
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
        vendor_name: obj.vendor.name,
        vendor_email: obj.vendor.email,
        version_id: obj.version_id
    };

    if(obj.created_ts){
        insertObj.created_ts = obj.created_ts;
    }

    if(obj.updated_ts){
        insertObj.updated_ts = obj.updated_ts;
    }

    if (obj.approval_status) { //has a defined approval_status. otherwise leave as default
        insertObj.approval_status = obj.approval_status;
    }

    return sql.insert('app_info', insertObj)
        .returning('*')
        .toString();
}

function purgeAppInfo (obj) {
    return sql.delete('app_info')
        .where({
            'app_uuid': obj.uuid
        })
        .returning('*')
        .toString();
}

function insertAppCountries (objs, appId) {
    if (objs.length === 0) {
        return null;
    }
    const countryInserts = objs.map(function (country) {
        return {
            app_id: appId,
            country_iso: country.iso
        }
    });
    return sql.insert('app_countries', countryInserts).toString();
}

function insertAppDisplayNames (objs, appId) {
    if (objs.length === 0) {
        return null;
    }
    const displayNameInserts = objs.map(function (name) {
        return {
            app_id: appId,
            display_text: name
        }
    });

    return sql.insert('display_names', displayNameInserts).toString();
}

function insertAppPermissions (objs, appId) {
    if (objs.length === 0) {
        return null;
    }
    const permissionInserts = objs.map(function (permission) {
        return {
            app_id: appId,
            permission_name: permission.key,
            hmi_level: permission.hmi_level
        }
    });

    return sql.insert('app_permissions', permissionInserts).toString();
}

function insertAppAutoApproval (obj) {
    return sql.insert('app_auto_approval', 'app_uuid')
        .select //must have an insert/select in order to include the where statement afterwards
            (
            `'${obj.uuid}' AS app_uuid`
            )
        .where(
            sql.and(
                sql.not(
                    sql.exists(
                        sql.select('*')
                            .from('app_auto_approval aaa')
                            .where({
                                'aaa.app_uuid': obj.uuid
                            })
                    )
                ),
                sql.exists(
                    sql.select('*')
                        .from('app_info')
                        .where({
                            'app_uuid': obj.uuid
                        })
                        .limit(1)
                )
            )
        )
        .returning('*')
        .toString();
}

function insertAppBlacklist (obj) {
    return sql.insert('app_blacklist', 'app_uuid')
        .select(`'${obj.uuid}' AS app_uuid`)
        .where(
            sql.not(
                sql.exists(
                    sql.select('*')
                        .from('app_blacklist ab')
                        .where({
                            'ab.app_uuid': obj.uuid
                        })
                )
            )
        )
        .returning('*')
        .toString()
}

function deleteAppBlacklist (uuid) {
    return sql.delete()
        .from('app_blacklist')
        .where({
            app_uuid: uuid
        })
        .returning('*')
        .toString();
}

function getAppBlacklistFilter (filterObj) {
    return sql.select('app_blacklist.app_uuid')
        .from('app_blacklist')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.app_uuid': 'app_blacklist.app_uuid'
        })
        .toString();
}

function getAppBlacklist (id) {
    return sql.select('app_blacklist.app_uuid')
        .from('app_blacklist')
        .join('app_info', {
            'app_blacklist.app_uuid': 'app_info.app_uuid'
        })
        .where({
            id: id
        })
        .toString();
}

function getBlacklistedApps (uuids, useLongUuids = false) {
    var query = sql.select('app_info.app_uuid, app_info.app_short_uuid')
        .from('app_info')
        .join('app_blacklist', {
            "app_blacklist.app_uuid": 'app_info.app_uuid'
        });

    if(useLongUuids){
        query.where(
            sql.in('app_info.app_uuid', uuids)
        );
    }else{
        query.where(
            sql.in('app_info.app_short_uuid', uuids)
        );
    }

    return query.toString();
}

function getBlacklistedAppFullUuids (uuids) {
    var query = sql.select('app_blacklist.app_uuid')
        .from('app_blacklist')
        .where(
            sql.in('app_blacklist.app_uuid', uuids)
        );

    return query.toString();
}

module.exports = {
    changeAppApprovalStatus: changeAppApprovalStatus,
    deleteAutoApproval: deleteAutoApproval,
    getApp: {
        base: {
            multiFilter: getFullAppInfoFilter,
            idFilter: getAppInfoId,
            uuidFilter: getAppInfoUuid
        },
        countries: {
            multiFilter: getAppCountriesFilter,
            idFilter: getAppCountriesId
        },
        displayNames: {
            multiFilter: getAppDisplayNamesFilter,
            idFilter: getAppDisplayNamesId
        },
        permissions: {
            multiFilter: getAppPermissionsFilter,
            idFilter: getAppPermissionsId
        },
        category: {
            multiFilter: getAppCategoryFilter,
            idFilter: getAppCategory
        },
        autoApproval: {
            multiFilter: getAppAutoApprovalFilter,
            idFilter: getAppAutoApproval
        },
        blacklist: {
            multiFilter: getAppBlacklistFilter,
            idFilter: getAppBlacklist
        }
    },
    timestampCheck: timestampCheck,
    versionCheck: versionCheck,
    checkAutoApproval: checkAutoApproval,
    insertAppInfo: insertAppInfo,
    purgeAppInfo: purgeAppInfo,
    insertAppCountries: insertAppCountries,
    insertAppDisplayNames: insertAppDisplayNames,
    insertAppPermissions: insertAppPermissions,
    insertAppAutoApproval: insertAppAutoApproval,
    insertAppBlacklist: insertAppBlacklist,
    deleteAppBlacklist: deleteAppBlacklist,
    getBlacklistedApps: getBlacklistedApps,
    getBlacklistedAppFullUuids: getBlacklistedAppFullUuids
}
