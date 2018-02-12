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
    if (filterObj && filterObj.approval_status) {
        statement = sql.select('app_info.*')
            .from('app_info')
            .join('(' + statement + ') innerai', {
                'innerai.id': 'app_info.id'
            })
            .where({
                'app_info.approval_status': filterObj.approval_status
            });
    }

    return statement.toString();
}

function changeAppApprovalStatus (id, statusName) {
    return sql.update('app_info')
        .set({
            approval_status: statusName
        })
        .where({
            id: id
        })
        .toString();
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

function getAppVendorFilter (filterObj) {
    return sql.select('vendors.id', 'vendor_name', 'vendor_email')
        .from('vendors')
        .join('(' + getAppInfoFilter(filterObj) + ') ai', {
            'ai.id': 'vendors.id'
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

function getAppVendor (id) {
    return sql.select('*')
        .from('vendors')
        .where({
            id: id
        })
        .toString();
}

function getAppCategory (id) {
    return sql.select('categories.id', 'display_name')
        .from('categories')
        .join('app_info', {
            'app_info.category_id': 'categories.id'
        })
        .where({
            'categories.id': id
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

module.exports = {
    changeAppApprovalStatus: changeAppApprovalStatus,
    insertAppAutoApprovals: insertAppAutoApprovals,
    deleteAutoApproval: deleteAutoApproval,
    getApp: {
        base: {
            multiFilter: getFullAppInfoFilter,
            idFilter: getAppInfoId
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
        vendor: {
            multiFilter: getAppVendorFilter,
            idFilter: getAppVendor
        },
        category: {
            multiFilter: getAppCategoryFilter,
            idFilter: getAppCategory
        },
        autoApproval: {
            multiFilter: getAppAutoApprovalFilter,
            idFilter: getAppAutoApproval
        }
    }
}

