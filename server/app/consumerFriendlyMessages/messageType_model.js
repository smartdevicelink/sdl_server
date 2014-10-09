// ~> Model
// ~A Scott Smereka

/* Message Type
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    _        = require("underscore"),
    model    = fox.model,
		util     = require('util');


module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Functional Group Variables
   * ************************************************** */

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;        // Object ID used in mongoose schemas


  /* ************************************************** *
   * ******************** Functional Group Schema
   * ************************************************** */

	var MessageType = new Schema({
		key: { type: String },
		description: { type: String },
		languages: [{
			enabled: { type: Boolean, default: false },
			key:     { type: String },
			tts:     { type: String },
			lines:   [{ type: String }]
		}]
	});


  /* ************************************************** *
   * ******************** Functional Group Methods
   * ************************************************** */

	MessageType.methods.format = function() {
		var obj = {
			languages: {}
		};

		if(this.languages !== undefined) {
			for(var i = this.languages.length-1; i >=0; --i) {
				if(this.languages[i].enabled) {
					var key = (this.languages[i].key) ? this.languages[i].key : "";
					obj.languages[key] = {
						"tts": (this.languages[i].tts) ? this.languages[i].tts : ""
					};
					if (this.languages[i].lines !== undefined) {
						for (var x = 0; x < this.languages[i].lines.length; x++) {
							obj.languages[key]["line" + (x + 1)] = this.languages[i].lines[x];
						}
					}

					// Ensure line1 and line2 are present.
					if (obj.languages[key]["line1"] === undefined) {
						obj.languages[key]["line1"] = "";
					}
					if (obj.languages[key]["line2"] === undefined) {
						obj.languages[key]["line2"] = "";
					}
				}
			}
		}

		return obj;
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
	MessageType.methods.sanitize = function() {
    return this;
  };

	MessageType.methods.update = function(obj, userId, next) {
		next = (next) ? next : function(err, messageType) { if(err) { log.e(err.message || err); } };

		if( ! obj) {
			return next(new Error('Can not update the MessageType object because the update values are not valid.'));
		}

		var value = undefined;

		for(var key in obj) {
			switch(key) {
				case "_id":
				case "__v":
					break;
				case "languages":
					if(_.isArray(obj[key])) {
						var languages = [];

						// Loop through each language object.
						for(var i = 0; i < obj[key].length; i++) {
							var languageObj = {};

							// Loop through each language property
							for(var languageKey in obj[key][i]) {
							  switch(languageKey) {
									case "_id":
									case "__v":
										break;

									case "enabled":
										if(_.isBoolean(obj[key][i][languageKey])) {
											languageObj.enabled = obj[key][i][languageKey];
										}
										break;

									case "lines":
										if(_.isArray(obj[key][i][languageKey])) {
											languageObj.lines = obj[key][i][languageKey];
										}
										break;

									default:
										if(_.isString(obj[key][i][languageKey])) {
											languageObj[languageKey] = obj[key][i][languageKey];
										}
										break;
								}
							}
							if(_.isObject(languageObj) && languageObj !== {}) {
								languages.push(languageObj);
							}
							languageObj = {};
						}

						if(languages && languages.length > 0) {
							value = languages;
						}
					}
					break;

				default:
					if(_.isString(obj[key])) {
						value = obj[key];
					}
					break;
			}

			// If the value was valid, then update the object.
			if(value !== undefined) {
				this[key] = value;
			}
			value = undefined;
		}

		this.save(function(err, messageType) {
			if(err) {
				return next(err);
			}

			if( ! messageType) {
				return next(new Error("There was a problem updating the message type object."));
			}

			if(! messageType && ! err) {
				var err = new Error('There was a problem saving the updated user object.');
			}

			return next(undefined, messageType);
		});
	};


  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to
  // create, read, update, and delete schema objects.
	MessageType.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('MessageType', MessageType);

};