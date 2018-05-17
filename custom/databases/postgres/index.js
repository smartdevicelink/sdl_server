//PostgreSQL Communication Module
const pg = require('pg'); //handles connections to the postgres database
const async = require('async');
const sqlBrick = require('sql-bricks-postgres');
//get configurations from environment variables

// extend the Postgres client to easily fetch a single expected result as an object
pg.Client.prototype.getOne = pg.Pool.prototype.getOne = function(query, callback){
    if (typeof query !== "string") {
        query = query.toString();
    }
    this.query(query, function(err, result) {
        callback(err, result && Array.isArray(result.rows) && result.rows.length ? result.rows[0] : null);
    });
};

// extend the Postgres client to easily fetch multiple expected results as an array
pg.Client.prototype.getMany = pg.Pool.prototype.getMany = function(query, callback){
    if (typeof query !== "string") {
        query = query.toString();
    }
    this.query(query, function(err, result) {
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
else if (process.env.NODE_ENV === 'test') {
    config.user = process.env.TEST_PG_USER;
    config.database = process.env.TEST_PG_DATABASE;
    config.password = process.env.TEST_PG_PASSWORD;
    config.host = process.env.TEST_PG_HOST;
    config.port = process.env.TEST_PG_PORT;
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
        getOne(query, params, callback){
            pool.getOne(query, params, callback);
        },
        getMany(query, params, callback){
            pool.getMany(query, params, callback);
        },
        //exported functions. these are required to implement
        //this function executes the SQL command in <query> and returns a response using the callback function
        //the callback requires an error parameter and a response from the SQL query
        sqlCommand: function (query, callback) {
            if (typeof query !== "string") {
                query = query.toString();
            }
            pool.query(query, function (err, res) {
                if (err) {
                    log.error(err);
                    log.error(query);
                }
                //always return an array
                callback(err, (res && res.rows) ? res.rows : []);
            });
        },
        //TODO: remove these two functions
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
        begin: function (client, callback){
            // begin a SQL transaction
            // callback(err);
            client.query("BEGIN", function(err){
                callback(err);
            });
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
        runAsTransaction: function(logic, callback){
            let wf = {};
            async.waterfall([
                function(callback){
                    // fetch a SQL client
                    self.getClient(callback);
                },
                function(client, done, callback){
                    // start the transaction
                    wf.client = client;
                    wf.done = done;
                    self.begin(client, callback);
                },
                function(callback){
                    // pass the client back to the requester logic
                    logic(wf.client, function(err, result){
                        callback(err, result);
                    });
                },
                function(result, callback){
                    // requester has finished their logic, commit the db changes
                    self.commit(wf.client, wf.done, function(err){
                        callback(err, result);
                    });
                }
            ], function(err, result){
                if(err){
                    self.rollback(wf.client, wf.done);
                }
                callback(err, result);
            });
        }
    }
    return self;
}
