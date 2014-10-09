// ~> Model
// ~A Scott Smereka

/* Fading Key
 * Defines a key that can be used a limited number
 * of times before coming invalid.
 */

module.exports = function(app, db, config) {

  var fox         = require("foxjs"),
      model       = fox.model,
      Schema      = db.Schema,        // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;  // Object ID used in mongoose schemas

  /**
   * Keys that can be 
   */
  var FadingKey = new Schema({
    key:         { type: String, unique: true, required: true },
    usedCount:   { type: Number, default: 0 },
    maxUse:      { type: Number, default: 1},
    dateCreated: { type: Date, default: Date.now }
  });

  FadingKey.methods.use = function(next) {
    var key = this;
    key.usedCount++;
    key.save();
  }

  FadingKey.methods.valid = function() {
    var key = this;
    return (key.usedCount < key.maxUse);
  }


  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  FadingKey.plugin(model.crudPlugin);

  db.model('FadingKey', FadingKey);           // Set the user role schema.
};