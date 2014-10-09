//  Model
// ~A Scott Smereka

/* Policy
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    crypto   = fox.crypto,
    date     = fox.date,
    log      = fox.log,
    model    = fox.model,
    sanitize = require('sanitize-it');


module.exports = function(app, db, config) {

  var TYPE_SADL = 'sdl',
      TYPE_SDL_V2 = 'sdlv2';

  /* ************************************************** *
   * ******************** Module Variables
   * ************************************************** */

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;        // Object ID used in mongoose schemas


  /* ************************************************** *
   * ******************** Policy Schema
   * ************************************************** */

  /**
   */
  var Policy = new Schema({
    module_config: { type: ObjectId, ref: "ModuleConfig" },
    module_meta: { type: ObjectId, ref: "ModuleMeta" },
    device_data: { type: ObjectId, ref: "DeviceData" },
    usage_and_error_counts: { type: ObjectId, ref: "UsageAndErrorCounts" },
    functional_groupings: { type: ObjectId, ref: "functionalGroupings" },
    base: { type: ObjectId, ref: "Base" }
  });


  



  /**
   * Information about the module itself.
   */
  var ModuleMeta = new Schema({

      // Software version of the module.
      ccpu_version: { type: String, default: "4.1.2.B_EB355B" },

      // ISO 639-1 combined with ISO 3166 alpha-2 country code
      language: { type: String, default: "en-us" },

      // Country code from the Ford system WERS
      wers_country_code: { type: String, default: "WAEGB" },
      
      // Marks the odometer reading (in kilometers) at the time of the last successful policy table exchange.
      pt_exchanged_at_odometer_x: { type: Number, default: 1903 },
      
      // Marks the time of the last successful policy table exchange
      pt_exchanged_x_days_after_epoch: { type: Number, default: 46684 },
      
      // Number of ignition cycles since last policy table exchange
      ignition_cycles_since_last_exchange: { type: Number, default: 50 },
      
      // Vehicle identification number
      vin: { type: String, default: "1FAPP6242VH100001" }
  });


  var DeviceData = new Schema({

    // Unique identifier for the phone or connected device.
    id: { type: String },

    // Device hardware identifier, such as iPhone 4 ?
    hardware: { type: String },

    // Firmware release version.
    firmware_rev: { type: String },

    // Operating System
    os: { type: String },

    // Operating System version
    os_version: { type: String },
    
    // Cellular data plan carrier or provider.
    carrier: { type: String },

    // Hardware limit for how many apps can run at one time via bluetooth.
    max_number_rfcom_ports: { type: String },

    //
    user_consent_records: { type: Object }
    /*{
      "device": {
        "consent_groups": {
        "DataConsent-1": true
      },
        "input": "GUI",
        "time_stamp": "4/11/2012 6:57:00 AM"
      }
    } */
  });

  var UsageAndErrorCounts = new Schema({

    // 
    count_of_iap_buffer_full: { type: Number, default: 0 },
    count_of_sync_reboots: { type: Number, default: 0 },
    count_sync_out_of_memory: { type: Number, default: 0 },
    app_level: [ type: ObjectId ],
  });

  var AppLevel = new Schema({
    id: { type: String },
    app_registration_language_gui: { type: String },
    app_registration_language_vui: { type: String },
    count_of_rejected_rpcs_calls: { type: Number, default: 0 },
    count_of_rejections_nickname_mismatch: { type: Number, default: 0 },
    count_of_rejections_sync_out_of_memory: { type: Number, default: 0 },
    count_of_removals_for_bad_behavior: { type: Number, default: 0 },
    count_of_rfcom_limit_reached: { type: Number, default: 0 },
    count_of_rpcs_sent_in_hmi_none: { type: Number, default: 0 },
    count_of_run_attempts_while_revoked: { type: Number, default: 0 },
    count_of_user_selections: { type: Number, default: 0 },
    minutes_in_hmi_background: { type: Number, default: 0 },
    minutes_in_hmi_full: { type: Number, default: 0 },
    minutes_in_hmi_limited: { type: Number, default: 0 },
    minutes_in_hmi_none: { type: Number, default: 0 }
  });


  /* ************************************************** *
   * ******************** Policy Methods
   * ************************************************** */

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

  UsageAndErrorCounts.methods.format = function(type) {
    var obj = this.toObject();
    type = (type) ? type : TYPE_SDL;
    switch(type) {
      case TYPE_SDL:
        obj["app_level"] = mapArrayToObject(obj["app_level"], "id");
        break;
    }
    return obj;
  }

  ModuleConfig.methods.format = function(type) {
    switch(type) {
      case TYPE_SDL_V2:
        var obj = this.toObject();
        // Convert notifications propterty keys into uppercase, lowercase, and all kinds of cases, why? because dumb.
        obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "emergency", "EMERGENCY");
        obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "navigation", "NAVIGATION");
        obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "voiceCommunication", "voiceCommunication");
        obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "communication", "COMMUNICATION");
        obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "normal", "NORMAL");
        obj["notifications_per_minute_by_priority"] = changeKeyName(obj["notifications_per_minute_by_priority"], "none", "NONE");
        
        // Move vehicle data into root object.
        obj["vehicle_make"] = obj["vehicle"]["make"];
        obj["vehicle_model"] = obj["vehicle"]["model"];
        obj["vehicle_year"] = obj["vehicle"]["year"];
        delete obj["vehicle"];

        // Set the seconds between retrys from number of retries.
        obj["seconds_between_retries"] = [];
        var backoffSeconds;
        for(var i = 0; i <= obj["num_update_retries"] && i < 6; i++) {
           backoffSeconds = (2^i)-1;
          if(backoffSeconds > 720) {
            backoffSeconds = 720;
          }
          obj["seconds_between_retries"].push(backoffSeconds);
        }
        delete obj["num_update_retries"];
        return obj;

      default: // Default to SADL
      case TYPE_SADL:
        return this;
    }
  }

  var changeKeyName = function(obj, oldKey, newKey, next) {
    // If the object contains a value for the old key.
    if(obj.hasOwnProperty(oldKey)) {
      
      // Save the value to the new property location
      obj[newKey] = obj[oldKey];
      
      // Remove the old property.
      delete obj[oldKey];
    }

    if(next) {
      next(undefined, obj);
    } else {
      obj;
    }
  }

  var moveProperty = function(property, 

  var changeKeyName = function(obj, oldKey, newKey) {
    if( ! obj[oldKey]) {
      return obj;
    }

    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
    return obj;
  }

  var mapArrayToObject = function(array, keyProperty) {
    keyProperty = (keyProperty) ? keyProperty : "_id";
    var obj = {};
    for(var i = array.length()-1; i >=0; --i) {
      obj[array[i][keyProperty]] = array[i];
      delete obj[array[i][keyProperty]][keyProperty];
    }
    return obj;
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
  Policy.methods.sanitize = function() {
    return this;
  }

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
  Policy.plugin(model.crudPlugin);

  ModuleConfig.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('Policy', Policy);
  db.model('ModuleConfig', ModuleConfig);
  db.model('AppLevel', AppLevel);
  db.model('UsageAndErrorCounts', UsageAndErrorCounts);


};