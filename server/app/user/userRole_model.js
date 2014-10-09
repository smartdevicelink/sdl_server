// ~> Model
// ~A Scott Smereka

/* User Role
 * Defines a permission level on the server.  Based on a 
 * user's role routes can be enabled or disabled for that 
 * user.
 */

module.exports = function(app, db, config) {

  var fox         = require("foxjs"),
      model       = fox.model,
      Schema      = db.Schema,        // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;  // Object ID used in mongoose schemas

  /* User Role Schema
   * Defines a role and permission level on the server.
   * Each role has a unique index value, a number from 0 to whatever.
   * The lower the number the more permissions available to the role.
   * A role of 0 is the highest most permissive role, however a role 
   * of -1 would be invalid.
   */
  var UserRole = new Schema({
    name:      { type: String, required: true, trim: true, unique: true },  // User friendly name for the role.
    queryName: { type: String, trim: true, unique: true},                   // A query friendly name for the role.
    index:     { type: Number, required: true, unique: true }               // A permission level from 0 to whatever.
  });

  UserRole.pre('save', function(next) {
    var role = this;

    // Automatically create a query name, if one does not exist.
    if(role.queryName === undefined) {
      role.queryName = role.name.toLowerCase().replace(/\s+/g, '');
    }

    // Ensure the index is a valid number from 0 to whatever.
    if(role.index < 0) {
      return next(new Error("Cannot save user role '"+ user.name+"' because the index is invalid."));
    }

    return next();
  });




  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  UserRole.plugin(model.crudPlugin);


  db.model('UserRole', UserRole);           // Set the user role schema.
};