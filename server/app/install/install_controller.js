// ~> Controller
// ~A Scott Smereka

/* Install Controller
 * Setup the server and database for use.
 *
 * Installation includes loading admin users,
 * user roles, or anything else required to setup
 * the server for use via the front-end GUI.
 */

module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Module Variables
   * ************************************************** */

  var async       = require('async'),      // Async library for processing methods in serial or parallel.
      fs					= require('fs'),         // File system library for working with files.
			path        = require('path');       // Path library for working with file/folder paths.

  var fox         = require("foxjs"),      // Fox library
      sender      = fox.send,              // Fox methods for sending responses to requests.
      log         = fox.log,               // Fox methods for logging error and debug information.
      auth        = fox.authentication,    // Fox methods for controlling access to routes and data.
      accessToken = fox.accessToken;       // Fox methods for authorizing users based on access tokens.

  var superAdminRole = auth.queryRoleByName("superadmin"),  // Find the Admin role object.
      installKeys    = [ config.installKey ];               // List of keys allowed to perform the install action.

  var allowSuperAdmin = [                     // Authenticate a call allowing only the super admin or higher roles.
    accessToken.allow,											  // Allow access tokens to be used for authentication.
    auth.allowRolesOrHigher([superAdminRole]) // Allow super admin roles or higher.
  ];

  // Load the installer module.
  var installer;
  if(config.paths["serverInstallerLib"]) {
    var Installer = require(config.paths.serverInstallerLib);
    installer = new Installer(db, config, log);
  } else {
    return log.e("Invalid path or no path specified for paths.serverInstallerLib in the configuration object.");
  }

  /* ************************************************** *
   * ******************** Routes
   * ************************************************** */

  /**
   * Install the server & server's database components.
   * Access is limited to a one time call with the install key.
   */
  app.post('/install.:format', auth.allowKeysOnce(installKeys), install);

  /**
   * Undo the server install and remove any database components
	 * added during install.
	 * Access is limited to the super admin role or higher.
   */
  app.post('/uninstall.:format', allowSuperAdmin, uninstall);

  /**
   * Purge all data in all database collections altered by
   * the install.
	 * Access is limited to the super admin role or higher.
   */
  app.post('/purge.:format', allowSuperAdmin, purgeInstall);

	/**
	 * Install example data into the database for demoing
	 * how the server works.
	 * Access is limited to the super admin role or higher.
	 */
  app.post('/installDemo.:format', allowSuperAdmin, installDemo);

	/**
	 * Uninstall example data by removing it from the database.
	 * Access is limited to the super admin role or higher.
	 */
  app.post('/uninstallDemo.:format', allowSuperAdmin, uninstallDemo);

	/**
	 * Purge all data in all database collections altered by
	 * the demo install.
	 * Access is limited to the super admin role or higher.
	 */
	app.post('/purgeDemo.:format', allowSuperAdmin, purgeDemoInstall);

	/**
	 * Purge all data in the database.
	 * Access is limited to the super admin role or higher.
	 */
	app.post('/purgeAll.:format', allowSuperAdmin, purgeAll);


  // TODO: Delete after unit tests are created.
  if(config.server.debug) {
    app.get('/install.:format', install);
    app.get('/uninstall.:format', uninstall);
    app.get('/purge.:format', purgeInstall);
    app.get('/installDemo.:format', installDemo);
    app.get('/uninstallDemo.:format', uninstallDemo);
    app.get('/purgeDemo.:format', purgeDemoInstall);
    app.get('/purgeAll.:format', purgeAll);
  }


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  function install(req, res, next) {
    installer.install(function(err, results) {
      if(err) {
        next(err);
      } else {
        sender.setResponse(results, req, res, next);
      }
    });
  }

  function uninstall(req, res, next) {
    installer.uninstall(function(err, results) {
      if(err) {
        next(err);
      } else {
        sender.setResponse(results, req, res, next);
      }
    });
  }

  function purgeInstall(req, res, next) {
    installer.purgeInstall(function(err, results) {
      if(err) {
        next(err);
      } else {
        sender.setResponse(results, req, res, next);
      }
    });
  }

  function installDemo(req, res, next) {
    installer.installDemo(function(err, results) {
      if(err) {
        next(err);
      } else {
        sender.setResponse(results, req, res, next);
      }
    });
  }

  function uninstallDemo(req, res, next) {
    installer.uninstallDemo(function(err, results) {
      if(err) {
        next(err);
      } else {
        sender.setResponse(results, req, res, next);
      }
    });
  }

  function purgeDemoInstall(req, res, next) {
    installer.purgeDemoInstall(function(err, results) {
      if(err) {
        next(err);
      } else {
        sender.setResponse(results, req, res, next);
      }
    });
  }

  function purgeAll(req, res, next) {
    installer.purgeAll(function(err, results) {
      if(err) {
        next(err);
      } else {
        sender.setResponse(results, req, res, next);
      }
    });
  }

};
