//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const sql = require('./sql.js');
const parseXml = require('xml2js').parseString;
const needle = require('needle');

function validatePost(req, res) {
}

function getRpcSpec(next) {
    //use the url from the settings.js file
    needle.get(app.locals.config.githubLanguageSourceUrl, function(err, res) {
        next(err, res.body);
    });
}

function extractParams(rpcSpec, next) {
    const getVehicleDataResponse = rpcSpec.interface.function.find(function(elem) {
        return elem['$'].name === 'GetVehicleData' && elem['$'].messagetype === 'request';
    });
    const params = getVehicleDataResponse.param
        .map(function(param) {
            return param['$'].name;
        });
    next(null, params);
}

function extractEnums(rpcSpec, next) {
    const enums = rpcSpec.interface.enum.map(function(elem) {
        return elem['$'].name;
    });
    next(null, enums);
}

function updateVehicleDataEnums(next) {
    const messageStoreFlow = [
        getRpcSpec,
        parseXml,
        extractEnums,
        insertVehicleDataEnums
    ];

    function insertVehicleDataEnums(params, next) {
        app.locals.flow(app.locals.db.setupSqlCommands(sql.insert.vehicleDataEnums(params)), { method: 'parallel' })(next);
    }

    app.locals.flow(messageStoreFlow, { method: 'waterfall', eventLoop: true })(function(err, res) {
        if (err) {
            app.locals.log.error(err);
        }
        if (next) {
            next(); //done
        }
    });
}

function updateVehicleDataReservedParams(next) {
    const messageStoreFlow = [
        getRpcSpec,
        parseXml,
        extractParams,
        insertVehicleDataReservedParams
    ];

    function insertVehicleDataReservedParams(params, next) {
        app.locals.flow(app.locals.db.setupSqlCommands(sql.insert.vehicleDataReservedParams(params)), { method: 'parallel' })(next);
    }

    app.locals.flow(messageStoreFlow, { method: 'waterfall', eventLoop: true })(function(err, res) {
        if (err) {
            app.locals.log.error(err);
        }
        if (next) {
            next(); //done
        }
    });
}

module.exports = {
    validatePost: validatePost,
    updateVehicleDataReservedParams: updateVehicleDataReservedParams,
    updateVehicleDataEnums: updateVehicleDataEnums,
};
