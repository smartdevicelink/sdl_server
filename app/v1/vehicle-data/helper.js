//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const sql = require('./sql.js');
const parseXml = require('xml2js').parseString;
const request = require('request');
const async = require('async');
const _ = require('lodash');
const check = require('check-types');
const getRpcSpec = require('./../messages/helper').getRpcSpec;

/**
 * Required fields are name, type, and key. All other fields are
 * optional.
 *
 * @param req
 * @param res
 */
function validatePost(req, res) {
    if (!check.string(req.body.name) || req.body.name.length < 1) {
        res.parcel
            .setStatus(400)
            .setMessage('Required: name (string)');
        return;
    }
    if (!check.string(req.body.key) || req.body.key.length < 1) {
        res.parcel
            .setStatus(400)
            .setMessage('Required: key (string)');
        return;
    }
    if (!check.string(req.body.type) || req.body.type.length < 1) {
        res.parcel
            .setStatus(400)
            .setMessage('Required: type (string)');
        return;
    }
    return;
}

function promoteCustomVehicleData(client, obj, parentObjectMapping = {}) {
    return function(cb) {
        let originalParentId = obj.parent_id;
        if (obj.parent_id) {
            let parent = parentObjectMapping[obj.parent_id];
            if (!parent.id) {
                return cb(`Orphaned record`);
            }
            //assign parent_id based on parentIdMapping.
            obj.parent_id = parent.id;
            obj.is_deleted = parent.is_deleted === true;
        }

        async.waterfall(
            [
                function(callback) {
                    //skip update if status is on production and not a child that has had its parentId changed.
                    if (obj.status === 'PRODUCTION' && !(obj.parent_id && obj.parent_id != originalParentId)) {
                        parentObjectMapping[obj.id] = obj;
                        return callback(null);
                    }
                    client.getOne(sql.insertCustomVehicleData(obj, true), function(err, result) {
                        if (!err && result) {
                            parentObjectMapping[obj.id] = result;
                        }
                        callback(err, result);
                    });
                }
            ], function(err) {
                if (err) {
                    return cb(err);
                }

                //update children.
                if (obj.params && obj.params.length > 0) {
                    let functions = [];
                    for (let param of obj.params) {
                        functions.push(promoteCustomVehicleData(client, param, parentObjectMapping));
                    }
                    return async.waterfall(functions, function(err) {
                        cb(err);
                    });
                } else {
                    cb(err);
                }

            }
        );
    };
}

/**
 * Promotes all custom_vehicle_data records in STAGING if they are the
 * most recent. This means creating new PRODUCTION records and making sure
 * any parent_id relationships remain unchanged.
 *
 * Promoting a parent will cause all new PRODUCTION child records to be created.
 *
 * If the child record is in STAGING a new PRODUCTION record will be created using staging and the parent_id.
 *
 * This will be done as a single transaction with top level records being created first.
 *
 *
 * @param cb
 */
function promote(cb) {
    app.locals.db.runAsTransaction(function(client, callback) {
        async.waterfall(
            [
                function(callback) {
                    app.locals.db.sqlCommand(sql.getVehicleData(false), function(err, res) {
                        callback(null, res);
                    });
                },
                //create nested data.
                function(data, callback) {
                    return getNestedCustomVehicleData(data, false, callback);
                },
                //insert data
                function(data, callback) {
                    let functions = [];
                    for (let customVehicleDataItem of data) {
                        functions.push(promoteCustomVehicleData(client, customVehicleDataItem));
                    }
                    async.waterfall(functions, callback);
                }
            ], callback
        );
    }, cb);

}

function insertCustomVehicleDataItem(client, data, cb) {
    async.waterfall(
        [
            function(callback) {
                client.getOne(sql.insertCustomVehicleData(data, false), function(err, res) {
                    if (err) {
                        return cb(err, res);
                    }
                    callback(err, res);
                });
            },
            function(res, callback) { //insert new children
                let functions = [];
                if (data.params) {
                    for (let child of data.params) {
                        child.status = 'STAGING';
                        child.parent_id = res.id;
                        functions.push(function(cb) {
                            insertCustomVehicleDataItem(client, child, cb);
                        });
                    }
                }

                async.parallel(functions, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(err);
                });
            },
        ], cb
    );

}

