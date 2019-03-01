const app = require('../app');
const setupSql = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');
const helper = require('./helper.js');


function upsertTypes (next) {
    const queryObj = {
        include_permissions: true
    };
    const flow = app.locals.flow([
        app.locals.shaid.getServices.bind(null, queryObj),
        helper.upsertTypes
    ], {method: "waterfall"});

    flow(function (err) {
        app.locals.log.info("Service type information updated");
        if (next) {
            next(err);
        }
    });
}

module.exports = {
    upsertTypes: upsertTypes
};