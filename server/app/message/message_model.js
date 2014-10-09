// ~> Model
// ~A Chris Rokita
// ~C Scott Smereka

/* Message
 * Handles storing data to track a request and response 
 * exchange between a client and the server.
 */


module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Module Variables
   * ************************************************** */
  
  var fox         = require("foxjs"),
      sender      = fox.send,
      model       = fox.model,
      Schema      = db.Schema,        // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId;  // Object ID used in mongoose schemas


  /* ************************************************** *
   * ******************** Module Schema
   * ************************************************** */

  /**
   * Describes a request and response exchange.
   */
  var Message = new Schema({

    // Describes a callers request.
    request: {

      // Message body.
      body: Object,
      
      // Headers provided in the request.
      headers: Object,

      // Ip address of the caller.
      ip: String,

      // Post method, such as Get, Put, Post, or Delete
      method: String,

      // Message url parameters
      params: Array,

      // HTTP Protocol, so http or https.
      protocol: String,

      // Message url query parameters
      query: Object,

      // Date and time of the request.
      time: { type: Date, default: Date.now },

      // The request's full url.
      url: String
    },

    // Describes the response message sent back to the requestor.
    response: {
      // Contains an error object if an error occurred during the request.
      // Error stores an object with a property denoted by the errorType.
      error: Object,

      // Variable type of the error, such as Array, Object, or String.
      errorType: String,
      
      // The response result object stores an object with a property denoted by the responseType.
      response: Object,

      // Variable type of the response result, such as Array, Object, String, etc.
      responseType: String,
      
      // Status message containing the HTTP status code and possibly a message.
      status: String
    }
  });
  

  /* ************************************************** *
   * ******************** Message Methods
   * ************************************************** */

  /**
   * Update the message's response with the current values
   * found in the express response object.  This assumes 
   * we are using the fox send module.
   */
  Message.methods.populateResponse = function(res) {
    // Cannot populate the response from an undefined
    // response object.
    if(sender.getResponse(res) === undefined) {
      log.debug("Cannot populate the message response with an undefined response object.");
      return undefined;
    }

    // Temp object to store our response object as we build it.
    var obj;

    // Load the current response object or create a new one.
    var response = (this.response) ? this.response : {};

    // Get the response that would be sent to the user.
    if(sender.isResponseSent(res)) {
      
      // If the response has already been sent, then we can just grab it.
      obj = sender.getResponse(res);
    } else {
      
      // If the response hasn't been sent, then we should create it.
      obj = sender.createResponseObject(undefined, sender.getResponse(res));
    }

    // Set the error and error type, if they are there.
    if(obj.errorType) {
      response.errorType = obj.errorType;
      if(obj.error) {
        response.error = {};
        response.error[obj.errorType] = obj.error;
      }
    }

    // Set the status.
    if(obj.status) {
      response.status = obj.status;
    }

    // Set the response type and response, if they are there.
    if(obj.responseType) {
      response.responseType = obj.responseType;
      if(obj.response) {
        response.response = {};
        response.response[obj.responseType] = obj.response;
      }
    }

    // Finally, set our response object and return.
    this.response = response;
    return this.response;
  }
  
  /**
   * Update the message's request with the current values
   * found in the express request object.
   */
  Message.methods.populateRequest = function(req) {
    if( ! req) {
      return;
    }

    var obj = (this.request) ? this.request : {};

    // Body
    if(req.body) {
      obj["body"] = req.body;
    }

    // Headers
    if(req.headers) {
      obj["headers"] = req.headers;
    }

    // IP address.
    if(req.ip) {
      obj["ip"] = req.ip;
    }

    // Request Method (Get, Put, Post, Delete);
    if(req.method) {
      obj["method"] = req.method;
    }

    // Parameters
    if(req.params) {
      obj["params"] = req.params;
    }

    // Transfer Protocol
    if(req.protocol) {
      obj["protocol"] = req.protocol;
    }

    // Query
    if(req.query) {
      obj["query"] = req.query;
    }

    // Time of request.
    if(req._startTime) {
      obj["time"] = new Date(req._startTime);
    }

    // Url
    if(req.url) {
      obj["url"] = req.url;
    }

    this["request"] = obj;
    return this.request;
  }


  /**
   * Format the message object so that it can be viewed or
   * returned to the requestor in the proper format.  This 
   * is necessary because the response cannot be stored 
   * in its original form.
   */
  Message.methods.format = function(next) {
    var err, 
        obj = this.toObject();

    // Format the response for a requestor.
    if(obj["response"] !== undefined) {
      if(obj["responseType"] !== undefined && obj.response[obj.responseType] !== undefined) {
        obj.response = obj.response[obj.responseType];
      } else {
        err = new Error("Response message cannot be formatted for the client if the responseType and response properties are not properly stored.");
      }
    }

    // Format the error for a requestor.
    if(obj["error"] !== undefined) {
      if(obj["errorType"] !== undefined && obj.error[obj.errorType] !== undefined) {
        obj.error = obj.error[obj.errorType];
      } else {
        err = new Error("Error message cannot be formatted for the client if the errorType and error properties are not properly stored.");
      }
    }

    if(next) {
      next(err, obj);
    } else {
      if(err) {
        log.error(err);
      }
      return obj;
    }
  }


  /* ************************************************** *
   * ******************** Message Event Methods
   * ************************************************** */

  /**
   * Called before an object has been saved.
   */
  Message.pre('save', function(next) {
    var msg = this;

    return next();
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
  Message.methods.sanitize = function() {

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
  Message.plugin(model.crudPlugin);

  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('Message', Message);
}