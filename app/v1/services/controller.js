const app = require('../app');
const setupSql = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');
const helper = require('./helper.js');

async function upsertTypes () {
    const queryObj = {
        include_permissions: true
    };

    const services = await app.locals.shaid.getServices(queryObj);
    await helper.upsertTypes(services);
    
    app.locals.log.info("Service type information updated");
}

module.exports = {
    upsertTypes: upsertTypes
};