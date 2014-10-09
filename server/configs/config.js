// ~> Config
// ~A Scott Smereka

/*
 * Configure the server and initialize global variables available
 * to all models and controllers.  Note that each of the settings
 * defined will override its default setting.
 *
 * Fox Documentation:  https://github.com/ssmereka/foxjs/wiki/Config
 */


/* ************************************************** *
 * ******************** Modules & Variables
 * ************************************************** */

var path            = require('path'),                         // Node.js Path module.
    serverDirectory = path.resolve(__dirname, "../");          // Path to the server directory.
    clientDirectory = path.resolve(__dirname, "../../client"); // Path to the client directory.

/* ************************************************** *
 * ******************** Config Constructor
 * ************************************************** */

/**
 * Constructor to initalize the config instance.
 */
var Config = function() {

  // Note: You can define any instance values here.

};


/* ************************************************** *
 * ******************** Default Config Object
 * ************************************************** */

/**
 * Default configuration for the server.  Define default values here 
 * that are not affected by the server enviorment.
 */
Config.prototype.default = {

  // Access tokens are used for API calls made on behalf
  // of a user.  You can override the default behavior here.
  accessTokens: {
    tokenLifeInDays: 10                       // How long a token is valid before a new token must be requested.
  },

  // Place values that should never change here.  For example ENUM values.
  "const": {
    TYPE_SDL: "sdl",                          // TODO: Remove this after removing references to it.
    TYPE_SADL: "sadl"                         // TODO: Remove this after removing references to it.
  },

  // Create, read, update, and delete routes/methods can be automatically
  // generated for each schema model.  This allows you to configure how these
  // routes will behave, authenticate, and other settings.
  crud: {
    enabled: true,                            // Enable or Disable creation of all CRUD methods and routes.

    auth: {                                   // Authentication for each module's routes can be controlled here.
      routeRoleAuth: {                        // Role based authentication
        
        "user": {                             // User schema model specific settings.
          readAll: {                          // Settings for getting a list of all users and their data.
            enabled: true,                    // Authentication is required on this route.
            method: ">=",                     // Allow roles with permissions equal to or greater than the roles specified.
            roles: [ "moderator" ]            // Anyone with a role of Moderator or higher can read all user data.
          },
          read: {                             // Getting a single user object's settings.
            enabled: true,                    // Authentication is required on this route.
            method: ">=",                     // Allow roles with permissions equal to or greater than the roles specified.
            roles: [                          // Specify permission for roles admin and the user themselves to read the single user object.
              "moderator", 
              "self" 
            ]
          },
          update: {                           // Updating a single user object settings.
            enabled: true,                    // Enable authentication for updating a user.
            method: ">=",                     // Allow roles with permissions equal to or greater than the roles specified.
            roles: [ "admin", "self" ]        // Specify permission for admin and the user themselves to update the single user object.
          }
        },
        "userrole": {                         // UserRole schema model specific auth settings.
          read: {                             // Getting a single UserRole object's settings.
            enabled: false                    // Authentication is not required to read a single user role.
          },
          readAll: {                          // Getting all UserRole object's settings.
            enabled: false                    // Authentication is not required to read all user roles.
          }
        },
        "category": {
          readAll: {                          // Getting all category object's settings.
            enabled: false                    // Authentication is not required to read all categories.
          }
        },
        "sdlversion": {
          readAll: {                          // Getting all sdl version object's settings.
            enabled: false                    // Authentication is not required to read all sdl versions.
          }
        }
      } // End routeRoleAuth object.
    } // End auth object.
  },

  // Toggle on/off display of additional log messages.
  debug: false,

  // Server application's root directory.
  dirname: serverDirectory + "/app/",

  // Mongo DB can be used as a datastore.  All settings
  // related to the Mongo database are listed here.
  mongodb: {
    enabled: true,                            // Enable or disable the user of a Mongo datastore.
    
    database: 'sdl',                          // Name of the database in the Mongo datastore.
    host: 'localhost',                        // IP address of the Mongo datastore.
    port: '27017',                            // Port to connect to the Mongo datastore over.
    
    useAuthentication: false,                 // Use authentication when connecting to the Mongo datastore.
    username: "MY_DATABASE_USERNAME",         // Username to use when connecting to the Mongo datastore.  Only used when useAuthentication is true.
    password: "MY_DATABASE_PASSWORD"          // Password to use when connecting to the Mongo datastore.  Only used when useAuthentication is true.
  },

  // Absolute paths to files and folders used by the server.
  paths: {

    // Server application root directory.
    serverAppFolder: serverDirectory + "/app/",

    // Server configuration folder, where all the config files are stored.
    serverConfigFolder: serverDirectory + "/configs/",

		// Server data folder, where install data is located.
		serverDataFolder: serverDirectory + "/data/",

    // Server node_modules folder, where all the dependencies are stored.
    serverNodeModulesFolder: path.resolve(__dirname, "../node_modules") + "/",

    // Client's root directory.
    clientDirectory: clientDirectory,

    // Client img folder, where client images are stored.
    clientAssetsImgFolder: clientDirectory +"/assets/img/",

    // Client folder where public images are uploaded.
    clientAssetsImgUploadsFolder: clientDirectory + '/assets/img/uploads/',

    // Path to the default icon for new applications on the client.
    clientDefaultApplicationIcon: '/assets/img/sdl-logo-without-text-icon.png',

    // A static folder's content is made available in routes similar to browsing
    // the folder on your computer.  Everything in the static folders is made
    // public to everyone.
    //
    // Example:  If you want to make all files available in the "assets" folder, then
		//           staticFolders property should look like this:
    //
    //   staticFolders: {
    //     assets: {
    //       path: path.normalize('/assets/')
    //     }
    //   }
    //
    // and the url would look like this:  /assets/myFileName.blah
    //
    staticFolders: {

      // Add static folders here.
    }

  },

  // Configure the backend API server.
  server: {
    debug: false,                             // Enable or disable additional logging and features used to debug the server.
    host: 'localhost',                        // IP address of the server
    port: '3000',                             // Port for the node application.
    protocol: 'http'                          // Default protocol to use, http or https.
  },

  // The routes array determines the order in which models and controllers are 
  // required and therefore executed.  All models and static routes are loaded
  // automatically for you so you should not list them here.
  // 
  // Example:  A routes array that loads all controllers and then error handlers.
  //    
  //   routes:  [ "controller", "error" ]
  //
  routes: [
    "crud-auth",                              // Authentication methods for all CRUD routes.
    "crud-queries",                           // Query for schema object(s) on CRUD routes.
    "crud-methods",                           // Set response and perform CRUD methods on all CRUD routes.
    "controller",                             // Load all non-static controllers.
    "response",                               // Handle returning non-error respones to a requestor.
    "error",                                  // Error handler(s) to send errors and catch any unhandled requests (aka 404).
    "tracker"                                 // Handle tracking requests and responses.
  ],

  // Web sockets can be used to communicate with the backend server.
  // Socket.io is the framework used, these are settings related to
  // Socket.io and web sockets in general.
  socketio: {
    enabled: false                            // Disable socket.io
  },

  // Foxjs system settings, these affect foxjs internal libraries.
  system: {
    debug: false,                             // Flag to enable display of debug messages by the fox module.
    trace: false                              // Flag to enable display of trace log messages by the fox module.
  },

  // The tracker stores information about a request and response exchange between
  // a client and the server.  This data is tracked for each request and can be
  // configured using this object.
  tracker: {

    // URL endpoints added to this list will not be tracked, even if they are
    // included in the whitelist.
    blacklist: [{
      url: "/messages/query/natural.:format"
    }],

    // When this list is empty, all endpoints will be tracked with exception to the blacklisted 
    // URLs.  If one or more URL endpoints are added to this list, then only those endpoints 
    // will be tracked.  Except for endpoints added to the blacklist, those are never tracked.
    whitelist: [{
      //url: ""
    }]
  }

};

