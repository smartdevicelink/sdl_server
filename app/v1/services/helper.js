const app = require('../app');
const flame = app.locals.flame;
const sql = require('./sql.js');

function upsertTypes (services, next) {
    //convert the data into objects that can be directly stored in the database
    let serviceTypes = [];
    let servicePermissions = [];

    flame.async.map(services, function (service, next) {
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
        next();
    }, function () {
        const upsertServiceTypes = app.locals.db.setupSqlCommands(sql.upsertServiceTypes(serviceTypes));
        const upsertServicePermissions = app.locals.db.setupSqlCommands(sql.upsertServiceTypePermissions(servicePermissions));

        const insertFlow = app.locals.flow([
            app.locals.flow(upsertServiceTypes, {method: 'parallel'}),
            app.locals.flow(upsertServicePermissions, {method: 'parallel'})
        ], {method: 'series'});

        insertFlow(next);
    });

}

module.exports = {
    upsertTypes: upsertTypes
}