function transformVehicleDataItem(customVehicleDataItem, isForPolicyTable) {
    if (!isForPolicyTable) {
        return customVehicleDataItem;
    }

    let mapping = {
        name: {
            dbKey: 'name',
            type: 'String'
        },
        type: {
            dbKey: 'type',
            type: 'String'
        },
        since: {
            dbKey: 'since',
            type: 'String'
        },
        until: {
            dbKey: 'until',
            type: 'String'
        },
        deprecated: {
            dbKey: 'deprecated',
            type: 'Boolean'
        },
        removed: {
            dbKey: 'removed',
            type: 'Boolean'
        },
        key: {
            dbKey: 'key',
            type: 'String'
        },
        mandatory: {
            dbKey: 'mandatory',
            type: 'Boolean'
        },
        minlength: {
            dbKey: 'min_length',
            type: 'Number'
        },
        maxlength: {
            dbKey: 'max_length',
            type: 'Number'
        },
        minsize: {
            dbKey: 'min_size',
            type: 'Number'
        },
        maxsize: {
            dbKey: 'max_size',
            type: 'Number'
        },
        minvalue: {
            dbKey: 'min_value',
            type: 'Number'
        },
        maxvalue: {
            dbKey: 'max_value',
            type: 'Number'
        },
        array: {
            dbKey: 'array',
            type: 'Boolean'
        },

    };

    let result = {};
    for (let key in mapping) {
        let dbSchema = mapping[key];
        let type = dbSchema.type;
        let dbKey = dbSchema.dbKey;

        let val = customVehicleDataItem[dbKey];

        if (val === null || val === undefined || val === '') {
            continue;
        }
        if (type === 'Boolean') {
            val = val === 'true' || val === true;
        } else if (type === 'Number') {
            val = +val;
        }
        result[key] = val;
    }

    if (customVehicleDataItem.type === 'Struct')
    if (customVehicleDataItem.type === 'Struct') {
        result.params = customVehicleDataItem.params;
    }

    return result;
}

/**
 *
 * @param customVehicleDataItems
 * @param isForPolicyTable
 * @param cb
 */
function getNestedCustomVehicleData(customVehicleDataItems, isForPolicyTable, cb) {
    let vehicleDataById = {};
    for (let customVehicleDataItem of customVehicleDataItems) {
        vehicleDataById[customVehicleDataItem.id] = customVehicleDataItem;
        customVehicleDataItem.params = [];
    }

    let result = [];
    for (let customVehicleDataItem of customVehicleDataItems) {
        if (customVehicleDataItem.parent_id) {
            //if we are filtering by id the parent will not be included.
            if (vehicleDataById[customVehicleDataItem.parent_id]) {
                vehicleDataById[customVehicleDataItem.parent_id].params.push(transformVehicleDataItem(customVehicleDataItem, isForPolicyTable));
            } else { //if no parent_id matches, assume this is a top level item.
                result.push(transformVehicleDataItem(customVehicleDataItem, isForPolicyTable));
            }
        } else {
            result.push(transformVehicleDataItem(customVehicleDataItem, isForPolicyTable));
        }
    }
    cb(null, result);
}

/**
 * Returns a list of custom vehicle data items filtered by status and optionally by id.
 * @param isProduction - If true return status = PRODUCTION otherwise status = STAGING
 * @param id - return only this id and child params.
 * @param cb
 */
function getVehicleData(isProduction, id, cb) {
    async.waterfall(
        [
            app.locals.db.sqlCommand.bind(null, sql.getVehicleData(isProduction, id)),
            function(data, callback) {
                getNestedCustomVehicleData(data, false, callback);
            }
        ], function(err, response) {
            cb(err, response);
        }
    );
}

function extractRpcSpecVersion(data, next) {
    data.rpcSpec = {
        version: _.get(data.xml, 'interface.$.version', null),
        min_version: _.get(data.xml, 'interface.$.minVersion', null),
        date: _.get(data.xml, 'interface.$.date', null)
    };
    next(null, data);
}

