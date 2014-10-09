// ~> Model
// ~A Scott Smereka

/* Message Type
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
		_        = require("underscore"),
		model    = fox.model;


module.exports = function(app, db, config) {


	/* ************************************************** *
	 * ******************** Language Variables
	 * ************************************************** */

	var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
			ObjectId    = Schema.ObjectId;        // Object ID used in mongoose schemas


	/* ************************************************** *
	 * ******************** Language Schema
	 * ************************************************** */

	var Country = new Schema({
		country: { type: String },  // ISO-3166 Country Name
		code:    { type: String }   // ISO-3166 Country Code
	});

	var Language = new Schema({
		language: { type: String },  // ISO-639-1 Language Name
		iso6391:  { type: String },  // ISO-639-1 Language Code
		iso6392:  { type: String }   // ISO-639-1 Language Code
	});


	/* ************************************************** *
	 * ******************** Language Methods
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
	Language.methods.sanitize = function() {
		return this;
	};

	Country.methods.sanitize = function() {
		return this;
	};

	/* ************************************************** *
	 * ******************** Plugins
	 * ************************************************** */

	// Enable additional functionality through plugins
	// you have written or 3rd party plugins.

	// Add addition fields and methods to this schema to
	// create, read, update, and delete schema objects.
	Language.plugin(model.crudPlugin);

	Country.plugin(model.crudPlugin);


	/* ************************************************** *
	 * ******************** Export Schema(s)
	 * ************************************************** */

	db.model('Language', Language);
	db.model('Country', Country);

};