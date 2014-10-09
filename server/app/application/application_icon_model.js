// ~> Model
// ~A Scott Smereka

/* Application Icon
 * Handles storing icons for applications based on the 
 * phone OS and the vehicle's hardware.
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    model    = fox.model;


module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Local Variables
   * ************************************************** */

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;        // Object ID used in mongoose schemas


  /* ************************************************** *
   * ******************** Schemas
   * ************************************************** */

  /**
   * Describes an application icon that can be specific
   * to an application, operating system, and/or vehicle.
   */
  var ApplicationIcon = new Schema({
    app: { type: ObjectId, ref: "Application"},
    device: { type: ObjectId, ref: "" },
    url: { type: String }
  });


  /* ************************************************** *
   * ******************** Icon Methods
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
  ApplicationIcon.methods.sanitize = function() {
    return this;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  ApplicationIcon.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('ApplicationIcon', ApplicationIcon);

};