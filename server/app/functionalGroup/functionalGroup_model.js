// ~> Model
// ~A Scott Smereka

/* Functional Groups
 * Handles all data related to an end user.  An end user
 * is a person using the connection between the car and 
 * and phone.
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    _        = require("underscore"),
    model    = fox.model;


module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Functional Group Variables
   * ************************************************** */

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;        // Object ID used in mongoose schemas


  /* ************************************************** *
   * ******************** Functional Group Schema
   * ************************************************** */

  var FunctionalGroup = new Schema({
    name: { type: String },
    description: { type: String },
    rpcs: [{
			name: { type: String },
			hmiLevels: [{ type: String }],
			parameters: [{ type: String }]
		}],
    properties: {}
  });


  /* ************************************************** *
   * ******************** Functional Group Methods
   * ************************************************** */

	/**
	 * Format the functional group object for use with
	 * policy tables.
	 * @returns the formatted functional group within an object.
	 */
	FunctionalGroup.methods.format = function() {
		var obj = {},
				rpcs = {};

		// Function Group Name
		obj[this.name] = {};

		// RPCS
		for(var i = this.rpcs.length-1; i >=0; --i) {
			// RPC Name
			rpcs[this.rpcs[i].name] = {};

			// RPC HMI Levels
			if(this.rpcs[i]["hmiLevels"] !== undefined && this.rpcs[i]["hmiLevels"] !== null && this.rpcs[i]["hmiLevels"].length > 0) {
				rpcs[this.rpcs[i].name]["hmi_levels"] = this.rpcs[i]["hmiLevels"];
			}

			// RPC Parameters
			if(this.rpcs[i]["parameters"] !== undefined && this.rpcs[i]["parameters"] !== null && this.rpcs[i]["parameters"].length > 0) {
				rpcs[this.rpcs[i].name]["parameters"] = this.rpcs[i].parameters;
			}
		}

		// Set RPCS
		obj[this.name]["rpcs"] = rpcs;


		// Properties
		if(this["properties"] !== undefined && this["properties"] !== null) {
			for(var key in this.properties) {
				if(this.properties.hasOwnProperty(key)) {
					obj[this.name][key] = this.properties[key];
				}
			}
		}

		return obj;
	};


	FunctionalGroup.methods.copy = function(obj, next) {
		var FG = db.model('FunctionalGroup');

		var fgCopy = new FG({
			"name": (obj !== undefined && obj.name !== undefined) ? obj.name : this.name,
			"description": (obj !== undefined && obj.description !== undefined) ? obj.description : this.description,
			"rpcs": (obj !== undefined && obj.rpcs !== undefined) ? obj.rpcs : this.rpcs,
			"properties": (obj !== undefined && obj.properties !== undefined) ? obj.properties : this.properties
		});

		console.log(fgCopy);

		fgCopy.save(function(err, fgCopy) {
			next(err, fgCopy);
		});
	};

  /* ************************************************** *
   * ******************** CRUD Override Methods
   * ************************************************** */
   
   /* Enabling CRUD will automatically take care of 
    * update, and delete methods for the object. However 
    * you can still add your own custom functionality 
    * here, by overriding the default methods.
    *
    * In addition to overriding you can add more methods
    * that CRUD will automatically use such as sanitize.
    */

  /**
   * Strip out secret information that should not be seen
   * outside of this server.
   */
  FunctionalGroup.methods.sanitize = function() {
    return this;
  };

  /*FunctionalGroup.methods.update = function(newObj, userId, next) {
    if( ! newObj) {
      return next(sender.createError("Cannot update functional group because update object is invalid."));
    }

    var value;

    for(var key in newObj) {
      value = undefined;
      switch(key) {
        case 'description':
        case 'name':
          if(_.isString(newObj[key])) {
            value = newObj[key];
          }
          break;
        case 'rpcs':
        case 'properties':
          value = newObj[key];
          break;
        default:
          break;
      }

      // If the value was valid, then update the object.
      if(value !== undefined) {
        this[key] = value;
      }
    }

    this.save(function(err, functionGroup) {
      return next(err, functionGroup);
    });
  }*/

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  FunctionalGroup.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('FunctionalGroup', FunctionalGroup);

};