/**
 * The configuration object stores default settings
 * used to govern how the application will run.
 * Existing settings can overridden or additional
 * settings can be added when running the application
 * in different environment modes using the other files
 * located in the config folder.
 */


/* ************************************************** *
 * ******************** Global Variables
 * ************************************************** */

var bunyan = require('bunyan'),
    PrettyStream = require('bunyan-pretty-stream'),
    os = require('os'),
    path = require('path');


/* ************************************************** *
 * ******************** Configuration Object
 * ************************************************** */

var Config = function() {

  // Crave is a module used to find and require files dynamically:  https://github.com/ssmereka/crave
  this.crave = {
    cache: {                    // Crave can store the list of files to load rather than create it each time.
      enable: false             // Disable caching of the list of files to load.  In a production environment, this should be enabled.
    },
    identification: {           // Variables related to how to find and require files are stored here.
      type: "filename",         // Determines how to find files.  Available options are: 'string', 'filename'
      identifier: "_"           // Determines how to identify the files.
    }
  };

  // Configure the Express framework:  http://expressjs.com/
  this.express = {
    static : {
      maxAge: 0                 // Set the max-age property for Cache-Control header (in ms). In a production environment, this needs to greater than zero to leverage browser caching.
    }
  };

  // Configure the bunyan logger to display console logs:  https://github.com/trentm/node-bunyan
  this.log = {
    name: undefined,                    // Leave the name undefined and this config will use the server's name instead.
    serializers: bunyan.stdSerializers,
    streams: [
      {                                 // Stream to print to the console.
        level: 'trace',                 // Define the log level:  https://github.com/trentm/node-bunyan#levels
        stream: new PrettyStream()      // Print the console logs in a human readable format:  https://github.com/CMaylone/bunyan-pretty-stream
      }
    ]
  };

  // Resolves to the path of the application's root directory.
  this.rootDirectory = path.resolve(__dirname, "../");

  // Settings for the Node server.
  this.server = {
    debug: false,               // Indicates the server is in debug mode and may perform actions to assist the developer.
    ip: undefined,              // Server's IP address or domain name.  If left as undefined this config module will attempt to find the internal IP address.
    name: "sdl_server",         // Name of the server
    port: 3000,                 // Port the server will be listening on.
    protocol: 'http'            // Default protocol used to communicate with the server.
  };

  // Configure express session options.
  this.session = {
    cookie: {
      maxAge: 604800000,        // 1 week (in ms)
      ttl:    7776000,          // 3 months (in seconds)
      secure: false             // Should be true in a production environment when secured behind NGINX and over HTTPS
    },
    name: 'sdl_server.sid',     // Name of the server in the express session.
    proxy: false,               // Should be true in a production environment when secured behind NGINX and over HTTPS
    resave: true,
    saveUninitialized: true,
    secret: 'You will arrive at the gates of Valhalla, shiny and chrome!'
  };


  /* ************************************************** *
   * ******************** Additional Configurations
   * ************************************************** */

  // If the server's IP address is not defined, attempt to find it.
  if( ! this.server.ip) {
    this.server.ip = getInternalIpAddress();
  }

  // Set the server's URL parameter, based on the previously configured settings.
  this.server.url = (this.server.port == 80) ? this.server.protocol + "://" + this.server.ip : this.server.protocol + "://" + this.server.ip + ":" + this.server.port;

  // Path to the local directories.
  this.libsDirectory = path.normalize(this.rootDirectory+'/libs/');
  this.dataDirectory = path.normalize(this.rootDirectory+'/data/');
  this.policiesDirectory = path.normalize(this.dataDirectory+'/policies/');
  this.clientDirectory = path.normalize(this.rootDirectory+'/client/');

  // If the logger's name is not set, then set it to the server's name.
  if( ! this.log.name) {
    this.log.name = this.server.name;
  }

};

/**
 * Get the internal IP address of the machine running
 * this application.
 * @returns {string} the IP address or localhost if
 * an address was not found.
 */
function getInternalIpAddress() {
  var networkInterfaces = os.networkInterfaces();

  if(networkInterfaces) {
    for(var interfaceName in networkInterfaces) {
      if(networkInterfaces.hasOwnProperty(interfaceName)) {
        switch(interfaceName) {
          case 'eth0':
          case 'en0':
            for(var i = networkInterfaces[interfaceName].length - 1; i >= 0; --i) {
              if(!networkInterfaces[interfaceName][i].internal && 'IPv4' === networkInterfaces[interfaceName][i].family) {
                return networkInterfaces[interfaceName][i].address;
              }
            }
            break;
          default:
            break;
        }
      }
    }
  }

  return "localhost";
}


/* ************************************************** *
 * ******************** Public API
 * ************************************************** */

exports = module.exports = new Config();
exports = Config;