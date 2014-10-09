// ~> Model
// ~A Scott Smereka

/* Error Report
 * Handles storing errors and information about why 
 * they occurred.
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
   * ******************** Schemas
   * ************************************************** */

  /**
   * Describes an error, state of the devices involved,
   * and any other information about why the error occurred.
   */
  var ErrorReport = new Schema({
    application: { type: ObjectId, ref: "Application"},
    dateTime: { type: Date, default: Date.now },
    error: {
      code: { type: String },
      message: { type: String },
      logs: { type: String }
    },
    moduleSnapshot: { type: Object },
    phone: { type: ObjectId, ref: "Phone" },
    endUser: { type: ObjectId, ref: "EndUser"},
    vehicle: { type: ObjectId, ref: "Vehicle"},
  });


  /* ************************************************** *
   * ******************** Sdl Version Methods
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
  ErrorReport.methods.sanitize = function() {
    return this;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  ErrorReport.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('ErrorReport', ErrorReport);

};