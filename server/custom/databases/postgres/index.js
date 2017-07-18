//PostgreSQL Communication Module
const pg = require('pg'); //handles connections to the postgres database
//get configurations from environment variables

let config = {
    max: 10,
    idleTimeoutMillis: 30000
};

//environment-specific information for connecting to the database
if (process.env.NODE_ENV === "staging") {
    config.user = process.env.STAGING_PG_USER;
    config.database = process.env.STAGING_PG_DATABASE;
    config.password = process.env.STAGING_PG_PASSWORD;
    config.host = process.env.STAGING_PG_HOST;
    config.port = process.env.STAGING_PG_PORT;
}
else if (process.env.NODE_ENV === "production") {
    config.user = process.env.PRODUCTION_PG_USER;
    config.database = process.env.PRODUCTION_PG_DATABASE;
    config.password = process.env.PRODUCTION_PG_PASSWORD;
    config.host = process.env.PRODUCTION_PG_HOST;
    config.port = process.env.PRODUCTION_PG_PORT;
}

//create a pool of clients
const pool = new pg.Pool(config);

//the log parameter is the choice logger module that's loaded. info() and error() are available
module.exports = function (log) {
    //listen for errors
    pool.on('error', function (err, client) {
        log.error('idle client error', err.message, err.stack);
    });  

    return {
        //exported functions. these are required to implement
        //callback requires an error parameter and a response parameter
        sqlQuery: function (query, callback) {
            pool.query(query, function (err, res) {
                if (err) {
                    log.error(err);
                }
                callback(err, res);
            });
        }
    }
}