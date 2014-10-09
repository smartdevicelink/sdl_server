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


  /* ************************************************** *
   * ******************** Routes
   * ************************************************** */

  /**
   * Install the server & server's database components.
   * Access is limited to a one time call with the install key.
   */
  app.post('/install.:format', auth.allowKeysOnce(installKeys), install);
	app.get('/install.:format', install);

  /**
   * Undo the server install and remove any database components
	 * added during install.
	 * Access is limited to the super admin role or higher.
   */
  app.post('/uninstall.:format', allowSuperAdmin, uninstall);
	app.get('/uninstall.:format', uninstall);

  /**
   * Purge all data in all database collections altered by
   * the install.
	 * Access is limited to the super admin role or higher.
   */
  app.post('/purge.:format', allowSuperAdmin, purgeInstall);
	app.get('/purge.:format', purgeInstall);

	/**
	 * Install example data into the database for demoing
	 * how the server works.
	 * Access is limited to the super admin role or higher.
	 */
	app.get('/installDemo.:format', allowSuperAdmin, installDemo);
	app.post('/installDemo.:format', allowSuperAdmin, installDemo);

	/**
	 * Uninstall example data by removing it from the database.
	 * Access is limited to the super admin role or higher.
	 */
	app.get('/uninstallDemo.:format', allowSuperAdmin, uninstallDemo);
	app.post('/uninstallDemo.:format', allowSuperAdmin, uninstallDemo);

	/**
	 * Purge all data in all database collections altered by
	 * the demo install.
	 * Access is limited to the super admin role or higher.
	 */
	app.post('/purgeDemo.:format', allowSuperAdmin, purgeDemoInstall);
	app.get('/purgeDemo.:format', purgeDemoInstall);

	/**
	 * Purge all data in the database.
	 * Access is limited to the super admin role or higher.
	 */
	app.post('/purgeAll.:format', allowSuperAdmin, purgeAll);
	app.get('/purgeAll.:format', purgeAll);


  /* ************************************************** *
   * ******************** Routes Methods
   * ************************************************** */

	/**
	 * Install all data and perform all steps to ensure the server can be
	 * run successfully.
	 */
	function install(req, res, next) {
		async.series([
			createDirectories([config.paths.clientAssetsImgUploadsFolder]),
			updateLanguages,
			updateCountries,
			installData("AndroidCategory", "name"),
			installData("IosCategory", "name"),
			installData("SdlVersion", "version"),
			installData("UserRole", "name"),
			installData("User", "name", undefined, { "password" : config.installKey, "securityAnswer": config.installKey }),
			generateAccessTokens,
			installData("Category", "name"),
			installData("HmiLevel", "name"),
			installData("Language", "language", "languages.js"),
			installData("Country", "country", "countries.js")
		], function(err, results) {
			if(err) {
				next(err);
			} else {
				sender.setResponse(results, req, res, next);
			}
		});
	}

	/**
	 * Uninstall the server by removing all data added during install and undoing
	 * all changes made during install.  This will not delete all data from the
	 * database, use the purge method for this.
	 */
	function uninstall(req, res, next) {
		async.series([
			uninstallData("AndroidCategory", "name"),
			uninstallData("IosCategory", "name"),
			uninstallData("SdlVersion", "version"),
			uninstallData("UserRole", "name"),
			removeAccessTokens,
			uninstallData("User", "name"),
			uninstallData("Category", "name"),
			uninstallData("HmiLevel", "name"),
			uninstallData("Language", "language", "languages.js"),
			uninstallData("Country", "country", "countries.js")
		], function(err, results) {
			if(err) {
				next(err);
			} else {
				sender.setResponse(results, req, res, next);
			}
		});
	}

  /**
   * Remove all data in the collections altered by the
	 * install process.
   */
  function purgeInstall(req, res, next) {
		async.series([
			dropCollectionByName("userroles"),
			dropCollectionByName("accesstokens"),
			dropCollectionByName("users"),
			dropCollectionByName("categories"),
			dropCollectionByName("languages"),
			dropCollectionByName("countries"),
			dropCollectionByName("fadingkeys")
		], function(err, results) {
			if(err) {
				next(err);
			} else {
				sender.setResponse(results, req, res, next);
			}
		});
  }

  /**
   * Remove all data in the database.
   */
  function purgeAll(req, res, next) {
    dropAllCollections(function(err, results) {
			if(err) {
				next(err);
			} else {
				sender.setResponse(results, req, res, next);
			}
		});
  }

	/**
	 * Install example data used to demo the auth server.
	 */
	function installDemo(req, res, next) {
		async.series([
			installCfmDemo,
			installData("User", "name", "demo/users.js", { "password" : config.installKey, "securityAnswer": config.installKey }),
			installData("Application", "name", "demo/applications.js"),
			installData("FunctionalGroup", "name", "demo/functionalGroups.js")
		], function(err, results) {
			if(err) {
				next(err);
			} else {
				sender.setResponse(results, req, res, next);
			}
		});
	}

	/**
	 * Install example data used to demo the auth server.
	 */
	function uninstallDemo(req, res, next) {
		async.series([
			uninstallCfmDemo,
			uninstallData("User", "name", "demo/users.js"),
			uninstallData("Application", "name", "demo/applications.js"),
			uninstallData("FunctionalGroup", "name", "demo/functionalGroups.js")
		], function(err, results) {
			if(err) {
				next(err);
			} else {
				sender.setResponse(results, req, res, next);
			}
		});
	}

	/**
	 * Remove all data in the collections altered by the
	 * demo install process.
	 */
	function purgeDemoInstall(req, res, next) {
		async.series([
			dropCollectionByName("applications"),
			dropCollectionByName("consumerfriendlymessages"),
			dropCollectionByName("messagetypes"),
			dropCollectionByName("users")
		], function(err, results) {
			if(err) {
				next(err);
			} else {
				sender.setResponse(results, req, res, next);
			}
		});
	}


	/* ************************************************** *
	 * ******************** Download Data Methods
	 * ************************************************** */

	/**
	 * Update the language file with data from an external source.
	 * @param cb is a callback method for after the task is complete.
	 */
	function updateLanguages(cb) {
		var DataManager = require(path.normalize(config.paths.serverDataFolder + "/modules/dataManager.js"))(app, db, config);

		DataManager.updateLanguageCache(function(err, data) {
			if(err) {
				cb(err);
			} else {
				log.i("Successfully updated ".white + "Language".cyan + " data.".white)
				cb(undefined, ["Successfully updated Language data."]);
			}
		});
	}

	/**
	 * Update the country file with data from an external source.
	 * @param cb is a callback method for after the task is complete.
	 */
	function updateCountries(cb) {
		var DataManager = require(path.normalize(config.paths.serverDataFolder + "/modules/dataManager.js"))(app, db, config);

		DataManager.updateCountryCache(function(err, data) {
			if(err) {
				cb(err);
			} else {
				log.i("Successfully updated ".white + "Country".cyan + " data.".white)
				cb(undefined, ["Successfully updated Country data."]);
			}
		});
	}


	/* ************************************************** *
	 * ******************** Install / Uninstall Methods
	 * ************************************************** */

	/**
	 * Install data from a file into a specified database schema.
	 * If a data record already exists, then it will not be overwritten.
	 * @param Schema is the name of the database schema from the mongoose object.
	 * @param logKey (optional) is an object property name to be used for logging purposes.
	 * @param file (optional) is the file location, otherwise the method will look
	 * for a file named the same as the schema.
	 * @param defaultValues is an object containing properties to be used as default
	 * values.  If a data record from the file is missing one of the default properties,
	 * then it will be added before the record is saved.
	 * @return a method to perform the data import, with a callback as the only parameter.
	 */
	var installData = function(Schema, logKey, file, defaultValues) {
		var pluralize = require('pluralize');
		Schema = db.model(Schema);
		if( ! file) {
			file = pluralize(Schema.modelName);
			file = file.charAt(0).toLowerCase() + file.slice(1) + ".js";
		}

		return function(next) {
			getDataFromFile(file, function (err, data) {
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
									log.i("Added ".white + data[logKey].cyan + " to model ".white + Schema.modelName.cyan);
									return "Added " + data[logKey] + " to model " + Schema.modelName;
								} else {
									log.i("Added record to schema model.");
									return "Added record to schema model.";
								}
							} else {
								if(Schema && Schema.modelName && data && data[logKey]) {
									log.i(data[logKey].cyan + " already exists in model ".white + Schema.modelName.cyan);
									return data[logKey] + " already exists in model " + Schema.modelName;
								} else {
									log.i("Added record to schema model.");
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
	 * @param Schema is the name of the database schema from the mongoose object.
	 * @param logKey (optional) is an object property name to be used for logging purposes.
	 * @param file (optional) is the file location, otherwise the method will look
	 * for a file named the same as the schema.
	 * @return a method to perform the data removal, with a callback as the only parameter.
	 */
	var uninstallData = function(Schema, logKey, file) {
		var pluralize = require('pluralize');

		Schema = db.model(Schema);
		if( ! file) {
			file = pluralize(Schema.modelName);
			file = file.charAt(0).toLowerCase() + file.slice(1) + ".js";
		}

		return function(next) {
			getDataFromFile(file, function (err, data) {
				if (err) {
					return next(err);
				}

				var methods = [];

				for (var i = data.length - 1; i >= 0; --i) {
					methods.push(createUninstallMethod(undefined, data[i], Schema, function (data, isRemoved) {
						if (isRemoved) {
							if(Schema && Schema.modelName && data && data[logKey]) {
								log.i("Removed ".white + data[logKey].cyan + " from model ".white + Schema.modelName.cyan);
								return "Removed " + data[logKey] + " from model " + Schema.modelName;
							} else {
								log.i("Removed record from schema model.");
								return "Removed record from schema model.";
							}
						} else {
							if(Schema && Schema.modelName && data && data[logKey]) {
								log.i(data[logKey].cyan + " already removed from model ".white + Schema.modelName.cyan);
								return data[logKey] + " already removed from model " + Schema.modelName;
							} else {
								log.i("Record already removed from model.");
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
	 */
	function generateAccessTokens(next) {
		User = db.model("User");

		// Get the list of users
		getDataFromFile("users.js", function (err, data) {
			if (err) {
				return next(err);
			}

			var methods = [];

			// A method to perform on each user.
			var createAccessTokenMethod = function(obj) {
				return function(cb) {

					// Find the user in the database
					db.model("User").findById(obj._id, function (err, user) {
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
						db.model("AccessToken").findOne({"user" : user._id}, function(err, accessToken) {
							if (err) {
								return cb(err);
							}

							// If the access token already exists, do not try to create a new one.
							if (accessToken !== undefined && accessToken !== null) {
								log.i("An ".white + "Access Token".cyan + " has already been generated for the user ".white + user.name.cyan);
								return cb(undefined, "An Access Token has already been generated for the user " + user.name);
							}

							// Create a new access token for the user.
							user.createAccessToken({ "activated": true }, function(err, accessToken) {
								if (err) {
									cb(err);
								} else {
									log.i("Generated ".white + "Access Token".cyan + " for user ".white + user.name.cyan);
									cb(undefined, "Generated Access Token for user " + user.name);
								}
							});

						});
					});
				}
			};

			// Create the list of tasks to be performed in parallel.
			for(var i = data.length-1; i >= 0; --i) {
				methods.push(createAccessTokenMethod(data[i]));
			}

			// Execute the tasks in parallel, generating the access tokens.
			async.parallel(methods, function (err, results) {
				next(err, results);
			});
		});
	}

	/**
	 * Remove Access Tokens associated with each user added to the
	 * database during install, if the token exists.
	 */
	function removeAccessTokens(next) {
		User = db.model("User");

		// Get the list of users
		getDataFromFile("users.js", function (err, data) {
			if (err) {
				return next(err);
			}

			var methods = [];

			// A method to perform on each user.
			var createAccessTokenMethod = function(obj) {
				return function(cb) {

					// Find the user in the database
					db.model("User").findById(obj._id, function (err, user) {
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
						db.model("AccessToken").findOne({"user" : user._id}, function(err, accessToken) {
							if (err) {
								return cb(err);
							}

							// If the access token does not exist, then we are done.
							if (accessToken === undefined || accessToken === null) {
								log.i("An Access Token".cyan + " has already been removed for the user ".white + user.name.cyan);
								return cb(undefined, "An Access Token has already been removed for the user " + user.name);
							}

							// Remove the access token for the user.
							accessToken.remove(function(err) {
								if(err) {
									cb(err);
								} else {
									log.i("Removed ".white + "Access Token".cyan + " for the user ".white + user.name.cyan);
									cb(undefined, "Removed Access Token for the user " + user.name);
								}
							});
						});
					});
				}
			};

			// Create the list of tasks to be performed in parallel.
			for(var i = data.length-1; i >= 0; --i) {
				methods.push(createAccessTokenMethod(data[i]));
			}

			// Execute the tasks in parallel, removing the access tokens.
			async.parallel(methods, function (err, results) {
				next(err, results);
			});
		});
	}


	/* ************************************************** *
	 * ******************** Helper Methods
	 * ************************************************** */

	/**
	 * Create a method to install a schema object, if it
	 * has not already been installed.  This is designed to
	 * be used with async.
	 * @param query (optional) is a more specific object used
	 * to see if the object to be saved already exists.
	 * @param obj is the schema object to be installed.
	 * @param Schema is the schema where the object will be installed.
	 * @param log is an optional method to log the results of the install.
	 */
	var createInstallMethod = function(query, obj, Schema, log) {
		return function (cb) {
			log = (log) ? log : function(data, isNew) { return (isNew) ? "Installed object." : "Object already installed" };

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
								cb(undefined, log(data, true));
							}
						});
					} else {
						cb(undefined, log(new Schema(data), false));
					}
				}
			});
		};
	};

	/**
	 * Create an method to uninstall a schema object, if it
	 * has not already been uninstalled.  This is designed to
	 * be used with async.
	 * @param query (optional) is a more specific object used
	 * to see if the object to be removed is already removed.
	 * @param obj is the schema object to be uninstalled.
	 * @param Schema is the schema where the object will be uninstalled from.
	 * @param log is an optional method to log the results of the uninstall.
	 */
	var createUninstallMethod = function(query, obj, Schema, log) {
		return function (cb) {
			log = (log) ? log : function(data, isRemoved) { return (isRemoved) ? "Uninstalled object." : "Object already uninstalled" };

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
						cb(undefined, log(new Schema(obj), false));
					} else {
						data.remove(function (err) {
							if(err) {
								cb(err);
							} else {
								cb(undefined, log(data, true));
							}
						});
					}
				}
			});
		};
	};

	/**
	 * Get json data from a file in the data folder.
	 * @param location is a relative location from the data folder to the data file to be read.
	 * @param next is a callback method where the data or error is returned.
	 */
	var getDataFromFile = function(location, next) {
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
					return next(err);
				}

				return next(undefined, data);
			});
		});
	};

	/**
	 * Remove all data in a specified collection from the currently
	 * connected database.
	 */
	function dropCollectionByName(schema) {
		return function(cb) {
			if( schema === undefined || schema === null) {
				log.i("Cannot drop a collection with an invalid name of ".white + schema.cyan);
				return cb(sender.createError("Cannot drop a collection with an invalid name of " + schema, 500));
			}

			schema = schema.toLowerCase();

			if(db.connection.collections[schema] === undefined || db.connection.collections[schema] === null) {
				log.e("Cannot drop the ".white + schema.cyan + " collection because it does not exist".white);
				return cb(sender.createError("Cannot drop the " + schema + " collection because it does not exist", 500));
			}

			db.connection.collections[schema].drop(function(err) {
				if(err) {
					if(err.message !== undefined && err.message.indexOf("ns not found") > -1) {
						log.i(schema.cyan + " collection does not need to be dropped because it has not yet been initialized.".white);
						cb(undefined, schema + " collection does not need to be dropped because it has not yet been initialized.");
					} else {
						log.e("Failed to drop the ".white + schema.cyan + " collection.".white);
						log.e(err);
						cb(err);
					}
				} else {
					log.i("Dropped the ".white + schema.cyan + " collection.".white);
					cb(undefined, "Dropped the " + schema + " collection.");
				}
			});
		}
	}

	/**
	 * Remove all data from all collections in the currently connected database.
	 */
	function dropAllCollections(next) {
		var methods = [];

		// Create the list of tasks to be performed in parallel.
		for(var key in db.connection.collections) {
			if(db.connection.collections.hasOwnProperty(key)) {
				methods.push(dropCollectionByName(key));
			}
		}

		// Execute the tasks in parallel, removing the access tokens.
		async.parallel(methods, function (err, results) {
			next(err, results);
		});
	}

	/**
	 * Given a pull path create a directory and all of its parent
	 * directories as well.  If the folder is already created, then
	 * nothing will be done.
	 * @param directory is a full directory path.
	 * @returns an asynchronous function that takes in a callback.
	 */
	function createDirectory(directory) {
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
					log.i("Created directory ".white + directory.cyan);
					cb(undefined, "Created directory " + directory);
				}
			});
		}
	}

	/**
	 * Create all the directories and the parent directories for each path
	 * provided.
	 * @param directories is an array of full directory paths.
	 * @returns an asynchronous function that takes in a callback.
	 */
	function createDirectories(directories) {
		return function(cb) {

			var methods = [];

			if(directories === undefined || directories === null) {
				return cb("Can not create directories with an invalid directory list.");
			}

			// Create the list of tasks to be performed in parallel.
			for(var i = directories.length-1; i >= 0; --i) {
				methods.push(createDirectory(directories[i]));
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
	 * @param next is a callback method where the results or errors
	 * will be returned to.
	 */
	function installCfmDemo(next) {
		var ConsumerFriendlyMessage = db.model('ConsumerFriendlyMessage'),
				MessageType = db.model('MessageType');

		// Get the example consumer friendly messages from the data file.
		getDataFromFile("demo/consumerFriendlyMessages.js", function (err, data) {
			if (err) {
				return next(err);
			}

			var methods = [];

			// A method to perform on each consumer friendly message.
			var createCfmMethod = function (obj) {
				return function (cb) {

					ConsumerFriendlyMessage.findOne({ "_id": obj._id }, function(err, cfm) {
						if(err) {
							cb(err);
						} else if(cfm) {
							log.i("Consumer Friendly Message named ".white + cfm.name.cyan + " has already been added to the database.".white);
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
							for(var m in obj.messages) {
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
											log.i("Added message type ".white + messageType.key.cyan + " to the database.".white);
										}
									});

									cfm.messages.push(message._id);
								}
							}

							cfm.save(function(err) {
								if(err) {
									cb(err);
								} else {
									log.i("Added consumer friendly message named ".white + cfm.name.cyan + " to the database.".white);
									cb(undefined, "Added consumer friendly message named " + cfm.name + " to the database.");
								}
							});
						}
					});
				};
			};

			// Handle each consumer friendly message in the array.
			for(var i = data.length-1; i >=0; --i) {
				methods.push(createCfmMethod(data[i]));
			}

			// Execute the tasks in parallel, creating the cfms.
			async.parallel(methods, function (err, results) {
				next(err, results);
			});
		});
	}

	/**
	 * Remove Consumer Friendly Message demo objects from the database,
	 * if they have not already been removed.
	 * @param cb is a callback method where the results or errors
	 * will be returned to.
	 */
	function uninstallCfmDemo(cb) {
		var ConsumerFriendlyMessage = db.model('ConsumerFriendlyMessage'),
				MessageType = db.model('MessageType');

		// Get the example consumer friendly messages from the data file.
		getDataFromFile("demo/consumerFriendlyMessages.js", function (err, data) {
			if (err) {
				return next(err);
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
						} else if( ! cfm) {
							log.i("Consumer friendly message named ".white + obj.name.cyan + " is already removed from the database.".white);
							cb(undefined, "Consumer friendly message named " + obj.name + " is already removed from the database.");
						} else {
							cfm.delete(undefined, function (err) {
								if (err) {
									log.e("Error removing consumer friendly message named ".white + cfm.name.cyan + " from the database.".white);
									cb(err);
								} else {
									log.i("Removed consumer friendly message named ".white + cfm.name.cyan + " from the database.".white);
									cb(undefined, "Removed consumer friendly message named " + cfm.name + " from the database.");
								}
							});
						}
					});
				};
			};

			// Handle each consumer friendly message in the array.
			for(var i = data.length-1; i >=0; --i) {
				methods.push(removeCfmMethod(data[i]));
			}

			// Execute the tasks in parallel, creating the cfms.
			async.parallel(methods, function (err, results) {
				cb(err, results);
			});
		});
	}


	/**
	 * Add Functional Grouping demo objects to the database, if they
	 * have not already been added.
	 * @param next is a callback method where the results or errors
	 * will be returned to.
	 */
	function installFunctionalGroupDemo(next) {
		var FunctionalGroup = db.model('FunctionalGroup');

		// Get the example consumer friendly messages from the data file.
		getDataFromFile("demo/functionalGroups.js", function (err, data) {
			if (err) {
				return next(err);
			}

			var methods = [];

			// A method to perform on each consumer friendly message.
			var createFunctionalGroupMethod = function (obj) {
				return function (cb) {

					FunctionalGroup.findOne({ "_id": obj._id }, function(err, fg) {
						if(err) {
							cb(err);
						} else if(fg) {
							log.i("Functional Grouping named ".white + fg.name.cyan + " has already been added to the database.".white);
							cb(undefined, "Consumer Friendly Message named " + fg.name + " has already been added to the database.");
						} else {
							fg = new FunctionalGroup({
								"_id": obj._id,
								"name": (obj.name) ? obj.name : "Functional Grouping",
								"description": (obj.description) ? obj.description : "",
								"properties": (obj.properties) ? obj.properties : {},
								"rpcs": (obj.rpcs) ? obj.rpcs : []
							});

							fg.save(function(err) {
								if(err) {
									cb(err);
								} else {
									log.i("Added Functional Group named ".white + fg.name.cyan + " to the database.".white);
									cb(undefined, "Added Functional Group named " + fg.name + " to the database.");
								}
							});
						}
					});
				};
			};

			// Handle each consumer friendly message in the array.
			for(var i = data.length-1; i >=0; --i) {
				methods.push(createFunctionalGroupMethod(data[i]));
			}

			// Execute the tasks in parallel, creating the cfms.
			async.parallel(methods, function (err, results) {
				next(err, results);
			});
		});
	}

};
