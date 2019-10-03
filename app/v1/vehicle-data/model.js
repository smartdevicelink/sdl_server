//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const sql = require('./sql.js');

/**
 * Create a new staging record on every update even when the existing
 * record is in STAGING.
 * @param obj
 * @param cb
 */
function insertVehicleData(obj, cb)
{
    const sql = require('./sql.js');

    app.locals.db.sqlCommand(sql.insertStagingCustomVehicleData(obj), function(err, res) {
        cb(null, res);
    });

}

module.exports = {
    insertVehicleData: insertVehicleData,
};
