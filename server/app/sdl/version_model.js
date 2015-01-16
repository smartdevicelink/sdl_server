// ~> Model
// ~A Scott Smereka

/* SDL Version
 * Handles keeping track of different versions of SDL.
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
   * Describes an SDL version.
   */
  var SdlVersion = new Schema({
    version: { type: String }
  });


  /* ************************************************** *
   * ******************** Sdl Version Methods
   * ************************************************** */


  SdlVersion.methods.findByString = function(versionString, cb) {
    if( ! cb) {
      return console.log("Error:  Callback is required.");
    }

    if(versionString === undefined || versionString === "" || versionString === null) {
      return new Error("Invalid version of " + versionString);
    }

    this.findOne({ version: versionString }, function(err, version) {
      if(err) {
        cb(err);
      } else if( ! version) {
        cb(new Error("Version " + versionString + " does not exist."));
      } else {
        cb(undefined, version);
      }
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
  SdlVersion.methods.sanitize = function() {
    return this;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  SdlVersion.plugin(model.crudPlugin);


  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('SdlVersion', SdlVersion);

};