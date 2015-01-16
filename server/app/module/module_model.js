// ~> Model
// ~A Scott Smereka

/* Module
 * Handles all data related to a vehicle's head unit.
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    model    = fox.model;


module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Module Variables
   * ************************************************** */

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;        // Object ID used in mongoose schemas


  /* ************************************************** *
   * ******************** Module Config Schema
   * ************************************************** */

  /**
   * Describes a vehicle's head unit hardware / software
   * components.  Stores information about the module and
   * how to communicate with it.
   */
  var Module = new Schema({
    // Consumer messages in different languages.
    consumerFriendlyMessages: [{ type: ObjectId, ref: "ConsumerFriendlyMessage"}],

    // Unique identifier for a country.
    countryCode: { type: String },

    // Module's hardware version.
    firmwareVersion: { type: String },

    // Policys describing what functionalties are allowed for each app.
    functionalGroups: [{ type: ObjectId, ref: "FunctionalGroups" }],

    // Default language for the module.
    language: { type: String},   //TODO:  Is this required.

    // Type of module
    type: { type: String },  //TODO:  Is this required?

    notificationSettings: {
      communication: { type: Number, default: 6 },
      emergency: { type: Number, default: 60 },
      navigation: { type: Number, default: 15},
      none: { type: Number, default: 0 },
      normal: { type: Number, default: 4 },
      voice: { type: Number, default: 10 },
    },

    // Module's software version.
    softwareVersion: { type: String },

    // Symmetric key used for communication between the module and the server.
    symmetricKey: { type: String, default: db.Types.ObjectId },

    // Settings used to configure how and when the module
    // performs updates to synchronize with the server.
    updateSettings: {
      days: { type: Date, default: 30 },
      ignitionCycles: { type: Number, default: 100 },
      kilometers: { type: Number, default: 1800 },
      retryAttempts: { type: Number, default: 5 },
      timeout: { type: Number, default: 60 }
    }
  });


  /* ************************************************** *
   * ******************** Static Module Methods
   * ************************************************** */

  Module.statics.findByIdFromRequest = function(req, res, next) {
    db.model("Module").findById(req.params.moduleId, function(err, module) {
      if(err) {
        return next(err);
      } else if(module == null) {
        return next(new Error("Invalid module ID of '" + req.params.moduleId + "'."));
      } else {
        res.locals.module = module;
        next()
      }
    });
  };

  /* ************************************************** *
   * ******************** Module Methods
   * ************************************************** */

  


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
  Module.methods.sanitize = function() {
    return this;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  Module.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('Module', Module);

};