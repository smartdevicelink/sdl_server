//module example for helping to build policy tables.
const initGroups = require('./initiateFunctionalGroups.js');


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
        }
    };
}

/*
function_group_info
    "property_name" TEXT NOT NULL,
    "user_consent_prompt" TEXT,

rpc_permission
    "function_group_id" SERIAL REFERENCES function_group_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "rpc_id" SERIAL REFERENCES rpc_names (id) ON UPDATE CASCADE ON DELETE CASCADE,

rpc_vehicle_parameters
    "function_group_id" SERIAL REFERENCES function_group_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "rpc_id" SERIAL REFERENCES rpc_names (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "vehicle_id" SERIAL REFERENCES vehicle_data (id) ON UPDATE CASCADE ON DELETE CASCADE,

TODO: another function that assigns HMI levels.
*/