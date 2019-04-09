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
            .leftJoin('app_oem_enablements', {
                'app_info.app_uuid': 'app_oem_enablements.app_uuid',
                'app_oem_enablements.key': sql.val('blacklist')
            })
        if(filterObj.approval_status){
            statement.where({
                'app_info.approval_status': filterObj.approval_status
            });
        }
        if(filterObj.get_blacklist){
            statement.where(sql.isNotNull('app_oem_enablements.app_uuid'));
        } else {
            statement.where(sql.isNull('app_oem_enablements.app_uuid'));
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
        .from('app_oem_enablements')
        .where({
            'app_uuid': uuid,
            'key': 'auto_approve'
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

function getAppServiceTypesFilter (filterObj) {
    return sql.select('ast.app_id, ast.service_type_name, st.display_name')
        .from('app_service_types ast')
        .join('service_types st', {
            'st.name': 'ast.service_type_name'
        })
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.id': 'ast.app_id'
        })
        .orderBy('ast.service_type_name ASC')
        .toString();
}

function getAppServiceTypeNamesFilter (filterObj) {
    return sql.select('astn.app_id, astn.service_type_name, astn.service_name')
        .from('app_service_type_names astn')
        .join('service_types st', {
            'st.name': 'astn.service_type_name'
        })
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.id': 'astn.app_id'
        })
        .orderBy('astn.service_type_name ASC')
        .toString();
}

