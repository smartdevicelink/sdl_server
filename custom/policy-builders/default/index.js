//module example for helping to build policy tables.
const initGroups = require('./initiateFunctionalGroups.js');
const addHmiLevels = require('./addHmiLevels.js');
//this is the entry point for when the policy server asks for information about functional groups
//and how functional groups are assigned to app requests
//this module is the source of all functional group information and is intended to be highly customizable

module.exports = function (log) {
    //exported functions. these are required to implement
    return {
        /*
            This function is invoked when an update is triggered to check both for updated app information
            and functional group information. Currently, this function only gets invoked every time the policy server
            starts to run. It is the first of these functions that get invoked. The following is the format of the response:

            //used directly in the insertion of the SQL table function_group_info
            [
                {
                    property_name: A string that is the name of the functional group
                    user_consent_prompt: A string referencing a consumer friendly message that is tied to this functional group. not required
                },
                ...
            ]
        */
        initiateFunctionalGroups: function () {
            //create all the function group objects so that permissions can exist inside them
            return initGroups.createDefaultFunctionalGroups();
        },
        /*
            This function is invoked shortly after initiateFunctionalGroups, and so only gets invoked every time the
            policy server starts to run. It is here where the policy server expects permission relation information. It is here
            where relations such as vehicle parameters to vehicle data RPCs get defined so that the policy server knows
            that when these vehicle parameters are seen for a functional group the server knows that those permissions 
            need to be under vehicle data RPCs. The following is the expected format:
            [
                {
                    permissionName: The name of the permission that is dependent on its parents
                    parents: An array of permissions that need to exist for the permissionName to work
                }
            ]
        */
        createPermissionRelations: function (permissions) {
            return initGroups.generatePermissionRelations(permissions);
        },
        /*
            This function is invoked shortly after initiateFunctionalGroups, and so only gets invoked every time the
            policy server starts to run. It is here where the policy server expects permission information associated with 
            each functional group. The following is the format of the response:
            (based off the SQL table definition function_group_permissions)
                [
                    {
                        functionalGroupName: A string that is the name of the functional group this permission is associated with
                        permissionName: The name of the permission
                    },
                    ...
                ]
        */
        createGroupPermissions: function () {
            //go through and evaluate all the functional groups and give each group certain permissions
            return initGroups.generatePermissions();
        },
        /*
            This function is invoked after createGroupPermissions, when the policy server constructs the entire functional group
            object in JSON to be prepared to be sent in policy table update responses. Therefore, this function only gets invoked 
            every time the policy server starts to run. The entire functional group object gets sent here where it can be logged
            to see if the functional group object came out the way it was intended, or to add some finishing touches that the previous
            functions were unable to do. An example is adding HMI levels to each permission. Anything can be done to this object, as long
            as the modified functional group object is returned
        */
        modifyFunctionalGroupObject: function (funcGroupObj) {
            //add HMI LEVELs to the functional group object
            return addHmiLevels(funcGroupObj); //modifies the original object
        },
        /*
            This function is invoked when a policy table update request comes from sdl_core, and happens before each
            approved app request is evaluated. Here is where any setup can be done to the app_policy object before
            the app requests are read, such as setting default policies and default functional groups. The object
            that comes in will only contain properties that are the approved app ids
        */
        preRunAppPolicyObject: function (appPolicy) {
            //do any custom logic to the app policy object before it runs through each permitted app id
            //this is useful if you want to, for example, add or set different default permissions to all app ids
            //before finding the permitted ones. modify the appPolicy object
            for (let appId in appPolicy) {
                appPolicy[appId] = "default";
            }
            appPolicy.default = {
                "keep_context": false,
                "steal_focus": false,
                "priority": "NONE",
                "default_hmi": "NONE",
                "groups": ["Base-4"]               
            };
            appPolicy.device = {
                "keep_context": false,
                "steal_focus": false,
                "priority": "NONE",
                "default_hmi": "NONE",
                "groups": ["DataConsent-2"]              
            };
            appPolicy.pre_DataConsent = {
                "keep_context": false,
                "steal_focus": false,
                "priority": "NONE",
                "default_hmi": "NONE",
                "groups": ["BaseBeforeDataConsent"]              
            };

            return;
        },
        /*
            This function is invoked when a policy table update request comes from sdl_core, and is invoked for every
            approved app request. The current app information is passed in to this function. Here is where 
            functional groups and other information are assigned to the app's individual policy object. The return must be an object
            of that specific app id's policy information (ex. steal_focus, groups, default_hmi, etc.) 
        */
        createAppPolicyObject: function (appObj) {
            let appIdPolicy = {};
            //assign functional groups and final edits
            appIdPolicy.nicknames = appObj.display_names;
            appIdPolicy.keep_context = true;
            appIdPolicy.steal_focus = appObj.can_steal_focus;
            appIdPolicy.priority = "NONE";
            appIdPolicy.default_hmi = appObj.default_hmi_level;
            appIdPolicy.groups = []; //let the editAppPolicy function assign functional groups
            appIdPolicy.moduleType = [];

            return initGroups.editAppPolicy(appIdPolicy, appObj);
        }
    };
}