function extractRpcSpecTypes(data, next) {
    let mapping = {
        'name': 'name',
        'since': 'since',
        'until': 'until',
        'deprecated': 'deprecated',
        'removed': 'removed',
        'internal_scope': 'internal_scope',
        'functionID': 'function_id',
        'messagetype': 'message_type'
    };

    let paramMapping = {
        'name': 'name',
        'type': 'type',
        'rootscreen': 'root_screen',
        'mandatory': 'mandatory',
        'since': 'since',
        'until': 'until',
        'deprecated': 'deprecated',
        'removed': 'removed',
        'value': 'value',
        'hexvalue': 'hex_value',
        'minlength': 'min_length',
        'maxlength': 'max_length',
        'minsize': 'min_size',
        'maxsize': 'max_size',
        'minvalue': 'min_value',
        'maxvalue': 'max_value',
        'array': 'array',
        'platform': 'platform',
        'defvalue': 'def_value',
    };

    let rpcSpecTypes = [];

    data.rpcSpecParams = [];

    const enumerations = _.get(data, 'xml.interface.enum');
    const structs = _.get(data, 'xml.interface.struct');
    const functions = _.get(data, 'xml.interface.function');

    if (!enumerations) {
        return next('enum not defined in the imported rpc spec');
    }
    if (!structs) {
        return next('struct not defined in the imported rpc spec');
    }
    if (!functions) {
        return next('function not defined in the imported rpc spec');
    }

    //extract enums
    for (let enumeration of enumerations) {
        let enumData = {
            element_type: 'ENUM',
        };

        const enumerationAttributes = _.get(enumeration, '$', {});

        if (!enumerationAttributes['name']) {
            return next('Enum must have a name defined.');
        }
        if (!enumeration['element']) {
            return next('Enum must have element defined.');
        }

        for (let key in mapping) {
            enumData[mapping[key]] = _.get(enumerationAttributes, key, null);
        }

        rpcSpecTypes.push(enumData);

        for (let element of enumeration.element) {
            let param = {
                rpc_spec_type_name: enumData.name
            };

            const elementAttributes = _.get(element, '$', {});

            if (!elementAttributes['name']) {
                return next('Element of enum must have a name defined.');
            }

            for (let key in paramMapping) {
                param[paramMapping[key]] = _.get(elementAttributes, key, null);
            }

            data.rpcSpecParams.push(param);

        }

    }

    //extract structs
    for (let struct of structs) {
        let structData = {
            element_type: 'STRUCT',
        };

        const attributes = _.get(struct, '$', {});

        if (!attributes['name']) {
            return next('Struct must have a name defined.');
        }

        for (let key in mapping) {
            structData[mapping[key]] = _.get(attributes, key, null);
        }

        rpcSpecTypes.push(structData);

        if (!struct['param']) {
            continue;
        }

        for (let element of struct.param) {
            let param = {
                rpc_spec_type_name: structData.name
            };

            const elementAttributes = _.get(element, '$', {});

            if (!elementAttributes['name']) {
                return next('Param of struct must have a name defined.');
            }

            for (let key in paramMapping) {
                param[paramMapping[key]] = _.get(elementAttributes, key, null);
            }

            data.rpcSpecParams.push(param);

        }
    }

    //extract functions
    for (let func of functions) {
        let funcData = {
            element_type: 'FUNCTION',
        };

        const attributes = _.get(func, '$', {});

        if (!attributes['name']) {
            return next('Struct must have a name defined.');
        }

        if (!func['param']) {
            continue;
        }

        for (let key in mapping) {
            funcData[mapping[key]] = _.get(attributes, key, null);
        }

        rpcSpecTypes.push(funcData);

        for (let element of func.param) {
            let name = funcData.name;
            if (funcData.message_type) {
                name = `${name}.${funcData.message_type}`;
            }
            let param = {
                rpc_spec_type_name: name
            };

            const elementAttributes = _.get(element, '$', {});

            if (!elementAttributes['name']) {
                return next('Param of func must have a name defined.');
            }

            for (let key in paramMapping) {
                param[paramMapping[key]] = _.get(elementAttributes, key, null);
            }

            data.rpcSpecParams.push(param);

        }

    }

    data.rpcSpecTypes = rpcSpecTypes;

    next(null, data);
}

