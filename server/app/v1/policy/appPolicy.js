const async = require('async');
const sql = require('sql-bricks');
let app; //to be defined

module.exports = function (appObj) {
    app = appObj;
    return {
        createPolicyObject: createPolicyObject
    };
}

function createPolicyObject (appPolicies, callback) {
    //assume that every property in appPolicies except for "default", "device", and "pre_DataConsent" are app ids
    //for each app id present, get its app id info from the DB, add that info to the policy object, and assign appropriate
    //functional groups to that app id

    //get DB information first
    async.waterfall([
        function (next) {
            //get the latest versions of the app ids that aren't denied
            const groupedAppInfoStr = sql.select('app_uuid', 'approval_status', 'max(id) AS id')
                .from('app_info')
                .groupBy('app_uuid', 'approval_status').toString();

            const fullAppInfoStr = sql.select('app_info.*')
                .from('(' + groupedAppInfoStr + ') group_ai')
                .join('app_info', {'app_info.id': 'group_ai.id'})
                .where(sql.not(sql.in('app_info.approval_status', ['DENIED'])))
                .toString();

            app.locals.db.sqlCommand(fullAppInfoStr, function (err, appInfo) {
                next(err, appInfo.rows);
            });
        },
        function (appInfo, next) {
            //get the display names
            const displayNameStr = sql.select('*').from('display_names').toString();

            app.locals.db.sqlCommand(displayNameStr, function (err, data) {
                //associate the display names with the correct appInfo
                //TODO: parallelize this
                const displayNames = data.rows;
                for (let i = 0; i < displayNames.length; i++) {
                    let appObj = findObjByProperty(appInfo, 'id', displayNames[i].app_id);
                    if (appObj.display_names === undefined) {
                        appObj.display_names = [];
                    }
                    appObj.display_names.push(displayNames[i].display_text);
                }
                next(err, appInfo);
            });            
        },
    ], function (err, appInfo) {
        if (err) {
            app.locals.log.error(err);
        }
        //all the info we need from the DB is now here. compare this info with the app ids from 
        //the policy table update request and give out permissions
        findPermissionsForApps(appInfo);
    });

    function findPermissionsForApps (appInfo) {
        console.log(JSON.stringify(appInfo, null, 4));
        console.log(JSON.stringify(appPolicies, null, 4));
        //to respond with the app policies object, just modify the one that came in through the request
        let tasks = [];
        //get all the app uuids for reference
        for (let appId in appPolicies) {
            if (appId !== "default" && appId !== "device" && appId !== "pre_DataConsent") {
                //valid app id. get its information, if it exists
                const requestedAppObj = findObjByProperty(appInfo, 'app_uuid', appId);
                if (requestedAppObj) {
                    //extract information from the app obj and assign it a set of functional groups previously defined
                    const appPolicy = constructAppPolicy(requestedAppObj);
                    appPolicies[appId] = appPolicy;
                }
            }
        }
        callback(appPolicies);
    }
}

function constructAppPolicy (appObj) {
    let appPolicy = {};
    appPolicy.nicknames = appObj.display_names;
    appPolicy.keep_context = true;
    appPolicy.steal_focus = appObj.can_steal_focus;
    appPolicy.priority = "NONE";
    appPolicy.default_hmi = appObj.default_hmi_level;
    appPolicy.groups = []; //let the custom module assign functional groups
    appPolicy.background_alert = appObj.can_background_alert;

    return appPolicy;
}

//TODO: move this function and other related functions to a general utility module stored in the app object, or something
function findObjByProperty (array, propName, value) {
    for (let i = 0; i < array.length; i++) {
        if (array[i][propName] === value) {
            return array[i];
        }
    }
    return null;
}