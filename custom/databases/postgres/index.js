//PostgreSQL Communication Module
const pg = require('pg'); //handles connections to the postgres database
const async = require('async');
const sqlBrick = require('sql-bricks-postgres');
const promisify = require('util').promisify;
const config = require('../../../settings.js');
//get configurations from environment variables

// extend the Postgres client to easily fetch a single expected result as an object
pg.Client.prototype.getOne = pg.Pool.prototype.getOne = async function (query) {
    if (typeof query !== "string") {
        query = query.toString();
    }
    return new Promise((resolve, reject) => {
        this.query(query, function (err, result) {
            if (err) {
                return reject(err);
            }
            resolve(result && Array.isArray(result.rows) && result.rows.length ? result.rows[0] : null);
        });
    });
};

// extend the Postgres client to easily fetch multiple expected results as an array
pg.Client.prototype.getMany = pg.Pool.prototype.getMany = async function (query) {
    if (typeof query !== "string") {
        query = query.toString();
    }
    return new Promise((resolve, reject) => {
        this.query(query, function (err, result) {
            if (err) {
                return reject(err);
            }
            resolve((result && result.rows) ? result.rows : []);
        });
    });
};

let dbParameters = {
    max: 10,
    idleTimeoutMillis: 30000
};

//environment-specific information for connecting to the database
if (process.env.NODE_ENV === "staging") {
    dbParameters.user = process.env.STAGING_PG_USER || config.dbUser;
    dbParameters.database = process.env.STAGING_PG_DATABASE || config.dbDatabase;
    dbParameters.password = process.env.STAGING_PG_PASSWORD || config.dbPassword;
    dbParameters.host = process.env.STAGING_PG_HOST || config.dbHost;
    dbParameters.port = process.env.STAGING_PG_PORT || config.dbPort;
}
else if (process.env.NODE_ENV === "production") {
    dbParameters.user = process.env.PRODUCTION_PG_USER || config.dbUser;
    dbParameters.database = process.env.PRODUCTION_PG_DATABASE || config.dbDatabase;
    dbParameters.password = process.env.PRODUCTION_PG_PASSWORD || config.dbPassword;
    dbParameters.host = process.env.PRODUCTION_PG_HOST || config.dbHost;
    dbParameters.port = process.env.PRODUCTION_PG_PORT || config.dbPort;
}
else if (process.env.NODE_ENV === 'test') {
    dbParameters.user = process.env.TEST_PG_USER;
    dbParameters.database = process.env.TEST_PG_DATABASE;
    dbParameters.password = process.env.TEST_PG_PASSWORD;
    dbParameters.host = process.env.TEST_PG_HOST;
    dbParameters.port = process.env.TEST_PG_PORT;
} else {
    dbParameters.user = config.dbUser;
    dbParameters.database = config.dbDatabase;
    dbParameters.password = config.dbPassword;
    dbParameters.host = config.dbHost;
    dbParameters.port = config.dbPort;
}

//create a pool of clients
const pool = new pg.Pool(dbParameters);

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
        asyncSql: async function (query) {
            if (typeof query !== "string") {
                query = query.toString();
            }
            return new Promise((resolve, reject) => {
                pool.query(query, function (err, res) {
                    if (err) {
                        log.error(err);
                        log.error(query);
                        return reject(err);
                    }
                    //always return an array
                    resolve((res && res.rows) ? res.rows : []);
                });
            });
        },
        asyncSqls: async function (sqlStringArray, propagateErrors) {
            if (!Array.isArray(sqlStringArray)) { //if its just a single sql statement, make it into an array
                sqlStringArray = [sqlStringArray];
            }
            const promiseMethod = propagateErrors ? 'all' : 'allSettled';
            return Promise[promiseMethod](sqlStringArray.map(sql => self.asyncSql(sql)));
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
        asyncTransaction: async function (logic) {
            let client;
            let done;
            return new Promise(resolve => {
                self.getClient((err, thisClient, thisDone) => {
                    client = thisClient;
                    done = thisDone;
                    self.begin(client, resolve); // start transaction
                });
            }).then(() => {
                // pass the client back to the requester logic (Promise)
                return logic(client);
            }).then(result => {
                // requester has finished their logic. commit the db changes
                return new Promise(resolve => {
                    self.commit(client, done, err => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(result);
                    });
                });
            }).catch(err => {
                // error
                self.rollback(client, done);
            });   
        }
    }
    return self;
}
