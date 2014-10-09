// ~> Model
// ~A Scott Smereka

/* Consumer Friendly Messages
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    _        = require("underscore"),
		async    = require("async"),
    model    = fox.model;


module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Functional Group Variables
   * ************************************************** */

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;        // Object ID used in mongoose schemas


  /* ************************************************** *
   * ******************** Functional Group Schema
   * ************************************************** */

  /**
   */
  var ConsumerFriendlyMessage = new Schema({
    name: { type: String },
    description: { type: String },
    version: { type: String },
    messages: [{ type: ObjectId, ref: "MessageType" }]
  });


  /* ************************************************** *
   * ******************** Functional Group Methods
   * ************************************************** */

	ConsumerFriendlyMessage.methods.format = function() {
		var obj = {
			version: (this.version) ? this.version : "",
			messages: {}
		};

		if(this.messages !== undefined) {
			for(var i = this.messages.length-1; i >=0; --i) {
				var key = (this.messages[i].key) ? this.messages[i].key : "";
				obj.messages[key] = this.messages[i].format();

				if(obj.messages[key] === undefined || ! _.isObject(obj.messages[key])) {
					obj.messages[key] = { "languages": {}};
				}
			}
		}

		return obj;
	};

	ConsumerFriendlyMessage.methods.copy = function(obj, next) {
		var MessageType = db.model('MessageType');
		var Cfm = db.model('ConsumerFriendlyMessage');

		var cfmCopy = new Cfm({
			"name": (obj !== undefined && obj.name !== undefined) ? obj.name : this.name,
			"description": (obj !== undefined && obj.description !== undefined) ? obj.description : this.description,
			"version": (obj !== undefined && obj.version !== undefined) ? obj.version : this.version,
			"messages": []
		});

		Cfm.populate(this, { path: "messages" }, function(err, originalCfm) {
			if(originalCfm.messages !== undefined) {
				for(var i = originalCfm.messages.length; i >= 0; --i) {
					if(originalCfm.messages[i] !== undefined) {
						var msg = new MessageType(originalCfm.messages[i]);
						cfmCopy.messages.push(msg._id);
						msg.save();
					}
				}
			}

			cfmCopy.save();
			next(undefined, cfmCopy);
		});
	};

	var deleteMessageTypeByIdMethod = function(messageTypeId) {
		var MessageType = db.model("MessageType");
		return function(cb) {
			MessageType.findOne({ "_id": messageTypeId }, function(err, messageType) {
				if(err) {
					cb(err);
				} else if(messageType === undefined || messageType === null) {
					cb();
				} else {
					messageType.remove(function(err) {
						if(err) {
							cb(err);
						} else {
							cb();
						}
					});
				}
			});
		};
	};

	ConsumerFriendlyMessage.methods.deleteMessageTypeByIdMethod = deleteMessageTypeByIdMethod;

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
  ConsumerFriendlyMessage.methods.sanitize = function() {
    return this;
  }

  ConsumerFriendlyMessage.methods.update = function(newObj, userId, next) {
    if( ! newObj) {
      return next(sender.createError("Cannot update functional group because update object is invalid."));
    }

    var value;

    for(var key in newObj) {
      value = undefined;
      switch(key) {
        case 'description':
        case 'name':
        case 'version':
          if(_.isString(newObj[key])) {
            value = newObj[key];
          }
          break;
        case 'messages':
          value = newObj[key];
          break;
        default:
          break;
      }

      // If the value was valid, then update the object.
      if(value !== undefined) {
        this[key] = value;
      }
    }

    this.save(function(err, functionGroup) {
      return next(err, functionGroup);
    });
  }

	ConsumerFriendlyMessage.methods.delete = function(userId, next) {
		var cfm = this;

		// Cascade delete message types.
		if(cfm && cfm.messages && cfm.messages.length > 0) {

			var methods = [];

			for (var i = cfm.messages.length - 1; i >= 0; --i) {
				methods.push(deleteMessageTypeByIdMethod(cfm.messages[i]));
			}

			// Execute the tasks in parallel
			async.parallel(methods, function (err, results) {
				if(err) {
					next(err);
				} else {
					cfm.remove(function (err) {
						next(err);
					});
				}
			});
		} else {
			cfm.remove(function(err) {
				next(err);
			});
		}
	};


  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  ConsumerFriendlyMessage.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('ConsumerFriendlyMessage', ConsumerFriendlyMessage);

};