The policy server relies on custom modules to do work that the policy server cannot do because otherwise the server will make some unnecessary assumptions that may not make sense for some developers. Splitting up work into separate modules and allowing customization of those modules is what makes the policy server so flexible. There are some basic restrictions and functions required to implement for custom modules to work, and that will be covered here.

## Loggers
Only two named functions need to be exported in an object for a valid implementation: `info` and `error`. `info` accepts a string as its first parameter and is used to log non-error messages using the string. `error` accepts a string and is used for logging error messages using the string. Check the default `winston` module for an example.

## Databases
Only slightly more complicated than the logger, the export should be just a function with a logger object as the argument. This object is the same object as the one exported in the custom logger module, so `info` and `error` can be invoked on it. In addition to exporting a function, it must return an object with a function in it named `sqlCommand`:
```
return {
    sqlCommand: function (query, callback) {
    }
}
```

`query` is the SQL string to execute, and `callback` is the function to invoke when `sqlCommand` is complete. Check out the default `postgres` module for an example implementation

## Data Collectors
Similar to the database module, this module must export a function where a logger will be passed in as an argument. The function must return an object of the following structure:
```
return {
    getAppRequests: function (appRequests, next) { 
    },
    getHmiLevels: function (hmiLevels, next) {
    },
    getCountries: function (countries, next) {
    },        
    getCategories: function (categories, next) {
    },
    getRpcPermissions: function (rpcPermissions, next) {
    },
    getVehicleDataPermissions: function (vehicleDataPermissinons, next) {
    }
};
```
Note that the function signature is different than the one found in the default `shaid` module. This is because `shaid` is the first data collector to be invoked, and therefore no data can be passed to it. When `next` is called, the data from `shaid` will be passed to any other data collectors that have been defined in `config.js`. Those other modules can then append additional information and pass it to the next modules. 

`next` is a callback function that accepts two parameters. The first parameter is an error of some sort. If it is defined, the policy server will see that as an error that happened. The second parameter is the data that should be passed depending on the function. If a custom module doesn't wish to modify anything passed to it for say, `getCategories`, then it should invoke `next` like so: `next(null, categories)`.

To see the format of each type of data, check out the `shaid` module, or look [here](https://smartdevicelink.com/en/docs/shaid/master/v2/) for responses that come from SHAID.

## Policy Builders
A function needs to be exported, and a logger module will be passed in as an argument. Here's the required return object:

```
return {
    initiateFunctionalGroups: function () {
    },
    createGroupPermissions: function () {
    },
    modifyFunctionalGroupObject: function (funcGroupObj) {
    },
    preRunAppPolicyObject: function (appPolicy) {
    },
    createAppPolicyObject: function (appObj) {
    }
};
```

Full explanations are given in the [source code](https://github.com/smartdevicelink/sdl_server/blob/v2/server/custom/policy-builders/default/index.js) as to what each of these functions require and what they need to return, but here is a summary:
* `initiateFunctionalGroups`: Invoked first, and only when the policy server starts up and is beginning to build functional groups. This function should return a "skeleton" of what the functional groups should be
* `createGroupPermissions`: Invoked secondly, and only on server start up. For every functional group defined in  `initiateFunctionalGroups`, define permissions that the functional group permits.
* `modifyFunctionalGroupObject`: Invoked thirdly, and only on server start up. Final edits to the functional group happen here, and full control is given over what can be edited. For example, in the `default` policy builder module this function is used to add HMI levels to each functional group, which is a vital step.
* `preRunAppPolicyObject`: Invoked when a policy table update happens. Here is where defaults can be set up before iterating through each approved application. 
* `createAppPolicyObject`: Invoked when a policy table update happens. Here is where functional groups are assigned to applications, and which functional groups are assigned may depend on the permissions those applications asked for. After this function is invoked for every approved application, the policy table is constructed and sent to the requester.
