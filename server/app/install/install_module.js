// ~A Scott Smereka

/* Install Module
 * Setup the server and database for use.
 *
 * Installation includes loading admin users,
 * user roles, or anything else required to setup
 * the server for use via the front-end GUI.
 */


/* ************************************************** *
 * ******************** Global Variables
 * ************************************************** */

var async       = require('async'),     // Async library for processing methods in serial or parallel.
    fs					= require('fs'),        // File system library for working with files.
    path        = require('path');      // Path library for working with file/folder paths.


/* ************************************************** *
 * ******************** Constructor
 * ************************************************** */

/**
 * Constructor for each installer instance.  Sets up
 * the class variables based on the parameters you pass in.
 * Prints error messages if the parameters needed are not there.
 * @param _db is the mongoose database object.
 * @param _config is the server's config object.
 * @param _log is an instance of the logging object.
 */
var Installer = function(_db, _config, _log) {
  if( ! _log) {
    _log = {
      i: function(msg) { console.log(msg); },
      e: function(msg) { console.log(msg); }
    };
  }

  if( ! _config) {
    return _log.e("Installer requires the 'config' parameter.");
  }

  if( ! _db) {
    return _log.e("Installer requires the 'db' parameter.");
  }

  this.debug = (_config.server && _config.server.debug !== undefined) ? _config.server.debug : false;
  this.db = _db;
  this.config = _config;
  this.log = _log;
};


/* ************************************************** *
 * ******************** Public Methods
 * ************************************************** */

/**
 * Check if the server's database has already been initialized
 * with data on a previous server install.
 * @param db is the mongoose database object.
 * @param cb is a callback method where the results or errors are returned.
 */
var isInstalled = function(db, cb) {
  db.model("ServerEvent").findOne({ "what": "install"}).exec(function(err, event) {
    if(err) {
      return cb(err);
    }

    cb(undefined, (event));
  });
};

/**
 * Save an install event to the server's current database.  This should be
 * called after a successful install.
 * @param db is the mongoose database object.
 * @param cb is a callback method where the results or errors are returned.
 */
var saveInstallEvent = function(db, cb) {
  var Event = db.model("ServerEvent");
  var event = new Event({
    "what":"install"
  });

  event.save(cb);
};

/**
 * Remove all install events from the server's current database.  This should
 * be called after a successful uninstall.
 * @param db is the mongoose database object.
 * @param cb is a callback method where the results or errors are returned.
 */
var removeInstallEvents = function(db, cb) {
  cb = (cb) ? cb : function(err) { if(err) { console.log(err); } };

  db.model("ServerEvent").find().exec(function(err, events) {
    if(err) {
      return cb(err);
    }

    if(events) {
      for (var i = events.length-1; i >= 0; --i) {
        events[i].remove();
      }
    }

    cb(undefined, "Removed all saved install events.");
  });
};

/**
 * Setup the server to run by adding any initalization
 * data to the data store, creating files or folder, and/or
 * performing any other setup steps required.
 * @param {function} cb is a callback method where results or errors are returned.
 */
var install = function(cb) {
  var db = this.db;
  var config = this.config;
  var log = this.log;
  var saveInstallEvent = this.saveInstallEvent;

  this.isInstalled(db, function(err, isServerInstalled) {
    if (err) {
      return cb(err);
    }

    if (isServerInstalled) {
      return cb();
    }

    async.series([
      createDirectories(config, [config.paths.clientAssetsImgUploadsFolder], log),
      updateLanguages(db, config, log),
      updateCountries(db, config, log),
      installData(db, config, "AndroidCategory", "name", undefined, undefined, log),
      installData(db, config, "IosCategory", "name", undefined, undefined, log),
      installData(db, config, "SdlVersion", "version", undefined, undefined, log),
      installData(db, config, "UserRole", "name", undefined, undefined, log),
      installData(db, config, "User", "name", undefined, { "password": config.installKey, "securityAnswer": config.installKey }, log),
      generateAccessTokens(db, config, log),
      installData(db, config, "Category", "name", undefined, undefined, log),
      installData(db, config, "HmiLevel", "name", undefined, undefined, log),
      installData(db, config, "Language", "language", "languages.js", undefined, log),
      installData(db, config, "Country", "country", "countries.js", undefined, log)
    ], function(err, results) {
      cb(err, results);

      if( ! err) {
        saveInstallEvent(db);
      }
    });
  });
};

