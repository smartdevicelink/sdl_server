Download the project to your current directory.
```
git clone https://github.com/smartdevicelink/sdl_server.git
cd sdl_server
```
The recommended branch to use is master, which should be used by default. Install dependencies.
```
npm install
```

The new version of the Policy Server requires a SQL database. Currently the only supported implementation is PostgreSQL. This guide will not cover how to get one running.

Once you set up a database (locally or remotely) you'll need to supply the Policy Server with some environment variables. This Policy Server uses the [dotenv module](https://www.npmjs.com/package/dotenv), meaning you can write all your environment variables in a `.env` file located in the root directory of the Policy Server. The Policy Server will load the variables at `.env`. `.env` files will not be tracked by Git.

Here are the environment variables that will most likely be used:

* `POLICY_SERVER_HOST`: The hostname or public IP address which the server runs on.
* `POLICY_SERVER_PORT`: The port which the server runs on. It is optional and the default is 3000.
* `POLICY_SERVER_PORT_SSL`: The port which the server should listen for SSL connections on (typically 443). It is optional and the default is `null` (do not listen for SSL connections).
* `SSL_CERTIFICATE_FILENAME`: The filename of the SSL certificate located in `./customizable/ssl`. Required if a value is set for `POLICY_SERVER_PORT_SSL`.
* `SSL_PRIVATE_KEY_FILENAME`: The filename of the SSL certificate's private key located in `./customizable/ssl`. Required if a value is set for `POLICY_SERVER_PORT_SSL`.
* `SHAID_PUBLIC_KEY`: A public key given to you through the [developer portal](https://smartdevicelink.com/) that allows access to SHAID endpoints.
* `SHAID_SECRET_KEY`: A secret key given to you through the [developer portal](https://smartdevicelink.com/) that allows access to SHAID endpoints.
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
* `CACHE_MODULE`: The name of the caching module to use. Currently supports null (no caching, default) or "redis".
* `CACHE_HOST`: The host name or IP address of the cache
* `CACHE_PORT`: The port number of the cache
* `CACHE_PASSWORD`: The password used to log into the cache

Once these environment variables are set, initialize the database. The staging database should be given the same name set in `STAGING_PG_DATABASE`. For the production database, use the name set in `PRODUCTION_PG_DATABASE`.

Using the createdb program that comes with the installation of PostgreSQL, for example:
`createdb policy_server_staging`

The Policy Server comes with migration scripts that can be run using npm scripts. You can see a list of all the possible scripts by looking in `package.json`, but these are the most important ones:

* `start-pg-staging`: Runs the migration up script which initializes data in the database, sets the environment to `staging` and starts the Policy Server
* `start-pg-production`: Runs the migration up script which initializes data in the database, sets the environment to `production` and starts the Policy Server
* `db-migrate-reset-pg-staging`: Runs the migration down script which drops all the data and tables in the staging database
* `dev` or `start`: Starts the server with hot reloading so any changes made to the UI are instantly updated in the browser
* `build`: Generates a new staging/production build using webpack. This command should only be run if you made front-end modifications to the UI.

Run the following command to finalize set up and start the server in staging mode.

`npm run start-pg-staging`

Verify that it started properly by navigating to your configured host and port, or to the default address: <a href="http://localhost:3000/">`http://localhost:3000/`</a>

Now you have a Policy Server running!


* If you wish to enable caching with an unofficially supported datastore, you may create a custom cache module. Do so by creating a folder inside `custom/cache` with the name of your module. Put your implementation in a file named `index.js` inside of your module's folder. Your module should export the following functions:
    * `get(key, callback)`: Receives a value from the cache stored at key.
    * `set(key, value, callback)`: Sets a value in the cache stored at key.
    * `del(key, callback)`: Deletes a value from the cache stored at key.
    * `flushall(callback)`: Deletes all data previously set in the cache.
* Set your `CACHE_` environment variables to correspond with your new datastore solution and access information.
