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

  // Setup and configure the server for use.
  install: function(app, db, config, log) {
    var installer;

    if (config.paths["serverInstallerLib"]) {
      var Installer = require(config.paths.serverInstallerLib);
      installer = new Installer(db, config, log);
    } else {
      return log.e("Invalid path or no path specified for paths.serverInstallerLib in the configuration object.");
    }

    installer.install(function (err, results) {
      if (err) {
        return log.e(err);
      }

      if(results) {
        log.s("Server installed successfully!");
      }
    });
  },

  uninstall: function(app, db, config, log) {
    var installer;

    if (config.paths["serverInstallerLib"]) {
      var Installer = require(config.paths.serverInstallerLib);
      installer = new Installer(db, config, log);
    } else {
      return log.e("Invalid path or no path specified for paths.serverInstallerLib in the configuration object.");
    }

    installer.uninstall(function (err, results) {
      if (err) {
        return log.e(err);
      }

      if(results) {
        log.s("Server uninstalled successfully!");
      }
    });
  },

  start: function(config, next) {
    var installServer = this.install,
        uninstallServer = this.uninstall;

    // Get the arguments from commandline.
    var args = process.argv.slice(2);

    // Perform any additional configuration of the server
    // before it starts loading routes and finishing up.

    app.start(config, function(err, app, db, config, server, fox, io) {
      if(err) {
        return console.log(err);
      }

      // Handle install flag in arguments.
      if(args.indexOf('-i') > -1) {
        installServer(app, db, config, fox.log);
      } else if(args.indexOf('-u') > -1) {
        uninstallServer(app, db, config, fox.log);
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