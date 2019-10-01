//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const sql = require('./sql.js');
const parseXml = require('xml2js').parseString;
const request = require('request');
const async = require('async');
const _ = require('lodash');

function validatePost(req, res) {
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

        //example struct with no params.
        // <struct name="MediaServiceManifest" since="5.1"></struct>
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

        //example function with no params.
        //<function name="UnregisterAppInterface" functionID="UnregisterAppInterfaceID" messagetype="request" since="1.0"></function>
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
        }
        else {
            app.locals.log.info('Rpc spec updated');
        }
        next();
    });

}

module.exports = {
    validatePost: validatePost,
    updateRpcSpec: updateRpcSpec,
};
