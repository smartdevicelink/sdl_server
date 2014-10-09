// ~> Model
// ~A Scott Smereka

/* Usage Report
 * Handles storing usage statistics and information about
 * SDL and how it is used.
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
  var UsageReport = new Schema({

    // Application the usage report is associated with.
    application: { type: ObjectId, ref: "Application"},

    // Snapshot or report of data from a specific point in time.
    reports: [{
      // Additional Key/value pairs can be placed here dynamically.

      // Snapshot of the current module settings.
      moduleSnapshot: {},

      // Date and time of snapshot.
      time: { type: Date, default: Date.now }
    }],
    
    // Vehicle and module being reported.
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
  UsageReport.methods.sanitize = function() {
    return this;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  UsageReport.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('UsageReport', UsageReport);

};