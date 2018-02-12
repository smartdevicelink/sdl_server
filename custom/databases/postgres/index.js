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

    const self = {
        //exported functions. these are required to implement
        //this function executes the SQL command in <query> and returns a response using the callback function
        //the callback requires an error parameter and a response from the SQL query
        sqlCommand: function (query, callback) {
            pool.query(query, function (err, res) {
                //always return an array 
                callback(err, (res && res.rows) ? res.rows : []);
            });
        },
        //given a SQL command, sets up a function to execute the query and pass back the results
        setupSqlCommand: function (sqlString, next) {
            self.sqlCommand(sqlString, function (err, res) {
                if (err) {
                    log.error(err);
                    log.error(sqlString);
                }
                next(err, res);
            });            
        },
        setupSqlCommands: function (sqlStringArray, propagateErrors) {
            if (!Array.isArray(sqlStringArray)) { //if its just a single sql statement, make it into an array
                sqlStringArray = [sqlStringArray];
            }
            return sqlStringArray.map(function (str) {
                return function (next) {
                    self.setupSqlCommand.bind(null, str)(function (err, res) {
                        if (err) {
                            log.error(err);
                            log.error(sqlString);
                        }
                        if (propagateErrors) {
                            next(err, res);
                        }
                        else {
                            next(null, res); //do not propagate errors. if an error happens, continue anyway
                        }
                        
                    });
                }
            });            
        }
    }
    return self;
}
