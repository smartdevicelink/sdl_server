// ~> Model
// ~A Scott Smereka

/* Phone
 * Handles all data related to an phone that can
 * connect to one of the supported car head units.
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
   * Describes an phone that can connect to a 
   * vehicles head unit.
   */
  var Phone = new Schema({

    // Android based properties.
    android: {

      deviceId: { type: String },

      isAndroid: { type: Boolean, default: false },

      serialId: { type: String }
    },

    bluetoothMacAddress: { type: String },

    carrior: { type: String },

    firmwareVersion: { type: String },

    // iOS based properties
    ios: {
      isIos: { type: Boolean, default: false },
      vendorId: { type: String }
    },

    // When this application object was last updated.
    lastUpdated: { type: Date, default: Date.now },

    // Who was the last to make changes to this application object.
    lastUpdatedBy: { type: ObjectId, ref: "User" },

    name: { type: String },

    phoneNumber: { type: String },

    rfcomPorts: { type: Number, default: 10 },

    softwareVersion: { type: String },

    usbSerial: { type: String },

    userConsents: [{ type: ObjectId, ref: "UserConsent" }],

    vehicles: [{ type: ObjectId, ref: "Vehicle" }]

  });


  /* ************************************************** *
   * ******************** Phone Methods
   * ************************************************** */


  /* ************************************************** *
   * ******************** Phone Events
   * ************************************************** */

  //Phone.pre('save', function(next) {
  //  return next();
  //});


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
  Phone.methods.sanitize = function() {
    return this;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  Phone.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('Phone', Phone);

};