/**
 * Uninstall the server by removing all data added during install and undoing
 * all changes made during install.  This will not delete all data from the
 * database, use the purge method for that type of operation.
 * @param {function} cb is a callback method where results or errors are returned.
 */
var uninstall = function(cb) {
  var db = this.db;
  var config = this.config;
  var log = this.log;
  var removeInstallEvents = this.removeInstallEvents;

  this.isInstalled(db, function(err, isServerInstalled) {
    if (err) {
      return cb(err);
    }

    if ( ! isServerInstalled) {
      return cb();
    }

    async.series([
      uninstallData(db, config, "AndroidCategory", "name", undefined, log),
      uninstallData(db, config, "IosCategory", "name", undefined, log),
      uninstallData(db, config, "SdlVersion", "version", undefined, log),
      uninstallData(db, config, "UserRole", "name", undefined, log),
      removeAccessTokens(db, config, log),
      uninstallData(db, config, "User", "name", undefined, log),
      uninstallData(db, config, "Category", "name", undefined, log),
      uninstallData(db, config, "HmiLevel", "name", undefined, log),
      uninstallData(db, config, "Language", "language", "languages.js", log),
      uninstallData(db, config, "Country", "country", "countries.js", log)
    ], function (err, results) {
      cb(err, results);

      if (!err) {
        removeInstallEvents(db);
      }
    });
  });
};

/**
 * Remove all data in the collections altered by the install process.
 * @param {function} cb is a callback method where results or errors are returned.
 */
var purgeInstall = function(cb) {
  var db = this.db;
  var config = this.config;
  var log = this.log;

  async.series([
    dropCollectionByName(db, config, "userroles", log),
    dropCollectionByName(db, config, "accesstokens", log),
    dropCollectionByName(db, config, "users", log),
    dropCollectionByName(db, config, "categories", log),
    dropCollectionByName(db, config, "languages", log),
    dropCollectionByName(db, config, "countries", log),
    dropCollectionByName(db, config, "fadingkeys", log)
  ], cb);
};

/**
 * Remove all data in the database.
 * @param {function} cb is a callback method where results or errors are returned.
 */
var purgeAll = function(cb) {
  dropAllCollections(this.db, this.config, cb, this.log);
};

/**
 * Install example data used to demo the auth server.
 * @param {function} cb is a callback method where results or errors are returned.
 */
var installDemo = function(cb) {
  var db = this.db;
  var config = this.config;
  var log = this.log;

  async.series([
    installCfmDemo(db, config, log),
    installData(db, config, "User", "name", "demo/users.js", { "password" : this.config.installKey, "securityAnswer": this.config.installKey }, log),
    installData(db, config, "Application", "name", "demo/applications.js", undefined, log),
    installData(db, config, "FunctionalGroup", "name", "demo/functionalGroups.js", undefined, log),
    installData(db, config, "Module", "id", "demo/modules.js", undefined, log),
    installData(db, config, "Vehicle", "id", "demo/vehicles.js", undefined, log)
  ], cb);
};

/**
 * Install example data used to demo the auth server.
 * @param {function} cb is a callback method where results or errors are returned.
 */
var uninstallDemo = function(cb) {
  var db = this.db;
  var config = this.config;
  var log = this.log;

  async.series([
    uninstallCfmDemo(db, config, log),
    uninstallData(db, config, "User", "name", "demo/users.js", log),
    uninstallData(db, config, "Application", "name", "demo/applications.js", log),
    uninstallData(db, config, "FunctionalGroup", "name", "demo/functionalGroups.js", log),
    uninstallData(db, config, "Module", "id", "demo/modules.js", log),
    uninstallData(db, config, "Vehicle", "id", "demo/vehicles.js", log)
  ], cb);
};

/**
 * Remove all data in the collections altered by the demo install process.
 * @param {function} cb is a callback method where results or errors are returned.
 */
var purgeDemoInstall = function(cb) {
  var db = this.db;
  var config = this.config;
  var log = this.log;

  async.series([
    dropCollectionByName(db, config, "applications", log),
    dropCollectionByName(db, config, "consumerfriendlymessages", log),
    dropCollectionByName(db, config, "messagetypes", log),
    dropCollectionByName(db, config, "users", log)
  ], cb);
};


/* ************************************************** *
 * ******************** Download Data Methods
 * ************************************************** */

