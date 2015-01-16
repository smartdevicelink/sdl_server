// ~> Model
// ~A Scott Smereka

/* App
 * Handles all data related to an application that can
 * connect to one of the supported car head units.
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    model    = fox.model,
    fs       = require("fs"),
    path     = require("path");


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
   * Describes an application that can connect to a
   * vehicles head unit.
   */
  var Application = new Schema({

    // Flag to indicate an application as activated, a deactivated
    // app cannot communicate with a head unit or the server.
    activated: { type: Boolean, default:true },

    // Android based properties.
    android: {

      // Application store category
      category: { type: String},

      // Flag to indicate the application is available on Android.
      enabled: { type: Boolean, default: false },

      // Android package name.
      packageName: { type: String },

      // Android playstore URL.
      playStoreUrl: { type: String },

      // Highest version of SDL supported by the application on Android.
      sdlVersion: { type: String }
    },

    // Uniquely identifies the application, but can change at any
    // time allowing for more flexibility than the _id property.
    appId: { type: String, unique: true, default: db.Types.ObjectId },

    // Application category assigned by sdl.
    sdlCategory: { value:     { type: Number },
                   name:      { type: String },
                   queryName: { type: String } },

    // Company
    company: { type: ObjectId, ref: "Company" },

    // Description of the application.
    description: { type: String },

    // Flag to indicate if the application is in development mode.
    development: { type: Boolean, default: false },

    // Default application icon image url.
    iconUrl: { type: String },

    // iOS based properties
    ios: {

      // App store category.
      category: { type: String },

      // Flag to indicate the application is available on iOS
      enabled: { type: Boolean, default: false},

      // URL to application on the iTunes store
      itunesUrl: { type: String },

      // Highest version of SDL supported by the application on iOS.
      sdlVersion: { type: String },

      // iOS url scheme
      urlScheme: { type: String }
    },

    // When this application object was last updated.
    lastUpdated: { type: Date, default: Date.now },

    // Who was the last to make changes to this application object.
    lastUpdatedBy: { type: ObjectId, ref: "User" },



    // Name of the application
    name: { type: String },

    // When enabled, an application can only work with the specified
    // vehicle modules.
    whitelist: {

      // Enable or disable the whitelist.
      enabled: { type: Boolean, default: false},

      // List of vehicle modules this application is allowed to work with.
      list: [{ type: ObjectId, ref: "Module" }]
    }

  });


  /* ************************************************** *
   * ******************** Application Methods
   * ************************************************** */

  // Get a list of all the modules this application has
  // connected to.
  Application.methods.getConnectedModules = function(next) {

  }

  // Get a list of all the vehicles this application has
  // connected to.
  Application.methods.getConnectedVehicles = function(next) {

  }


  /* ************************************************** *
   * ******************** Application Events
   * ************************************************** */

  Application.pre('save', function(next) {
    var app = this;

    // remove old icon url from file system because it is no longer referenced.
    if(app.isModified('iconUrl') && app._oldIconToDelete && app._oldIconToDelete != config.paths.clientDefaultApplicationIcon) {
      var iconPath = path.join(config.paths.clientDirectory, app._oldIconToDelete);
      fs.unlink(iconPath, function(err) {
        if(err) return next(err);
        next();
      });
    }

    return next();
  });

  Application.path('iconUrl').set(function (newIconUrl) {
    // If the newicon does not equal the old icon and if the old icon is a web url. Then we need to clean up the old file.
    if(this.iconUrl && newIconUrl.toUpperCase() !== this.iconUrl.toUpperCase() && this.iconUrl.indexOf('http') !== 0) {
      this._oldIconToDelete = this.iconUrl;
    }

    return newIconUrl;
  });


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
  Application.methods.sanitize = function() {
    return this;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to
  // create, read, update, and delete schema objects.
  Application.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('Application', Application);

};