function updateRpcSpec(next) {

    app.locals.db.runAsTransaction(function(client, callback) {
        async.waterfall(
            [
                getRpcSpec,
                function(rpcString, callback) {
                    parseXml(rpcString, function(err, xml) {
                        callback(err, { xml: xml });
                    });
                },
                extractRpcSpecVersion,
                //check rpc version exists exit if already exists.
                function(data, callback) {
                    let rpcSpec = data.rpcSpec;
                    client.getOne(sql.getLatestRpcSpec(), function(err, result) {
                        if (result && result.version) {
                            if (rpcSpec.version === result.version) {
                                return callback({ skipReason: 'Rpc spec no update required' });
                            }
                        }
                        callback(err, data);
                    });
                },
                function(data, callback) {
                    let rpcSpec = data.rpcSpec;
                    client.getOne(sql.insertRpcSpec(rpcSpec), function(err, result) {
                        data.rpcSpecInsert = result;
                        callback(err, data);
                    });
                },
                extractRpcSpecTypes,
                function(data, callback) {
                    client.getMany(sql.insertRpcSpecType(data.rpcSpecInsert.id, data.rpcSpecTypes), function(err, result) {

                        data.rpcSpecTypesByName = {};

                        for (let rpcSpecType of result) {
                            let name = rpcSpecType.name;
                            if (rpcSpecType.message_type) {
                                name = `${name}.${rpcSpecType.message_type}`;
                            }
                            data.rpcSpecTypesByName[name] = rpcSpecType;
                        }
                        callback(err, data);
                    });
                },
                function(data, callback) {
                    client.getOne(sql.insertRpcSpecParam(data.rpcSpecParams, data.rpcSpecTypesByName), function(err, result) {
                        callback(err, data);
                    });
                }
            ], callback);
    }, function(err, response) {

        if (err) {
            if (err.skipReason) {
                //warning only, spec already imported etc.
                app.locals.log.info(err.skipReason);
            } else {
                app.locals.log.error(err);
            }
        } else {

            app.locals.log.info('New RPC Spec saved');
        }

        if (typeof next == 'function') {
            next();
        }
    });

}

function getTemplate(cb) {
    return cb(
        null,
        {
            'id': null,
            'parent_id': null,
            'status': 'STAGING',
            'name': null,
            'type': null,
            'key': null,
            'mandatory': false,
            'min_length': null,
            'max_length': null,
            'min_size': null,
            'max_size': null,
            'min_value': null,
            'max_value': null,
            'array': false,
            'params': [],
            'is_deleted': false
        }
    );
}

function getValidTypes(cb) {

    //primitive types and structgetVehicleDataParamTypes
    let types = [
        {
            name: 'Float',
            allow_params: false,
        },
        {
            name: 'String',
            allow_params: false,
        },
        {
            name: 'Boolean',
            allow_params: false,
        },
        {
            name: 'Integer',
            allow_params: false,
        },
        {
            name: 'Struct',
            allow_params: true,
        }
    ];

    app.locals.db.sqlCommand(sql.getEnums(), function(err, enums) {
        if (err) {
            return cb(err);
        }
        for (let item of enums) {
            types.push(
                {
                    name: item.name,
                    allow_params: false
                }
            );
        }

        return cb(null, types);
    });
}

module.exports = {
    getTemplate: getTemplate,
    insertCustomVehicleDataItem: insertCustomVehicleDataItem,
    getNestedCustomVehicleData: getNestedCustomVehicleData,
    transformVehicleDataItem: transformVehicleDataItem,
    validatePost: validatePost,
    promote: promote,
    getVehicleData: getVehicleData,
    getValidTypes: getValidTypes,
    updateRpcSpec: updateRpcSpec,
};