/**
 * Creates a method to update the language file with data
 * from an external source.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} log is the logging instance object.
 * @return {function} a function that accepts a callback as a parameter.
 */
function updateLanguages(db, config, log) {
  return function(cb) {
    var DataManager = require(path.normalize(config.paths.serverDataFolder + "/modules/dataManager.js"))(undefined, db, config);

    // Scrap language data from an external site and add it to the database.
    DataManager.updateLanguageCache(function (err, data) {
      if (err) {
        cb(err);
      } else {
        log.i("Successfully updated ".white + "Language".cyan + " data.".white, config.server.debug);
        cb(undefined, ["Successfully updated Language data."]);
      }
    });
  }
}

/**
 * Update the country file with data from an external source.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} log is the logging instance object.
 * @return {function} a function that accepts a callback as a parameter.
 */
function updateCountries(db, config, log) {
  return function(cb) {
    var DataManager = require(path.normalize(config.paths.serverDataFolder + "/modules/dataManager.js"))(undefined, db, config);

    DataManager.updateCountryCache(function (err, data) {
      if (err) {
        cb(err);
      } else {
        log.i("Successfully updated ".white + "Country".cyan + " data.".white, config.server.debug);
        cb(undefined, ["Successfully updated Country data."]);
      }
    });
  }
}


/* ************************************************** *
 * ******************** Install / Uninstall Methods
 * ************************************************** */

/**
 * Install data from a file into a specified database schema.
 * If a data record already exists, then it will not be overwritten.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} Schema is the name of the database schema from the mongoose object.
 * @param {String||undefined} logKey is an object property name to be used for logging purposes.
 * @param {String||undefined} file is the file location, otherwise the method will look
 * for a file named the same as the schema.
 * @param {Object} defaultValues is an object containing properties to be used as default
 * values.  If a data record from the file is missing one of the default properties,
 * then it will be added before the record is saved.
 * @param {Object} log is the logging instance object.
 * @return {function} a method to perform the data import, with a callback as the only parameter.
 */
var installData = function(db, config, Schema, logKey, file, defaultValues, log) {
  var pluralize = require('pluralize');
  Schema = db.model(Schema);
  if( ! file) {
    file = pluralize(Schema.modelName);
    file = file.charAt(0).toLowerCase() + file.slice(1) + ".js";
  }

  return function(next) {
    getDataFromFile(config, file, function (err, data) {
      if (err) {
        return next(err);
      }

      var methods = [];

      for (var i = data.length - 1; i >= 0; --i) {
        if(defaultValues !== undefined) {
          for (var key in defaultValues) {
            if(defaultValues.hasOwnProperty(key)) {
              if (data[i][key] === undefined) {
                data[i][key] = defaultValues[key];
              }
            }
          }
        }

        methods.push(createInstallMethod(undefined, data[i], Schema, function (data, isNew) {
          if (isNew) {
            if(Schema && Schema.modelName && data && data[logKey]) {
              log.i("Added ".white + data[logKey].cyan + " to model ".white + Schema.modelName.cyan, config.server.debug);
              return "Added " + data[logKey] + " to model " + Schema.modelName;
            } else {
              log.i("Added record to schema model.", config.server.debug);
              return "Added record to schema model.";
            }
          } else {
            if(Schema && Schema.modelName && data && data[logKey]) {
              log.i(data[logKey].cyan + " already exists in model ".white + Schema.modelName.cyan, config.server.debug);
              return data[logKey] + " already exists in model " + Schema.modelName;
            } else {
              log.i("Added record to schema model.", config.server.debug);
              return "Added record to schema model.";
            }
          }
        }));
      }
      async.parallel(methods, function (err, results) {
        next(err, results);
      });
    });
  }
};

/**
 * Uninstall data found in a file from a specified database schema.
 * If a data record does not exists, then nothing will happen.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} Schema is the name of the database schema from the mongoose object.
 * @param {String||undefined} logKey is an object property name to be used for logging purposes.
 * @param {String||undefined}file is the file location, otherwise the method will look
 * for a file named the same as the schema.
 * @param {Object} log is the logging instance object.
 * @return {function} a method to perform the data removal, with a callback as the only parameter.
 */
