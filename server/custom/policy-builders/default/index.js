//module example for helping to build policy tables.
const initGroups = require('./initiateFunctionalGroups.js');
const addHmiLevels = require('./addHmiLevels.js');

module.exports = function (log) {
    //exported functions. these are required to implement
    return {
        //TODO: document what is required to be returned here
        initiateFunctionalGroups: function () {
            //permissions.rpcNames is an array of RPCs that can be permitted
            //permissions.vehicleDataNames is an array of vehicle data components that can be permitted

            //first, create all the function group objects so that permissions can exist inside them
            return initGroups.createDefaultFunctionalGroups();
        },
        createGroupPermissions: function () {
            //the functional groups we defined in initialFunctionGroups came back with information including the id, so the
            //functional groups can now be referenced correctly when adding permissions

            //go through and evaluate all the functional groups and give each group certain permissions
            return initGroups.generatePermissions();
        },
        modifyFunctionalGroupObject: function (funcGroupObj) {
            //add HMI LEVELs to the functional group object
            return addHmiLevels(funcGroupObj); //modifies the original object
        },
        preRunAppPolicyObject: function (appPolicy) {
            //do any custom logic to the policy table before it runs through each permitted app id
            //this is useful if you want to, for example, set different default permissions to all app ids
            //before finding the permitted ones. modify the appPolicy object
            return;
        },
        createAppPolicyObject: function (appPolicy, appObj) {
            //assign functional groups and final edits
            return initGroups.editAppPolicy(appPolicy, appObj);
        }
    };
}