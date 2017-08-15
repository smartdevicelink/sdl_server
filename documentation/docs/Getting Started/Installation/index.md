Download the project to your current directory.
```
git clone https://github.com/smartdevicelink/sdl_server.git
cd sdl_server
```
The most up-to-date branch is v2. Switch to it.
```
git checkout v2
```

The new version of the policy server requires a SQL database. Currently the only supported implementation is PostgreSQL, but [[you can create a module for your favorite database.|Custom Modules]] This guide will not cover how to get one running.

Once you set up a database (locally or remotely) you'll need to supply the policy server with some environment variables. This policy server uses the [[dotenv module|https://www.npmjs.com/package/dotenv]], meaning you can write all your environment variables in a `.env` file located in the `server` directory. The policy server will load the variables at `server/.env`. `.env` files will not be tracked by Git.

Here are the environment variables that will most likely be used:

* `POLICY_SERVER_PORT`: The port which the server runs on. It is optional and the default is 3000.
* `SHAID_PUBLIC_KEY`: A public key given to you through the [[developer portal|https://smartdevicelink.com/]] that allows access to SHAID endpoints.
* `SHAID_SECRET_KEY`: A secret key given to you through the [[developer portal|https://smartdevicelink.com/]] that allows access to SHAID endpoints.
* `STAGING_PG_USER`: The name of the user to allow the server access the database (staging mode)
* `STAGING_PG_DATABASE`: The name of the database where policy and app data is stored (staging mode)
* `STAGING_PG_PASSWORD`: The password used to log into the database (staging mode)
* `STAGING_PG_HOST`: The host name or IP address of the database (staging mode)
* `STAGING_PG_PORT`: The port number of the database (staging mode)
* `PRODUCTION_PG_USER`: The name of the user to allow the server access the database (production mode)
* `PRODUCTION_PG_DATABASE`: The name of the database where policy and app data is stored (production mode)
* `PRODUCTION_PG_PASSWORD`: The password used to log into the database (production mode)
* `PRODUCTION_PG_HOST`: The host name or IP address of the database (production mode)
* `PRODUCTION_PG_PORT`: The port number of the database (production mode)

Once these environment variables are set, initialize the database. The staging database should be given the same name set in STAGING_PG_DATABASE. For the production database, use the name set in PRODUCTION_PG_DATABASE

Using the createdb program that comes with the installation of PostgreSQL, for example:
`createdb policy_server_staging`

The policy server comes with migration scripts that can be run using npm scripts. You can see a list of all the possible scripts by looking in `server/package.json`, but these are the most important ones:

* `start-pg-staging`: Runs the migration up script which initializes data in the database, sets the environment to `staging` and starts the policy server
* `start-pg-production`: Runs the migration up script which initializes data in the database, sets the environment to `production` and starts the policy server
* `db-migrate-reset-pg-staging`: Runs the migration down script which drops all the data and tables in the staging database

Run the following command to finalize set up and start the server in staging mode.

`npm run-script start-pg-staging`

Now you have a server running!
