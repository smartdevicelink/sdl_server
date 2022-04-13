//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const sql = require('./sql.js');
const parseXml = require('xml2js').parseString;
const _ = require('lodash');
const check = require('check-types');
const getRpcSpec = require('./../messages/helper').getRpcSpec;
const cache = require('../../../custom/cache');
const promisify = require('util').promisify;

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

async function promoteCustomVehicleData (client, obj, parentObjectMapping = {}) {
    let originalParentId = obj.parent_id;
    if (obj.parent_id) {
        let parent = parentObjectMapping[obj.parent_id];
        if (!parent.id) {
            return new Error('Orphaned record');
        }
        //assign parent_id based on parentIdMapping.
        obj.parent_id = parent.id;
        obj.is_deleted = parent.is_deleted === true;
    }

    //skip update if status is on production and not a child that has had its parentId changed.
    if (obj.status === 'PRODUCTION' && !(obj.parent_id && obj.parent_id != originalParentId)) {
        parentObjectMapping[obj.id] = obj;
        return;
    }

    const result = await client.getOne(sql.insertCustomVehicleData(obj, true));
    if (result) {
        parentObjectMapping[obj.id] = result;
    }

    //update children.
    if (obj.params && obj.params.length > 0) {
        for (let param of obj.params) {
            await promoteCustomVehicleData(client, param, parentObjectMapping);
        }
    }
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
 */
async function promote () {
    await app.locals.db.asyncTransaction(async client => {
        let data = await app.locals.db.asyncSql(sql.getVehicleData(false));
        //create nested data.
        data = getNestedCustomVehicleData(data, false);

        //insert data
        for (let customVehicleDataItem of data) {
            await promoteCustomVehicleData(client, customVehicleDataItem);
        }
    });
}

async function insertCustomVehicleDataItem (client, data) {
    const res = await client.getOne(sql.insertCustomVehicleData(data, false));
    //insert new children
    let promises = [];
    if (data.params) {
        for (let child of data.params) {
            child.status = 'STAGING';
            child.parent_id = res.id;
            promises.push(insertCustomVehicleDataItem(client, child));
        }
    }
    return Promise.all(promises);
}

function transformVehicleDataItem (customVehicleDataItem, isForPolicyTable) {
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

    if (customVehicleDataItem.type === 'Struct') {
        result.params = customVehicleDataItem.params;
    }

    return result;
}

/**
 *
 * @param customVehicleDataItems
 * @param isForPolicyTable
 */
function getNestedCustomVehicleData (customVehicleDataItems, isForPolicyTable) {
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
    return result;
}

/**
 * Returns a list of custom vehicle data items filtered by status and optionally by id.
 * @param isProduction - If true return status = PRODUCTION otherwise status = STAGING
 * @param id - return only this id and child params.
 */
async function getVehicleData (isProduction, id) {
    const data = await app.locals.db.asyncSql(sql.getVehicleData(isProduction, id));
    return getNestedCustomVehicleData(data, false);
}

function extractRpcSpecVersion (data) {
    data.rpcSpec = {
        version: _.get(data.xml, 'interface.$.version', null),
        min_version: _.get(data.xml, 'interface.$.minVersion', null),
        date: _.get(data.xml, 'interface.$.date', null)
    };
}

function extractRpcSpecTypes (data) {
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
        app.locals.log.error('enum not defined in the imported rpc spec');
        return false;
    }
    if (!structs) {
        app.locals.log.error('struct not defined in the imported rpc spec');
        return false;
    }
    if (!functions) {
        app.locals.log.error('function not defined in the imported rpc spec');
        return false;
    }

    //extract enums
    for (let enumeration of enumerations) {
        let enumData = {
            element_type: 'ENUM',
        };

        const enumerationAttributes = _.get(enumeration, '$', {});

        if (!enumerationAttributes['name']) {
            app.locals.log.error('Enum must have a name defined.');
            return false;
        }
        if (!enumeration['element']) {
            app.locals.log.error('Enum must have element defined.');
            return false;
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
                app.locals.log.error('Element of enum must have a name defined.');
                return false;
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
            app.locals.log.error('Struct must have a name defined.');
            return false;
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
                app.locals.log.error('Param of struct must have a name defined.');
                return false;
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
            app.locals.log.error('Struct must have a name defined.');
            return false;
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
                app.locals.log.error('Param of func must have a name defined.');
                return false;
            }

            for (let key in paramMapping) {
                param[paramMapping[key]] = _.get(elementAttributes, key, null);
            }

            data.rpcSpecParams.push(param);

        }

    }

    data.rpcSpecTypes = rpcSpecTypes;

    return true;
}

async function updateRpcSpec () {
    await app.locals.db.asyncTransaction(async client => {
        const rpcString = await getRpcSpec();
        const data = {
            xml: await promisify(parseXml)(rpcString)
        };
        extractRpcSpecVersion(data);
        //check if the rpc version exists. exit if already exists.
        const result = await client.getOne(sql.getLatestRpcSpec());
        if (result && result.version) {
            if (data.rpcSpec.version === result.version) {
                app.locals.log.info('Rpc spec: no update required');
                return;
            }
        }
        // insert rpc spec contents and return them
        data.rpcSpecInsert = await client.getOne(sql.insertRpcSpec(data.rpcSpec));
        const success = extractRpcSpecTypes(data);
        if (!success) {
            return;
        }

        const insertTypesResult = await client.getMany(sql.insertRpcSpecType(data.rpcSpecInsert.id, data.rpcSpecTypes));
        data.rpcSpecTypesByName = {};

        for (let rpcSpecType of insertTypesResult) {
            let name = rpcSpecType.name;
            if (rpcSpecType.message_type) {
                name = `${name}.${rpcSpecType.message_type}`;
            }
            data.rpcSpecTypesByName[name] = rpcSpecType;
        }

        await client.getOne(sql.insertRpcSpecParam(data.rpcSpecParams, data.rpcSpecTypesByName));

        // done
        cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
        cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
        app.locals.log.info('New RPC Spec updated and saved');
    }).catch(err => {
        app.locals.log.error(err);
    });
}

function getTemplate () {
    return {
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
}

async function getValidTypes () {

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

    const enums = await app.locals.db.asyncSql(sql.getEnums());

    for (let item of enums) {
        types.push(
            {
                name: item.name,
                allow_params: false
            }
        );
    }

    return types;
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