var uninstallData = function(db, config, Schema, logKey, file, log) {
  var pluralize = require('pluralize');

  Schema = db.model(Schema);
  if( ! file) {
    file = pluralize(Schema.modelName);
    file = file.charAt(0).toLowerCase() + file.slice(1) + ".js";
  }

  return function(next) {
    getDataFromFile(config, file, function (err, data) {
      if (err) {
        return next(err);
      }

      var methods = [];

      for (var i = data.length - 1; i >= 0; --i) {
        methods.push(createUninstallMethod(undefined, data[i], Schema, function (data, isRemoved) {
          if (isRemoved) {
            if(Schema && Schema.modelName && data && data[logKey]) {
              log.i("Removed ".white + data[logKey].cyan + " from model ".white + Schema.modelName.cyan, config.server.debug);
              return "Removed " + data[logKey] + " from model " + Schema.modelName;
            } else {
              log.i("Removed record from schema model.", config.server.debug);
              return "Removed record from schema model.";
            }
          } else {
            if(Schema && Schema.modelName && data && data[logKey]) {
              log.i(data[logKey].cyan + " already removed from model ".white + Schema.modelName.cyan, config.server.debug);
              return data[logKey] + " already removed from model " + Schema.modelName;
            } else {
              log.i("Record already removed from model.", config.server.debug);
              return "Record already removed from model.";
            }
          }
        }));
      }
      async.parallel(methods, function (err, results) {
        next(err, results);
      });
    });
  }
};

/**
 * Generate Access Tokens for each user added to the database
 * during install, if a token does not already exist.  All of
 * the tokens will be activated.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} log is the logging instance object.
 * @return {function} a function that accepts a callback as a parameter.
 */
function generateAccessTokens(db, config, log) {
  return function(cb) {
    var User = db.model("User");

    // Get the list of users
    getDataFromFile(config, "users.js", function (err, data) {
      if (err) {
        return cb(err);
      }

      var methods = [];

      // A method to perform on each user.
      var createAccessTokenMethod = function (obj) {
        return function (cb) {

          // Find the user in the database
          User.findById(obj._id, function (err, user) {
            if (err) {
              return cb(err);
            }

            // If the user does not exist, do not try to create an access token for them.
            if (user === undefined || user === null) {
              obj = new User(obj.name);
              log.e("Cannot generate an ".white + "Access Token".cyan + " associated with the user ".white + obj.name.cyan + " because the user was not found in the database.".white);
              return cb("Cannot generate an Access Token associated with the user " + obj.name + " because the user was not found in the database.");
            }

            // Check if an access token already exists for the user.
            db.model("AccessToken").findOne({"user": user._id}, function (err, accessToken) {
              if (err) {
                return cb(err);
              }

              // If the access token already exists, do not try to create a new one.
              if (accessToken !== undefined && accessToken !== null) {
                log.i("An ".white + "Access Token".cyan + " has already been generated for the user ".white + user.name.cyan, config.server.debug);
                return cb(undefined, "An Access Token has already been generated for the user " + user.name);
              }

              // Create a new access token for the user.
              user.createAccessToken({ "activated": true }, function (err, accessToken) {
                if (err) {
                  cb(err);
                } else {
                  log.i("Generated ".white + "Access Token".cyan + " for user ".white + user.name.cyan, config.server.debug);
                  cb(undefined, "Generated Access Token for user " + user.name);
                }
              });

            });
          });
        }
      };

      // Create the list of tasks to be performed in parallel.
      for (var i = data.length - 1; i >= 0; --i) {
        methods.push(createAccessTokenMethod(data[i]));
      }

      // Execute the tasks in parallel, generating the access tokens.
      async.parallel(methods, function (err, results) {
        cb(err, results);
      });
    });
  }
}

/**
 * Remove Access Tokens associated with each user added to the
 * database during install, if the token exists.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} log is the logging instance object.
 * @return {function} a function that accepts a callback as a parameter.
 */
