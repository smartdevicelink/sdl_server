function constructFullAppObjs (res, next) {
    const appBase = res[0];
    const appCountries = res[1];
    const appDisplayNames = res[2];
    const appPermissions = res[3];
    const appVendors = res[4];
    const appCategories = res[5];
    const appAutoApprovals = res[6];

    //convert appCategories and appAutoApprovals to hash by id
    const hashedCategories = {};
    const hashedAutoApproval = {};

    for (let i = 0; i < appCategories.length; i++) {
        hashedCategories[appCategories[i].id] = appCategories[i].display_name;
    }    
    for (let i = 0; i < appAutoApprovals.length; i++) {
        hashedAutoApproval[appAutoApprovals[i].app_uuid] = true;
    }  

    //convert appBase to hash by id for fast assignment of other information
    const hashedApps = {};
    for (let i = 0; i < appBase.length; i++) {
        hashedApps[appBase[i].id] = appBase[i];
        hashedApps[appBase[i].id].uuid = hashedApps[appBase[i].id].app_uuid;
        hashedApps[appBase[i].id].category = {
            id: appBase[i].category_id,
            display_name: hashedCategories[appBase[i].category_id]
        };
        if (hashedAutoApproval[appBase[i].app_uuid]) {
            hashedApps[appBase[i].id].is_auto_approved_enabled = true;
        }
        else {
            hashedApps[appBase[i].id].is_auto_approved_enabled = false;
        }
        delete hashedApps[appBase[i].id].app_uuid;
        hashedApps[appBase[i].id].countries = [];
        hashedApps[appBase[i].id].display_names = [];
        hashedApps[appBase[i].id].permissions = [];
    }
    //iterate through all other info and attach their information to hashedApps
    for (let i = 0; i < appCountries.length; i++) {
        hashedApps[appCountries[i].id].countries.push({
            iso: appCountries[i].country_iso,
            name: appCountries[i].name
        });
    }
    for (let i = 0; i < appDisplayNames.length; i++) {
        hashedApps[appDisplayNames[i].id].display_names.push(appDisplayNames[i].display_text);
    }
    for (let i = 0; i < appPermissions.length; i++) {
        hashedApps[appPermissions[i].id].permissions.push({
            key: appPermissions[i].permission_name,
            hmi_level: appPermissions[i].hmi_level,
            type: appPermissions[i].type
        });
    }
    for (let i = 0; i < appVendors.length; i++) {
        hashedApps[appVendors[i].id].vendor = {
            id: appVendors[i].id,
            name: appVendors[i].vendor_name,
            email: appVendors[i].vendor_email
        };
    }

    //convert the hash back to an array!
    let fullApps = [];
    for (let id in hashedApps) {
        fullApps.push(hashedApps[id]);
    }
    next(null, fullApps);
}

//given an app, modify its approval status
function modifyApprovalStatus (newStatus) {
    return function (apps, next) {
        for (let i = 0; i < apps.length; i++) {
            apps[i].approval_status = newStatus;
            //remove the timestamps to force the app's insertion (and the id, to be safe)
            delete apps[i].id;
            delete apps[i].created_ts;
            delete apps[i].updated_ts;
        }
        next(null, apps);
    }
}

//given an app, modify its auto approval status
function modifyAutoApprovalStatus (newAutoApproval) {
    return function (apps, next) {
        for (let i = 0; i < apps.length; i++) {
            apps[i].is_auto_approved_enabled = newAutoApproval;
            //remove the timestamps to force the app's insertion (and the id, to be safe)
            delete apps[i].id;
            delete apps[i].created_ts;
            delete apps[i].updated_ts;
        }
        next(null, apps);
    }
}

module.exports = {
    constructFullAppObjs: constructFullAppObjs,
    modifyApprovalStatus: modifyApprovalStatus,
    modifyAutoApprovalStatus: modifyAutoApprovalStatus
};