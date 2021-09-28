const app = require('../app');
const flame = app.locals.flame;
const sql = require('./sql.js');

async function upsertTypes (services) {
    //convert the data into objects that can be directly stored in the database
    let serviceTypes = [];
    let servicePermissions = [];

    for (const service of services) {
        serviceTypes.push({
            "name": service.name,
            "display_name": service.display_name
        });
        if (service.permissions.length > 0) {
            for (let j = 0; j < service.permissions.length; j++) {
                servicePermissions.push({ //add permission relation
                    "service_type_name": service.name,
                    "permission_name": service.permissions[j].key
                });
            }
        }
    }

    await app.locals.db.asyncSqls(sql.upsertServiceTypes(serviceTypes));
    await app.locals.db.asyncSqls(sql.upsertServiceTypePermissions(servicePermissions));
}

module.exports = {
    upsertTypes: upsertTypes
}