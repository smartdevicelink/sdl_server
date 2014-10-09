// ~> Model
// ~A Scott Smereka

/* Access Token Model
 * Describes a token that can be issued or used 
 * for a limited amount of time to authenticate 
 * a request on behalf of a user.
 */

/* ************************************************** *
 * ******************** Load Libraries
 * ************************************************** */

var fox      = require("foxjs"),
    crypto   = fox.crypto,
    date     = fox.date,
    log      = fox.log,
    model    = fox.model,
    sanitize = require('sanitize-it');


module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Module Variables
   * ************************************************** */

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId,        // Object ID used in mongoose schemas
      saltRounds  = 10,                     // Number of rounds used for hashing.
      tokenLife   = 10;                     // Number of days a token is valid for.


  /* ************************************************** *
   * ******************** Schema Default Methods
   * ************************************************** */

  /**
   * Set the default expiration date for an access token
   * schema object.
   */
  var setExpDate = function() {
    var now = new Date();
    return now.setDate(now.getDate() + tokenLife);
  }

  /**
   * Generate an access token synchronously.
   */
  var generateToken = function() {
    return crypto.generateKeySync(24);
  }


  /* ************************************************** *
   * ******************** Access Token Schema
   * ************************************************** */

  /**
   * Defines an access token used to authenticate a requestor
   * on behalf of a user.
   */
  var AccessToken = new Schema({
    
    // When true, allows the access token to be authenticated on behalf of the user.
    activated:      {  type: Boolean, default: false  },            
    
    // Date and time the token was created.
    creationDate:   {  type: Date, default: Date.now  },  

    // Date and time the token will expire.          
    expirationDate: {  type: Date, default: setExpDate  },   

    // When this object was last updated by a user.
    lastUpdated:    {  type: Date, default: Date.now  },

    // Who last updated this object.
    lastUpdatedBy:  {  type: ObjectId, ref: 'User'  },

    // Maximum number of times the access token can be used.  A negative value indicates no limit.    
    maxUsage:       {  type: Number, default: -1  },  

    // Access token used to authenticate a user without a session.
    token:          {  type: String, unique: true, default: generateToken  }, 

    // Number of times the api token has been used.
    usage:          { type: Number, default: 0 }, 

    // User the token is linked to.
    user:           { type: ObjectId, ref: 'User', unique: true } 
  });


  /* ************************************************** *
   * ******************** Access Token Methods
   * ************************************************** */

  /**
   * Checks if the access token is valid and returns true
   * or false.  This can be used synchronously or 
   * asynchronously by passing in a next parameter.
   */
  AccessToken.methods.authenticate = function(next) {
    var now = new Date();

    // Check if token is activated
    if( ! this.activated) {
      var err = new Error("Token is not activated.");
      err.status = 403;
      if(next) {
        return next(err, false);
      }
      log.e(err, debug);
      return false;
    }

    // Expiration date must be later than now.
    if(date.diff(this.expirationDate, now) <= 0) {
      var err = new Error("Token is expired.");
      err.status = 403;
      if(next) {
        return next(err, false);
      }
      log.e(err, debug);
      return false;
    }

    // If max usage is enabled, current usage must be less than our max usage.
    if(this.maxUsage > 0 && this.usage >= this.maxUsage) {
      var err = new Error("Token has exceeded its usage limit.");
      err.status = 403;
      if(next) {
        return next(err, false);
      }
      log.e(err, debug);
      return false;
    }

    // Creation date must be prior to right now.
    if(date.diff(now, this.creationDate) < 0) {
      var err = new Error("Token creation date is invalid.");
      err.status = 403;
      if(next) {
        return next(err, false);
      }
      log.e(err, debug);
      return false;
    }

    if(next) {
      return next(undefined, true);
    }

    return true;
  }

  /**
   * Checks if the token parameter matches the stored 
   * access token.  Returns true if it matches and
   * false otherwise.
   */
  AccessToken.methods.isToken = function(token) {
    return (token === this.token);
  }

  /**
   * Generate a new access token and clear all tracking 
   * stats for the old access token.
   */
  AccessToken.methods.refreshToken = function(next) {
    var now = new Date();
    this.token = generateToken();
    this.creationDate = now;
    this.expirationDate = setExpDate(); 
    this.usage = 0;
    if(next) {
      this.save(next);
    } else {
      this.save(function(err, token) {
        if(err) log.e(err);
        if(! token) log.e(new Error("There was a problem saving the refreshed token"));
      });
    }
  }

  /**
   * Handle tracking a successful login using an access token.
   */
  AccessToken.methods.successfulLogin = function(next) {
    var obj = {};
    obj["usage"] = this.usage + 1;
    this.update(obj, undefined, next);
  }


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
   * Remove the access token object from the database.
   */
  AccessToken.methods.delete = function(userId, next) {

    // Default method for deleting an object.
    model.remove(this, userId, next);
  }

  /**
   * Takes in an object parameter and updates the appropriate user fields.
   */
  AccessToken.methods.update = function(obj, userId, next) {
    var accessToken = this,
        isUpdated   = false;

    // Loop through each property in the new object.  
    // Verify each property and update the user object accordingly.
    for (var key in obj) {
      switch(key) {
        
        // Number Property Types
        case 'maxUsage':
        case 'usage':
          value = sanitize.number(obj[key]);
          break;

        // Object ID Property Types
        case 'user':
          value = sanitize.objectId(obj[key]);
          break;

        // Date Property Types
        case 'creationDate':
        case 'expirationDate':
          value = sanitize.date(obj[key]);
          break;

        // Boolean Property Types  
        case 'activated':
          value = sanitize.boolean(obj[key]);
          break;

        // Ignore these, the model update function will 
        // handle them for us.
        case 'lastUpdated':
        case 'lastUpdatedBy':
          break;

        // String Property Types, handled by default.
        default:
          value = sanitize.string(obj[key]);
          break;
      }

      // If the value was valid, then update the access token object.
      if(value !== undefined) {
        accessToken[key] = value;
        isUpdated = true 
      }
    }

    // Handle the lastUpdated and lastUpdatedBy attributes
    // then save the object.
    model.update(obj, accessToken, userId, isUpdated, next);
  }

  /**
   * Strip out secret information that should not be seen
   * outside of this server.  This should be called before
   * returning an access token object to a client.
   */
  AccessToken.methods.sanitize = function() {
    var User = db.model('User');
    var token = this;
    token = token.toObject();

    // Sanitize any possibly populated objects
    token.user = (sanitize.objectId(token.user)) ? token.user : new User(token.user).sanitize();

    delete token.__v;
    return token;
  }

  /* ************************************************** *
   * ******************** Plugins
   * ************************************************** */

  // Enable additional functionality through plugins
  // you have written or 3rd party plugins.

  // Add addition fields and methods to this schema to 
  // create, read, update, and delete schema objects.
  AccessToken.plugin(model.crudPlugin);


  /* ************************************************** *
   * ******************** Export Schema(s)
   * ************************************************** */

  db.model('AccessToken', AccessToken);

};