function removeAccessTokens(db, config, log) {
  return function(cb) {

    var User = db.model("User");

    // Get the list of users
    getDataFromFile(config, "users.js", function (err, data) {
      if (err) {
        return cb(err);
      }

      var methods = [];

      // A method to perform on each user.
      var createAccessTokenMethod = function (obj) {
        return function (cb) {

          // Find the user in the database
          User.findById(obj._id, function (err, user) {
            if (err) {
              return cb(err);
            }

            // If the user does not exist, do not try to remove an access token associated with them.
            if (user === undefined || user === null) {
              obj = new User(obj.name);
              log.e("Cannot remove the ".white + "Access Token".cyan + " associated with the user ".white + obj.name.cyan + " because the user was not found in the database.".white);
              return cb("Cannot remove the Access Token associated with the user " + obj.name + " because the user was not found in the database.");
            }

            // Check if an access token exists for the user.
            db.model("AccessToken").findOne({"user": user._id}, function (err, accessToken) {
              if (err) {
                return cb(err);
              }

              // If the access token does not exist, then we are done.
              if (accessToken === undefined || accessToken === null) {
                log.i("An Access Token".cyan + " has already been removed for the user ".white + user.name.cyan, config.server.debug);
                return cb(undefined, "An Access Token has already been removed for the user " + user.name);
              }

              // Remove the access token for the user.
              accessToken.remove(function (err) {
                if (err) {
                  cb(err);
                } else {
                  log.i("Removed ".white + "Access Token".cyan + " for the user ".white + user.name.cyan, config.server.debug);
                  cb(undefined, "Removed Access Token for the user " + user.name);
                }
              });
            });
          });
        }
      };

      // Create the list of tasks to be performed in parallel.
      for (var i = data.length - 1; i >= 0; --i) {
        methods.push(createAccessTokenMethod(data[i]));
      }

      // Execute the tasks in parallel, removing the access tokens.
      async.parallel(methods, function (err, results) {
        cb(err, results);
      });
    });
  }
}


/* ************************************************** *
 * ******************** Helper Methods
 * ************************************************** */

/**
 * Create a method to install a schema object, if it
 * has not already been installed.  This is designed to
 * be used with async.
 * @param {Object||undefined} query is a more specific object used
 * to see if the object to be saved already exists.
 * @param {Object} obj is the schema object to be installed.
 * @param {Object} Schema is the schema where the object will be installed.
 * @param {function} logInstallStatus is an optional method to log the results of the install.
 * @return {function} a function that accepts a callback as a parameter.
 */
var createInstallMethod = function(query, obj, Schema, logInstallStatus) {
  return function (cb) {
    logInstallStatus = (logInstallStatus) ? logInstallStatus : function(data, isNew) { return (isNew) ? "Installed object." : "Object already installed" };

    // Handle undefined query.
    if(query === undefined) {
      if (obj !== undefined && obj["_id"] !== undefined) {
        query = { "_id": obj._id };
      } else {
        query = obj;
      }
    }

    Schema.findOne(query, function (err, data) {
      if (err) {
        cb(err);
      } else {
        if (data === undefined || data === null) {
          new Schema(obj).save(function (err, data) {
            if (err) {
              cb(err);
            } else {
              cb(undefined, logInstallStatus(data, true));
            }
          });
        } else {
          cb(undefined, logInstallStatus(new Schema(data), false));
        }
      }
    });
  };
};

/**
 * Create an method to uninstall a schema object, if it
 * has not already been uninstalled.  This is designed to
 * be used with async.
 * @param {Object||undefined} query is a more specific object used
 * to see if the object to be removed is already removed.
 * @param {Object} obj is the schema object to be uninstalled.
 * @param {Object} Schema is the schema where the object will be uninstalled from.
 * @param {function} logUninstallStatus is an optional method to log the results of the uninstall.
 * @return {function} a function that accepts a callback as a parameter.
 */
var createUninstallMethod = function(query, obj, Schema, logUninstallStatus) {
  return function (cb) {
    logUninstallStatus = (logUninstallStatus) ? logUninstallStatus : function(data, isRemoved) { return (isRemoved) ? "Uninstalled object." : "Object already uninstalled" };

    // Handle undefined query.
    if(query === undefined) {
      if (obj !== undefined && obj["_id"] !== undefined) {
        query = { "_id": obj._id };
      } else {
        query = obj;
      }
    }

    Schema.findOne(query, function (err, data) {
      if (err) {
        cb(err);
      } else {
        if (data === undefined || data === null) {
          cb(undefined, logUninstallStatus(new Schema(obj), false));
        } else {
          data.remove(function (err) {
            if(err) {
              cb(err);
            } else {
              cb(undefined, logUninstallStatus(data, true));
            }
          });
        }
      }
    });
  };
};

/**
 * Get json data from a file in the data folder.
 * @param {Object} config is the server config object.
 * @param {String} location is a relative location from the data folder to the data file to be read.
 * @param {function} next is a callback method where the data or error is returned.
 */
