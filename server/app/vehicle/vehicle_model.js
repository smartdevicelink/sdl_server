// ~> Model
// ~A Chris Rokita
// ~C Scott Smereka

/* Vehicle
 * Describes and manages data about specific vehicles
 * that are using SDL.  This information is collected
 * for use with policies.
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    model    = fox.model,
    sender   = fox.send;


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
   * Describes a vehicle and its head unit.
   */
  var Vehicle = new Schema({
    // Vehicle manufacturer.
    make: { type: String },

    // Model of the vehicle
    model: { type: String },

    // Vehicle's head unit.
    module: { type: ObjectId, ref: "Module"},

    // Unique Vehicle Identification Number (VIN).
    vin: { type: String, unique: true, index: true },

    // Year vehicle was manufactured.
    year: { type: Number }

  });

  // Before saving create an empty module
  Vehicle.pre('save', function(next) {
    var vehicle = this;

    // If there is no module we need to create an empty one.
    if(!this.module) {
      var Module = db.model('Module');
      var newModule = new Module();
      newModule.save(function(err, module) {
        if(err) { return next(err); }

        vehicle.module = module._id;
        next();
      });
    } else {
      next();
    }
  });

  /* ************************************************** *
   * ******************** Policy Methods
   * ************************************************** */

/*
  Vehicle.methods.format = function(protocol, version, next) {
    next = (next) ? next : function(err, obj) { if(err) {console.log(err); } else { return obj}};

    var obj = this.toObject();

    // Remove schema properties.
    delete obj["_id"];
    delete obj["__v"];
    delete obj["module"];
    return next(undefined, obj);
  }
*/

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
  Vehicle.methods.sanitize = function() {

    //TODO: Sanitize the vehicle.
    
    return this;
  }


  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  Vehicle.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('Vehicle', Vehicle);

};