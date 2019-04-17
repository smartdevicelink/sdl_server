//a repository of all the SQL statements
const sql = require('sql-bricks-postgres');

function upsertServiceTypes (services) {
    return services.map(function (service) {
        return sql.insert("service_types", service)
            .onConflict().onConstraint('service_type_pk').doUpdate().toString();
    });
}

function upsertServiceTypePermissions (servicePermissions) {
    return servicePermissions.map(function (servicePermission) {
        return sql.insert("service_type_permissions", servicePermission)
            .onConflict().onConstraint('service_type_permission_pk').doUpdate().toString();
    });
}


module.exports = {
    upsertServiceTypes: upsertServiceTypes,
    upsertServiceTypePermissions: upsertServiceTypePermissions
}