var getDataFromFile = function(config, location, next) {
  // Check for valid location parameter.
  if( ! location) {
    return next(new Error("Invalid location parameter: " + location));
  }

  // Add the full path to the location.
  location = path.normalize(config.paths.serverDataFolder + "/" + location);

  // Check if the location is valid.
  fs.exists(location, function(exists) {
    if (!exists) {
      return next(new Error("Cannot load data from invalid file location: " + location));
    }

    // Read the file.
    fs.readFile(path.normalize(location), 'utf8', function (err, data) {
      if (err) {
        return next(err);
      }

      if ( ! data) {
        return next(new Error("There was no data found in file: " + location));
      }

      try {
        data = JSON.parse(data);
      } catch (err) {
        console.log("Invalid json in file: " + path.normalize(location));
        return next(err);
      }

      return next(undefined, data);
    });
  });
};

/**
 * Remove all data in a specified collection from the currently
 * connected database.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {String} schema is the name schema to be dropped.
 * @param {Object} log is the logging instance object.
 * @return {function} a function that accepts a callback as a parameter.
 */
function dropCollectionByName(db, config, schema, log) {
  return function(cb) {
    if(schema === undefined || schema === null) {
      log.w("Cannot drop a collection that is "+ "null".cyan + " or ".white + "undefined".cyan +" with an invalid name of ".white + schema.cyan);
      var err = new Error("Cannot drop a collection with an invalid name of " + schema);
      err["status"] = 500;
      return cb(err);
    }

    schema = schema.toLowerCase();

    if(db.connection.collections[schema] === undefined || db.connection.collections[schema] === null) {
      log.w("Cannot drop the ".white + schema.cyan + " collection because it does not exist".white);
      var err = new Error("Cannot drop the " + schema + " collection because it does not exist");
      err["status"] = 500;
      return cb(err);
    }

    db.connection.collections[schema].drop(function(err) {
      if(err) {
        if(err.message !== undefined && err.message.indexOf("ns not found") > -1) {
          log.w(schema.cyan + " collection does not need to be dropped because it has not yet been initialized.".white, config.server.debug);
          cb(undefined, schema + " collection does not need to be dropped because it has not yet been initialized.");
        } else {
          log.e("Failed to drop the ".white + schema.cyan + " collection.".white);
          log.e(err);
          cb(err);
        }
      } else {
        log.i("Dropped the ".white + schema.cyan + " collection.".white, config.server.debug);
        cb(undefined, "Dropped the " + schema + " collection.");
      }
    });
  }
}

/**
 * Remove all data from all collections in the currently connected database.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {function} cb is a method where the results or errors are returned.
 * @param {Object} log is the logging instance object.
 */
function dropAllCollections(db, config, cb, log) {
  var methods = [];

  // Create the list of tasks to be performed in parallel.
  for(var key in db.connection.collections) {
    if(db.connection.collections.hasOwnProperty(key)) {
      methods.push(dropCollectionByName(db, config, key, log));
    }
  }

  // Execute the tasks in parallel, removing the access tokens.
  async.parallel(methods, function (err, results) {
    cb(err, results);
  });
}

/**
 * Given a pull path create a directory and all of its parent
 * directories as well.  If the folder is already created, then
 * nothing will be done.
 * @param {Object} config is the server config object.
 * @param {String} directory is a full directory path.
 * @param {Object} log is the logging instance object.
 * @returns {function} an asynchronous function that takes in a callback.
 */
function createDirectory(config, directory, log) {
  var mkdirp = require('mkdirp');
  return function(cb) {
    if(directory === undefined || directory === null) {
      log.e("Could not create an invalid directory ".white + directory.cyan);
      return cb("Could not create an invalid directory " + directory);
    }

    mkdirp(directory, function(err) {
      if(err) {
        log.e("Could not create directory ".white + directory.cyan);
        cb(err);
      } else {
        log.i("Created directory ".white + directory.cyan, config.server.debug);
        cb(undefined, "Created directory " + directory);
      }
    });
  }
}

/**
 * Create all the directories and the parent directories for each path
 * provided.
 * @param {Object} config is the server config object.
 * @param {Array} directories is an array of full directory paths.
 * @param {Object} log is the logging instance object.
 * @returns {function} an asynchronous function that takes in a callback.
 */
