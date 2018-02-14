//PostgreSQL Communication Module
const pg = require('pg'); //handles connections to the postgres database
const ASYNC = require('async');
//get configurations from environment variables

// extend the Postgres client to easily fetch a single expected result as an object
pg.Client.prototype.getOne = pg.Pool.prototype.getOne = function (query, values, callback) {
    this.query(query, values, function(err, result) {
        callback(err, result && Array.isArray(result.rows) && result.rows.length ? result.rows[0] : null);
    });
};

// extend the Postgres client to easily fetch multiple expected results as an array
pg.Client.prototype.getMany = pg.Pool.prototype.getMany = function (query, values, callback) {
    this.query(query, values, function(err, result){
        callback(err, (result && result.rows) ? result.rows : []);
    });
};

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
        },
        getClient: function (callback){
            // reserve a client connection ("client") and its associated release callback ("done")
            // callback(err, client, done)
            pool.connect(callback);
        },
        rollback: function (client, done){
            // rolls back and releases a client from the pool
            client.query("ROLLBACK", function(err){
                done(err);
            });
        },
        commit: function (client, done, callback){
            // commits and releases a client from the pool
            client.query("COMMIT", function(err, result){
                done(err);
                callback(err, result);
            });
        },
        runQueriesAsTransaction: function (queries, callback){
            var dbClient = null,
                dbDone = null;
            ASYNC.waterfall([
                function (callback) {
                    // get a new client
                    self.getClient(callback);
                },
                function (client, done, callback) {
                    dbClient = client;
                    dbDone = done;
                    // start a transaction
                    client.query("BEGIN", function(err){
                        if(err) self.rollback(client, done);
                        callback(err, client, done);
                    });
                },
                function (client, done, callback){
                    // run queries in order provided
                    ASYNC.eachSeries(queries, function (query, callback) {
                        client.query(query, function (err, result) {
                            if(err) self.rollback(client, done);
                            callback(err);
                        });
                    }, function (err) {
                        callback(err, client, done);
                    });
                },
                function (client, done, callback) {
                    // end transaction
                    self.commit(client, done, callback);
                }
            ], function (err, result) {
                callback(err, result);
            });
        }
    }
    return self;
}
