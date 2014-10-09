// ~> Model
// ~A Scott Smereka

/* Policy - Module Config
 * Manages the configuration settings and information
 * specific to a vehicle's head unit.
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    date     = fox.date,
    log      = fox.log,
    model    = fox.model,
    sanitize = require('sanitize-it');


module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Module Variables
   * ************************************************** */

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;        // Object ID used in mongoose schemas

  // Load protocol constants.
  var SDL = config["const"]["TYPE_SDL"],
      SADL = config["const"]["TYPE_SADL"];

  /* ************************************************** *
   * ******************** Module Config Schema
   * ************************************************** */

  /**
   * Configurations for the Ford module.
   * Stores information and settings specific to a head unit.
   */
  var ModuleConfig = new Schema({

    module : { type: ObjectId, ref: "Module" },

    // Indicates whether or not this policy is a preloaded policy.
    // TODO:  What is this used for?
    preloaded_pt: { type: Boolean, default: false },

    // Number of engine ignition cycles before a policy is invalid and a 
    // policy update is required.
    exchange_after_x_ignition_cycles: { type: Number, default: 100 }, 

    // Number of kilometers traveled before a policy is invalid and a
    // policy update is required.
    exchange_after_x_kilometers: { type: Number, default: 1800 }, 

    // Number of days before a policy is invalid and a 
    // policy update is required.
    exchange_after_x_days: { type: Number, default: 30},  

    // Number of seconds that can elapse before an automatic police table update will timeout ?
    timeout_after_x_seconds: { type: Number, default: 60},  

    // Number of times to retry an update, using exponential backoff.
    num_update_retries: { type: Number, default: 5 },
    
    // TODO:  What is this?
    endpoints: { 
      service_type: { type: String, default: "0x07" },
      "default": [ { type: String } ]
    },
    
    // Number of notifications allowed per minute for each
    // priority level.  If a priority level is not defined
    notifications_per_minute_by_priority: { 
       "emergency":           { type: Number, default: 60 },
       "navigation":          { type: Number, default: 15 },
       "voiceCommunications": { type: Number, default: 10 },
       "communication":       { type: Number, default: 6 },
       "normal":              { type: Number, default: 4 },
       "none":                { type: Number, default: 0 }
    }
  });

/*
      // Stores vehicle data
    // TODO: User specific, move it out of modue config.
    vehicle: { type: ObjectId, ref: "Vehicle" },
  */
  /*
    var Endpoints = new Schema({
      service_type: { type: String, default: "0x07" },
      "default": [ { type: String }]
    });
  */

  /* ************************************************** *
   * ******************** Policy Methods
   * ************************************************** */

  /*
    Endpoints.methods.format = function(type) {
      var obj = this.toObject();
      type = (type) ? type : TYPE_SDL;

      switch(type) {
        case TYPE_SDL:
          obj = mapArrayToObject(obj, "service_type");
          break;
      }
      return obj;
    }
  */

  /**
   * Format the module config information based on type
   * of system requesting the data.
   */
  ModuleConfig.methods.format = function(protocol, version, vehicle, next) {
    next = (next) ? next : function(err, obj) { if(err) {console.log(err); } else { return obj}};
    switch(protocol) {

      // Default to just returning the object as it is.
      default:
        return next(undefined, this.toObject());

      // Format for SADL version 1.0
      case SADL:
        // Convert the schema object to an object so we can modify it.
        var obj = this.toObject();

        // Remove schema properties.
        delete obj["_id"];
        delete obj["__v"];
        delete obj["module"];
        return next(undefined, obj);

      // Format for SDL Version 2.0
      case SDL:
        if( ! obj) {
          next();
        }

        // Convert the schema object to an object so we can modify it.
        var obj = this.toObject();

        // Remove schema properties.
        delete obj["_id"];
        delete obj["__v"];
        delete obj["module"];

        // Convert notifications property keys into uppercase, lowercase, and all kinds of cases, why? because dumb.
        if(obj["notifications_per_minute_by_priority"]) {
          obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "emergency", "EMERGENCY");
          obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "navigation", "NAVIGATION");
          obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "voiceCommunication", "voiceCommunication");
          obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "communication", "COMMUNICATION");
          obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "normal", "NORMAL");
          obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "none", "NONE");
        }

        // Move vehicle data into root object.
        if(vehicle) {
          obj["vehicle_make"] = (vehicle["make"]) ? vehicle["make"] : "";
          obj["vehicle_model"] = (vehicle["model"]) ? vehicle["model"] : "";
          obj["vehicle_year"] = (vehicle["year"]) ? vehicle["year"] : "";
        }

        // Index endpoint 

        // Set the seconds between retrys from number of retries.
        obj["seconds_between_retries"] = [];
        var backoffSeconds;
        for(var i = 0; i <= obj["num_update_retries"] && i < 6; i++) {
           backoffSeconds = Math.pow(2, i)-1;
          if(backoffSeconds > 720) {
            backoffSeconds = 720;
          }
          obj["seconds_between_retries"].push(backoffSeconds);
        }
        delete obj["num_update_retries"];
        return next(undefined, obj);
    }
  }


  var changeKeyName = function(obj, oldKey, newKey, next) {
    // If the object contains a value for the old key.
    if(obj && obj.hasOwnProperty(oldKey)) {
      
      // Save the value to the new property location
      obj[newKey] = obj[oldKey];

      // Remove the old property.
      delete obj[oldKey];
    }

    if(next) {
      next(undefined, obj);
    } else {
      return obj;
    }
  }


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
  ModuleConfig.methods.sanitize = function() {
    return this;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  ModuleConfig.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('ModuleConfig', ModuleConfig);

};