function createDirectories(config, directories, log) {
  return function(cb) {

    var methods = [];

    if(directories === undefined || directories === null) {
      return cb("Can not create directories with an invalid directory list.");
    }

    // Create the list of tasks to be performed in parallel.
    for(var i = directories.length-1; i >= 0; --i) {
      methods.push(createDirectory(config, directories[i], log));
    }

    // Execute the tasks in parallel, removing the access tokens.
    async.parallel(methods, function (err, results) {
      cb(err, results);
    });
  };
}


/* ************************************************** *
 * ******************** TODO: Define example methods
 * ************************************************** */

/**
 * Add Consumer Friendly Message demo objects to the database,
 * if they have not already been added.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} log is the logging instance object.
 * @return {function} a function that accepts a callback as a parameter.
 */
function installCfmDemo(db, config, log) {
  return function(next) {
    var ConsumerFriendlyMessage = db.model('ConsumerFriendlyMessage'),
      MessageType = db.model('MessageType');

    // Get the example consumer friendly messages from the data file.
    getDataFromFile(config, "demo/consumerFriendlyMessages.js", function (err, data) {
      if (err) {
        return next(err);
      }

      var methods = [];

      // A method to perform on each consumer friendly message.
      var createCfmMethod = function (obj) {
        return function (cb) {

          ConsumerFriendlyMessage.findOne({ "_id": obj._id }, function (err, cfm) {
            if (err) {
              cb(err);
            } else if (cfm) {
              log.i("Consumer Friendly Message named ".white + cfm.name.cyan + " has already been added to the database.".white, config.server.debug);
              cb(undefined, "Consumer Friendly Message named " + cfm.name + " has already been added to the database.");
            } else {
              cfm = new ConsumerFriendlyMessage({
                "_id": obj._id,
                "name": (obj.name) ? obj.name : "Default",
                "description": (obj.description) ? obj.description : "A default consumer friendly message.",
                "version": (obj.version) ? obj.version : "000.000.001",
                "messages": []
              });

              // Create an array of message types from the object list of messages.
              for (var m in obj.messages) {
                if (obj.messages.hasOwnProperty(m)) {
                  var message = new MessageType({
                    "key": (m) ? m : "",
                    "description": (obj.messages[m].description) ? obj.messages[m].description : "",
                    "languages": []
                  });

                  // Create an array of language objects from the object list of languages.
                  for (var l in obj.messages[m].languages) {
                    if (obj.messages[m].languages.hasOwnProperty(l)) {
                      var language = {
                        "enabled": (obj.messages[m].languages[l].enabled) ? obj.messages[m].languages[l].enabled : true,
                        "key": (l) ? l : "",
                        "tts": (obj.messages[m].languages[l].tts) ? obj.messages[m].languages[l].tts : "",
                        "lines": []
                      };

                      // Create an array of lines from the object's line properties.
                      var count = 1;
                      while (obj.messages[m].languages[l]["line" + count] !== undefined) {
                        language.lines.push(obj.messages[m].languages[l]["line" + count]);
                        count++;
                      }
                      message.languages.push(language);
                    }
                  }

                  // Save the message.
                  message.save(function (err, messageType) {
                    if (err) {
                      log.e(err);
                    } else {
                      log.i("Added message type ".white + messageType.key.cyan + " to the database.".white, config.server.debug);
                    }
                  });

                  cfm.messages.push(message._id);
                }
              }

              cfm.save(function (err) {
                if (err) {
                  cb(err);
                } else {
                  log.i("Added consumer friendly message named ".white + cfm.name.cyan + " to the database.".white, config.server.debug);
                  cb(undefined, "Added consumer friendly message named " + cfm.name + " to the database.");
                }
              });
            }
          });
        };
      };

      // Handle each consumer friendly message in the array.
      for (var i = data.length - 1; i >= 0; --i) {
        methods.push(createCfmMethod(data[i]));
      }

      // Execute the tasks in parallel, creating the cfms.
      async.parallel(methods, function (err, results) {
        next(err, results);
      });
    });
  }
}

/**
 * Remove Consumer Friendly Message demo objects from the database,
 * if they have not already been removed.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} log is the logging instance object.
 * @return {function} a function that accepts a callback as a parameter.
 */
