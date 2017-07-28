//module example for helping to build policy tables.
const initGroups = require('./initiateFunctionalGroups.js');
const createPermissions = require('./createFunctionalGroupPermissions.js');
const addHmiLevels = require('./addHmiLevels.js');

module.exports = function (log) {
    //exported functions. these are required to implement
    return {
        initiateFunctionalGroups: function (permissions, callback) {
            //permissions.rpcNames is an array of RPCs that can be permitted
            //permissions.vehicleDataNames is an array of vehicle data components that can be permitted

            //first, create all the function group objects so that permissions can exist inside them
            const defaultGroups = initGroups.createDefaultFunctionalGroups();
            //make extra function groups so that each permission has one function group associated with them
            //this is to handle the case where there is a set of permissions that don't fit in any of the default functional groups  
            //ex. only gps is asked for when we have only a functional group that groups gps and speed together.
            const granularGroups = initGroups.generateFunctionalGroups(permissions.rpcNames, permissions.vehicleDataNames);
            //combine the two group arrays
            callback(defaultGroups.concat(granularGroups));
        },
        createGroupPermissions: function (permissions, functionalGroups, callback) {
            //the functional groups we defined in initialFunctionGroups came back with information including the id, so the
            //functional groups can now be referenced correctly when adding permissions

            //go through and evaluate all the functoinal groups and give each group certain permissions
            const permissionObjs = createPermissions.generatePermissions(permissions.rpcNames, permissions.vehicleDataNames, functionalGroups);
            callback(permissionObjs);
        },
        modifyFunctionalGroupObject: function (funcGroupObj, rpcNames, vehicleDataNames, callback) {
            //add HMI LEVELs to the functional group object
            addHmiLevels(funcGroupObj, rpcNames, vehicleDataNames); //modifies the original object
            callback(funcGroupObj);
        }
    };
}