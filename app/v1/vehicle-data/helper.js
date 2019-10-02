//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const sql = require('./sql.js');
const parseXml = require('xml2js').parseString;
const request = require('request');
const async = require('async');
const _ = require('lodash');

function validatePost(req, res) {
    return;
}

function promoteCustomVehicleData(client, obj, parentIdMapping = {}) {
    return function(cb) {
        let originalParentId = obj.parent_id;
        if (obj.parent_id) {
            let parent_id = parentIdMapping[obj.parent_id];
            if (!parent_id) {
                return cb(`Orphaned record`);
            }
            obj.parent_id = parent_id;
            //assign parent_id based on parentIdMapping.
        }

        async.waterfall(
            [
                function(callback) {
                    //skip update if status is on production and not a child that has had its parentId changed.
                    if (obj.status === 'PRODUCTION' && !(obj.parent_id && obj.parent_id != originalParentId)) {
                        parentIdMapping[obj.id] = obj.id;
                        return callback(null);
                    }
                    client.getOne(sql.insertProductionCustomVehicleData(obj), function(err, result) {
                        if (!err && result) {
                            parentIdMapping[obj.id] = result.id;
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
                        functions.push(promoteCustomVehicleData(client, param, parentIdMapping));
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
                    let vehicleDataById = {};
                    for (let customVehicleDataItem of data) {
                        vehicleDataById[customVehicleDataItem.id] = customVehicleDataItem;
                        customVehicleDataItem.params = [];
                    }

                    let result = [];
                    for (let customVehicleDataItem of data) {
                        if (customVehicleDataItem.parent_id) {
                            //old record not included.
                            if (!vehicleDataById[customVehicleDataItem.parent_id]) {
                                continue;
                            } else {
                                vehicleDataById[customVehicleDataItem.parent_id].params.push(customVehicleDataItem);
                            }
                        } else {
                            result.push(customVehicleDataItem);
                        }
                    }
                    callback(null, result);
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

/**
 * Returns a list of custom vehicle data items filtered by status and optionally by id.
 * @param isProduction - If true return status = PRODUCTION otherwise status = STAGING
 * @param id - return only this id and child params.
 * @param cb
 */
function getVehicleData(isProduction, id, cb) {
    async.waterfall(
        [
            function(callback) {
                app.locals.db.sqlCommand(sql.getVehicleData(isProduction), function(err, res) {
                    callback(null, res);
                });
            },
            function(data, callback) {
                let vehicleDataById = {};
                for (let customVehicleDataItem of data) {
                    vehicleDataById[customVehicleDataItem.id] = customVehicleDataItem;
                    customVehicleDataItem.params = [];
                }

                let result = [];
                for (let customVehicleDataItem of data) {
                    if (customVehicleDataItem.parent_id) {
                        //if we are filtering by id the parent will not be included.
                        if (vehicleDataById[customVehicleDataItem.parent_id]) {
                            vehicleDataById[customVehicleDataItem.parent_id].params.push(customVehicleDataItem);
                        }

                        if (id && id == customVehicleDataItem.id) {
                            result.push(customVehicleDataItem);
                        }
                    } else {
                        if (!id || id == customVehicleDataItem.id) {
                            result.push(customVehicleDataItem);
                        }

                    }

                }
                callback(null, result);
            }
        ], function(err, response) {
            cb(err, response);
        }
    );
}

function getRpcSpec(next) {
    request(
        {
            method: 'GET',
            url: app.locals.config.rpcSpecXmlUrl
        },
        function(err, res, body) {
            next(err, body);
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

function updateRpcSpec(next = function() {
}) {

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

            app.locals.log.info('Rpc spec updated');
        }
        next();
    });

}

module.exports = {
    validatePost: validatePost,
    promote: promote,
    getVehicleData: getVehicleData,
    updateRpcSpec: updateRpcSpec,
};