function uninstallCfmDemo(db, config, log) {
  return function(cb) {
    var ConsumerFriendlyMessage = db.model('ConsumerFriendlyMessage'),
      MessageType = db.model('MessageType');

    // Get the example consumer friendly messages from the data file.
    getDataFromFile(config, "demo/consumerFriendlyMessages.js", function (err, data) {
      if (err) {
        return cb(err);
      }

      var methods = [];

      // A method to perform on each consumer friendly message.
      var removeCfmMethod = function (obj) {
        return function (cb) {

          if (obj === undefined || obj === null) {
            return cb("Cannot add invalid consumer friendly message to the database.");
          }

          ConsumerFriendlyMessage.findOne({ "_id": obj._id }, function (err, cfm) {
            if (err) {
              log.e("Could not remove consumer friendly message named ".white + obj.name.cyan);
              cb(err);
            } else if (!cfm) {
              log.i("Consumer friendly message named ".white + obj.name.cyan + " is already removed from the database.".white, config.server.debug);
              cb(undefined, "Consumer friendly message named " + obj.name + " is already removed from the database.");
            } else {
              cfm.delete(undefined, function (err) {
                if (err) {
                  log.e("Error removing consumer friendly message named ".white + cfm.name.cyan + " from the database.".white);
                  cb(err);
                } else {
                  log.i("Removed consumer friendly message named ".white + cfm.name.cyan + " from the database.".white, config.server.debug);
                  cb(undefined, "Removed consumer friendly message named " + cfm.name + " from the database.");
                }
              });
            }
          });
        };
      };

      // Handle each consumer friendly message in the array.
      for (var i = data.length - 1; i >= 0; --i) {
        methods.push(removeCfmMethod(data[i]));
      }

      // Execute the tasks in parallel, creating the cfms.
      async.parallel(methods, function (err, results) {
        cb(err, results);
      });
    });
  }
}


/**
 * Add Functional Grouping demo objects to the database, if they
 * have not already been added.
 * @param {Object} db is the mongoose database object.
 * @param {Object} config is the server config object.
 * @param {Object} log is the logging instance object.
 * @return {function} a function that accepts a callback as a parameter.
 */
function installFunctionalGroupDemo(db, config, log) {
  return function(cb) {
    var FunctionalGroup = db.model('FunctionalGroup');

    // Get the example consumer friendly messages from the data file.
    getDataFromFile(config, "demo/functionalGroups.js", function (err, data) {
      if (err) {
        return cb(err);
      }

      var methods = [];

      // A method to perform on each consumer friendly message.
      var createFunctionalGroupMethod = function (obj) {
        return function (cb) {

          FunctionalGroup.findOne({ "_id": obj._id }, function (err, fg) {
            if (err) {
              cb(err);
            } else if (fg) {
              log.i("Functional Grouping named ".white + fg.name.cyan + " has already been added to the database.".white, config.server.debug);
              cb(undefined, "Consumer Friendly Message named " + fg.name + " has already been added to the database.");
            } else {
              fg = new FunctionalGroup({
                "_id": obj._id,
                "name": (obj.name) ? obj.name : "Functional Grouping",
                "description": (obj.description) ? obj.description : "",
                "properties": (obj.properties) ? obj.properties : {},
                "rpcs": (obj.rpcs) ? obj.rpcs : []
              });

              fg.save(function (err) {
                if (err) {
                  cb(err);
                } else {
                  log.i("Added Functional Group named ".white + fg.name.cyan + " to the database.".white, config.server.debug);
                  cb(undefined, "Added Functional Group named " + fg.name + " to the database.");
                }
              });
            }
          });
        };
      };

      // Handle each consumer friendly message in the array.
      for (var i = data.length - 1; i >= 0; --i) {
        methods.push(createFunctionalGroupMethod(data[i]));
      }

      // Execute the tasks in parallel, creating the cfms.
      async.parallel(methods, function (err, results) {
        cb(err, results);
      });
    });
  }
}

/* ************************************************** *
 * ******************** Public API
 * ************************************************** */

Installer.prototype.install = install;
Installer.prototype.uninstall = uninstall;
Installer.prototype.purgeInstall = purgeInstall;
Installer.prototype.purgeAll = purgeAll;
Installer.prototype.installDemo = installDemo;
Installer.prototype.uninstallDemo = uninstallDemo;
Installer.prototype.purgeDemoInstall = purgeDemoInstall;

Installer.prototype.isInstalled = isInstalled;
Installer.prototype.saveInstallEvent = saveInstallEvent;
Installer.prototype.removeInstallEvents = removeInstallEvents;

/* ************************************************** *
 * ******************** Export the Public API
 * ************************************************** */

// Reveal the method called when required in other files.
exports = module.exports = Installer;

// Reveal the public API.
exports = Installer;