function getAppServiceTypePermissionsFilter (filterObj) {
    let brick = sql.select('ai.id AS app_id', 'stp.service_type_name', 'p.function_id', 'p.name', 'p.display_name', 'p.type', 'st.display_name AS service_display_name')
        //generate all possible combinations of selected app ids and possible service type permissions
        .from('service_type_permissions stp')
        .join('permissions p', {
            'p.name': 'stp.permission_name'
        })
        .join('service_types st', {
            'st.name': 'stp.service_type_name'
        })
        .crossJoin('(XXXXXXXX) ai')
        //take the combination above and join it with app_service_type_permissions, using astp.app_id
        //to find out which ones exist in the table above that don't exist in app_service_type_permissions
        .leftJoin('app_service_type_permissions astp', {
            'ai.id': 'astp.app_id',
            'stp.service_type_name': 'astp.service_type_name',
            'p.name': 'astp.permission_name',
        })
        .orderBy('p.name ASC');

    //compute is_selected column for each entry
    brick.select(`CASE
        WHEN ai.id = astp.app_id
        AND stp.service_type_name = astp.service_type_name
        AND p.name = astp.permission_name
        THEN true
        ELSE false
    END AS is_selected`);

    //sql-bricks modifies the value of the sql string getAppInfoFilter(filterObj) incorrectly, placing an additional
    //cross join in that string's INNER JOIN when there is none. substitute the placeholder with this string
    //so that the library doesn't mess with the value
    let brickString = brick.toString();
    brickString = brickString.replace('XXXXXXXX', getAppInfoFilter(filterObj))

    return brickString;
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
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.app_uuid': 'app_oem_enablements.app_uuid'
        })
        .where({
            'app_oem_enablements.key': 'auto_approve'
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

function getAppServiceTypes (id) {
    return sql.select('ast.app_id, ast.service_type_name, st.display_name')
        .from('app_service_types ast')
        .join('service_types st', {
            'st.name': 'ast.service_type_name'
        })
        .join('app_info ai', {
            'ai.id': 'ast.app_id'
        })
        .where({
            'ai.id': id
        })
        .orderBy('ast.service_type_name ASC')
        .toString();
}

function getAppServiceTypeNames (id) {
    return sql.select('astn.app_id, astn.service_type_name, astn.service_name')
        .from('app_service_type_names astn')
        .join('service_types st', {
            'st.name': 'astn.service_type_name'
        })
        .join('app_info ai', {
            'ai.id': 'astn.app_id'
        })
        .where({
            'ai.id': id
        })
        .orderBy('astn.service_name')
        .toString();
}

function getAppServiceTypePermissions (id) {
    let brick = sql.select('ai.id AS app_id', 'stp.service_type_name', 'p.function_id', 'p.name', 'p.display_name', 'p.type', 'st.display_name AS service_display_name')
        //generate all possible combinations of selected app ids and possible service type permissions
        .from('service_type_permissions stp')
        .join('permissions p', {
            'p.name': 'stp.permission_name'
        })
        .join('service_types st', {
            'st.name': 'stp.service_type_name'
        })
        .crossJoin('app_info ai', {
            'ai.id': 'stp.app_id'
        })
        //take the combination above and join it with app_service_type_permissions, using astp.app_id
        //to find out which ones exist in the table above that don't exist in app_service_type_permissions
        .leftJoin('app_service_type_permissions astp', {
            'ai.id': 'astp.app_id',
            'stp.service_type_name': 'astp.service_type_name',
            'p.name': 'astp.permission_name',
        })
        .where({
            'ai.id': id
        })
        .orderBy('p.name ASC');

    //compute is_selected column for each entry
    brick.select(`CASE
        WHEN ai.id = astp.app_id
        AND stp.service_type_name = astp.service_type_name
        AND p.name = astp.permission_name
        THEN true
        ELSE false
    END AS is_selected`);

    return brick.toString();
}

function getAppAutoApproval (id) {
    //find the app uuid from app_info by searching by id, then join with app_auto_approval
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .join('app_info', {
            'app_oem_enablements.app_uuid': 'app_info.app_uuid'
        })
        .where({
            'app_info.id': id,
            'app_oem_enablements.key': 'auto_approve'
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
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .where({
            'app_uuid': uuid,
            'key': 'auto_approve'
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
        icon_url: obj.icon_url,
        cloud_endpoint: obj.cloud_endpoint || null,
        cloud_transport_type: obj.cloud_transport_type || null,
        ca_certificate: obj.ca_certificate || null,
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

function deleteAppServicePermissions (appId) {
    return sql.delete()
        .from('app_service_type_permissions')
        .where({
            app_id: appId
        })
        .toString();
}

function insertAppServices (objs, appId) {
    if (objs.length === 0) {
        return null;
    }
    const inserts = objs.map(function (obj) {
        return {
            app_id: appId,
            service_type_name: obj.name
        }
    });

    return sql.insert('app_service_types', inserts).toString();
}

function insertAppServiceNames (objs, appId) {
    if (objs.length === 0) {
        return null;
    }

    var insertObjs = [];
    objs.forEach(function(obj){
        obj.service_names.forEach(function(service_name){
            insertObjs.push({
                "app_id": appId,
                "service_type_name": obj.name,
                "service_name": service_name
            });
        });
    });

    return sql.insert('app_service_type_names', insertObjs).toString();
}

function insertStandardAppServicePermissions (objs, appId) {
    if (objs.length === 0) {
        return null;
    }

    const serviceTypeNames = objs.map(function (obj) {
        return obj.name;
    });

    return sql.insert('app_service_type_permissions')
        .select(`${appId} AS app_id, stp.service_type_name, stp.permission_name`)
        .from('service_type_permissions stp')
        .where(
            sql.in('stp.service_type_name', serviceTypeNames)
        )
        .toString();
}

function insertAppServicePermissions (objs, appId) {
    if (objs.length === 0) {
        return null;
    }

    const servicePermissions = objs.map(function (obj) {
        return {
            "app_id": appId,
            "service_type_name": obj.service_type_name,
            "permission_name": obj.permission_name
        };
    });

    return sql.insert('app_service_type_permissions', servicePermissions).toString();
}

function insertAppServicePermission (obj) {
    return sql.insert('app_service_type_permissions', {
        "app_id": obj.id,
        "service_type_name": obj.service_type_name,
        "permission_name": obj.permission_name
    }).toString();
}

function deleteAppServicePermission (obj) {
    return sql.delete()
        .from('app_service_type_permissions')
        .where({
            "app_id": obj.id,
            "service_type_name": obj.service_type_name,
            "permission_name": obj.permission_name
        })
        .toString();
}

function deleteHybridPreference (uuid) {
    return sql.delete()
        .from('app_hybrid_preference')
        .where({
            'app_uuid': uuid
        })
        .toString();
}

function insertHybridPreference (obj) {
    return sql.insert('app_hybrid_preference', {
        'app_uuid': obj.uuid,
        'hybrid_preference': obj.hybrid_preference
    })
    .toString();
}

function getAppHybridPreferenceFilter (filterObj) {
    return sql.select('app_hybrid_preference.hybrid_preference, app_hybrid_preference.app_uuid')
        .from('app_hybrid_preference')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.app_uuid': 'app_hybrid_preference.app_uuid'
        })
        .toString();
}

function getAppHybridPreference (id) {
    return sql.select('app_hybrid_preference.hybrid_preference, app_hybrid_preference.app_uuid')
        .from('app_hybrid_preference')
        .join('app_info', {
            'app_hybrid_preference.app_uuid': 'app_info.app_uuid'
        })
        .where({
            'app_info.id': id
        })
        .toString();
}

function getAppAdministratorFilter (filterObj) {
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.app_uuid': 'app_oem_enablements.app_uuid'
        })
        .where({
            'app_oem_enablements.key': 'administrator_fg'
        })
        .toString();
}

function getAppAdministrator (id) {
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .join('app_info', {
            'app_oem_enablements.app_uuid': 'app_info.app_uuid'
        })
        .where({
            'app_info.id': id,
            'app_oem_enablements.key': 'administrator_fg'
        })
        .toString();
}

function deleteAppAdministrator (uuid) {
    return sql.delete()
        .from('app_oem_enablements')
        .where({
            'app_uuid': uuid,
            'key': 'administrator_fg'
        })
        .toString();
}

function insertAppAdministrator (obj) {
    return sql.insert('app_oem_enablements', 'app_uuid, key')
        .select //must have an insert/select in order to include the where statement afterwards
            (
            `'${obj.uuid}' AS app_uuid, 'administrator_fg' AS key`
            )
        .where(
            sql.and(
                sql.not(
                    sql.exists(
                        sql.select('*')
                            .from('app_oem_enablements aaa')
                            .where({
                                'aaa.app_uuid': obj.uuid,
                                'aaa.key': 'administrator_fg'
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

function getPassthroughFilter (filterObj) {
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.app_uuid': 'app_oem_enablements.app_uuid'
        })
        .where({
            'app_oem_enablements.key': 'allow_unknown_rpc_passthrough'
        })
        .toString();
}

function getPassthrough (id) {
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .join('app_info', {
            'app_oem_enablements.app_uuid': 'app_info.app_uuid'
        })
        .where({
            'app_info.id': id,
            'app_oem_enablements.key': 'allow_unknown_rpc_passthrough'
        })
        .toString();
}

function deletePassthrough (uuid) {
    return sql.delete()
        .from('app_oem_enablements')
        .where({
            'app_uuid': uuid,
            'key': 'allow_unknown_rpc_passthrough'
        })
        .toString();
}

function insertPassthrough (obj) {
    return sql.insert('app_oem_enablements', 'app_uuid, key')
        .select //must have an insert/select in order to include the where statement afterwards
            (
            `'${obj.uuid}' AS app_uuid, 'allow_unknown_rpc_passthrough' AS key`
            )
        .where(
            sql.and(
                sql.not(
                    sql.exists(
                        sql.select('*')
                            .from('app_oem_enablements aaa')
                            .where({
                                'aaa.app_uuid': obj.uuid,
                                'aaa.key': 'allow_unknown_rpc_passthrough'
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

function insertAppAutoApproval (obj) {
    return sql.insert('app_oem_enablements', 'app_uuid, key')
        .select //must have an insert/select in order to include the where statement afterwards
            (
            `'${obj.uuid}' AS app_uuid, 'auto_approve' AS key`
            )
        .where(
            sql.and(
                sql.not(
                    sql.exists(
                        sql.select('*')
                            .from('app_oem_enablements aaa')
                            .where({
                                'aaa.app_uuid': obj.uuid,
                                'aaa.key': 'auto_approve'
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
    return sql.insert('app_oem_enablements', 'app_uuid, key')
        .select(`'${obj.uuid}' AS app_uuid, 'blacklist' AS key`)
        .where(
            sql.not(
                sql.exists(
                    sql.select('*')
                        .from('app_oem_enablements ab')
                        .where({
                            'ab.app_uuid': obj.uuid,
                            'ab.key': 'blacklist'
                        })
                )
            )
        )
        .returning('*')
        .toString()
}

function deleteAppBlacklist (uuid) {
    return sql.delete()
        .from('app_oem_enablements')
        .where({
            'app_uuid': uuid,
            'key': 'blacklist'
        })
        .returning('*')
        .toString();
}

function getAppBlacklistFilter (filterObj) {
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.app_uuid': 'app_oem_enablements.app_uuid'
        })
        .where({
            'app_oem_enablements.key': 'blacklist'
        })
        .toString();
}

function getAppBlacklist (id) {
    return sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .join('app_info', {
            'app_oem_enablements.app_uuid': 'app_info.app_uuid'
        })
        .where({
            'app_info.id': id,
            'app_oem_enablements.key': 'blacklist'
        })
        .toString();
}

function getBlacklistedApps (uuids, useLongUuids = false) {
    var query = sql.select('app_info.app_uuid, app_info.app_short_uuid')
        .from('app_info')
        .join('app_oem_enablements', {
            "app_oem_enablements.app_uuid": 'app_info.app_uuid',
            "app_oem_enablements.key": sql.val('blacklist')
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
    var query = sql.select('app_oem_enablements.app_uuid')
        .from('app_oem_enablements')
        .where({
            'app_oem_enablements.key': 'blacklist'
        })
        .where(
            sql.in('app_oem_enablements.app_uuid', uuids)
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
        serviceTypes: {
            multiFilter: getAppServiceTypesFilter,
            idFilter: getAppServiceTypes
        },
        serviceTypeNames: {
            multiFilter: getAppServiceTypeNamesFilter,
            idFilter: getAppServiceTypeNames
        },
        serviceTypePermissions: {
            multiFilter: getAppServiceTypePermissionsFilter,
            idFilter: getAppServiceTypePermissions
        },
        autoApproval: {
            multiFilter: getAppAutoApprovalFilter,
            idFilter: getAppAutoApproval
        },
        blacklist: {
            multiFilter: getAppBlacklistFilter,
            idFilter: getAppBlacklist
        },
        administrators: {
            multiFilter: getAppAdministratorFilter,
            idFilter: getAppAdministrator
        },
        passthrough: {
            multiFilter: getPassthroughFilter,
            idFilter: getPassthrough
        },
        hybridPreference: {
            multiFilter: getAppHybridPreferenceFilter,
            idFilter: getAppHybridPreference
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
    insertAppAdministrator: insertAppAdministrator,
    deleteAppAdministrator: deleteAppAdministrator,
    insertPassthrough: insertPassthrough,
    deletePassthrough: deletePassthrough,
    insertHybridPreference: insertHybridPreference,
    deleteHybridPreference: deleteHybridPreference,
    insertAppBlacklist: insertAppBlacklist,
    deleteAppBlacklist: deleteAppBlacklist,
    getBlacklistedApps: getBlacklistedApps,
    getBlacklistedAppFullUuids: getBlacklistedAppFullUuids,
    insertAppServices: insertAppServices,
    insertAppServiceNames: insertAppServiceNames,
    insertAppServicePermission: insertAppServicePermission,
    deleteAppServicePermission: deleteAppServicePermission,
    deleteAppServicePermissions: deleteAppServicePermissions,
    insertAppServicePermissions: insertAppServicePermissions,
    insertStandardAppServicePermissions: insertStandardAppServicePermissions
}