/**
 * Config properties in this object will be include when
 * the server is running in the test environment mode.
 * Properties in this object will override properties in
 * the configuration object.
 */
Config.prototype.test = {
	
  // Mongo DB can be used as a datastore.  All settings
	// related to the Mongo database are listed here.
	mongodb: {
		database: 'sdl_test'                      // Name of the database in the Mongo datastore.
	}

};

/**
 * Config properties in this object will be include when
 * the server is running in the local environment mode.
 * Properties in this object will override properties in
 * the configuration object.
 */
Config.prototype.local = {
  
  // Mongo DB can be used as a datastore.  All settings
  // related to the Mongo database are listed here.
  mongodb: {
    database: 'sdl_local'                     // Name of the database in the Mongo datastore.
  }

};

/**
 * Config properties in this object will be include when
 * the server is running in the development enviorment mode.
 * Properties in this object will override properties in
 * the default configuration object.
 */
Config.prototype.development = {

  // Mongo DB can be used as a datastore.  All settings
  // related to the Mongo database are listed here.
  mongodb: {   
    database: 'sdl_dev',                      // Name of the database in the Mongo datastore.
    host: 'localhost',                        // IP address of the Mongo datastore.
    port: '27017',                            // Port to connect to the Mongo datastore over.
    
    useAuthentication: true,                  // Use authentication when connecting to the Mongo datastore.
    username: "MY_DATABASE_USERNAME",         // Username to use when connecting to the Mongo datastore.  Only used when useAuthentication is true.
    password: "MY_DATABASE_PASSWORD"          // Password to use when connecting to the Mongo datastore.  Only used when useAuthentication is true.
  },

  // Configure the backend API server.
  server: {
    debug: false,                             // Enable or disable additional logging and features used to debug the server.
    host: 'localhost',                        // IP address of the server
    port: '3000',                             // Port for the node application.
    protocol: 'http'                          // Default protocol to use, http or https.
  }

};

/**
 * Config properties in this object will be include when
 * the server is running in the production enviorment mode.
 * Properties in this object will override properties in
 * the default configuration object.
 */
Config.prototype.production = {

  // Mongo DB can be used as a datastore.  All settings
  // related to the Mongo database are listed here.
  mongodb: {   
    database: 'sdl_dev',                      // Name of the database in the Mongo datastore.
    host: 'localhost',                        // IP address of the Mongo datastore.
    port: '27017',                            // Port to connect to the Mongo datastore over.
    
    useAuthentication: true,                  // Use authentication when connecting to the Mongo datastore.
    username: "MY_DATABASE_USERNAME",         // Username to use when connecting to the Mongo datastore.  Only used when useAuthentication is true.
    password: "MY_DATABASE_PASSWORD"          // Password to use when connecting to the Mongo datastore.  Only used when useAuthentication is true.
  },

  // Configure the backend API server.
  server: {
    debug: false,                             // Enable or disable additional logging and features used to debug the server.
    host: 'localhost',                        // IP address of the server
    port: '3000',                             // Port for the node application.
    protocol: 'http'                          // Default protocol to use, http or https.
  }

};


/* ************************************************** *
 * ******************** Expose the Config Object
 * ************************************************** */

module.exports = Config;