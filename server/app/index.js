// ~> Server
// ~A Scott Smereka

/*
 * Create, configure, and start the server.
 */

var app    = require("foxjs"),
    path   = require("path");

// Configuration file.
var Config = require(path.resolve(__dirname, "../configs/config.js"));  
    
// Contains predefined methods used to manage the server instance.
var server = {
  start: function(config, next) {

    // Perform any additional configuration of the server
    // before it starts loading routes and finishing up.

    app.start(config, function() {

      // Get the arguments from commandline.
      var args = process.argv.slice(2);

      // Handle Install Flag
      if(args.indexOf('-i') > -1) {
        console.log("Install server.");
      }

    });
  },

  stop: function(config, next) {

    // Perform any additional tasks before the server
    // is shutdown.  Make them quick you only have 
    // 4 seconds for this entire method to finish.

    // Gracefully shutdown the server. 
    app.stop(next);
  }
};

// Handle messages sent to the server, such as start, stop, restart, etc.
app.message.handler(server);

// Start the server using the config.
server.start(new Config());