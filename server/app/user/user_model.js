// ~> Model

var bcrypt      = require('bcrypt'),                                                // Include bcrypt for password hashing.
    validator   = require('validator'),
    check       = validator.check,
    sanitize    = require('sanitize-it');

module.exports = function(app, db, config) {

  var Schema      = db.Schema,              // Mongoose schema object for MongoDB documents.
      ObjectId    = Schema.ObjectId,        // Object ID used in mongoose schemas
      saltRounds  = 10;                     // Number of rounds used for hashing.

  // Load our hashing library.
  var fox   = require("foxjs");
      hash  = fox.crypto,
      log   = fox.log;

  var AccessToken;

  //var hash = require(config.paths.serverLibFolder + 'hash')(config),
    //  log  = require(config.paths.serverLibFolder + "log")();

  /* User Schema
   * Defines a user in the MongoDB table.
   */
  var User = new Schema({
    activated:           { type: Boolean, default: false },                            // Defines if the user should be allowed to do anything.  For example: login, update their information, etc.
    dateCreated:         { type: Date, default: Date.now },                            // Stores the date the user was created.
    deactivatedMessage:  { type: String, default: ""},                                 // A message about why the user account is deactivated.  This should be shown to the user if a login attempt is made while the account is deactivated.
    email:               { type: String, trim: true, lowercase: true, unique: true },  // Email address for the user, must be unique.  This is what the user will login with.
    failedLoginAttempts: { type: Number, default: 0 },                                 // Stores the number of failed login attempts since the last successful login.  Updating this value does not trigger the lastUpdated or lastUpdatedBy values to change.
    firstName:           { type: String, trim: true },                                 // User's first name.
    lastName:            { type: String, trim: true },                                 // User's last name.
    lastLogin:           { type: Date, default: Date.now },                            // Stores the last date and time the user logged in.  Updating this value does not trigger the lastUpdated or lastUpdatedBy values to change.
    lastUpdated:         { type: Date, default: Date.now },                            // When this user object was last updated.
    lastUpdatedBy:       { type: ObjectId, ref: 'User' },                              // Who was the last person to update this user object.
    passwordHash:        { type: String },                                             // A hash generated from the user's password.  Never store a plain text password.
    passwordReset:       { type: String, default: hash.generateHashedKeySync(24) },    // A hash generated to reset a user's password.  This should never be plain text.
    roles:               [{ type: ObjectId, ref: 'UserRole' }],                        // A list of roles the user is a part of.  Roles are used for authentication.
    securityQuestion:    { type: String },                                             // Challenge question given to a user when they try to reset their password.
    securityAnswerHash:  { type: String, default: hash.generateHashedKeySync(24) }     // User's correct answer to the challenge question when trying to reset their password.  This should never be stored as plain text.
  });

  /********************************************************/
  /**************** User Virtual Attributes ***************/

  /* Full Name
   * Returns the user's full name.
   */
  User.virtual('name').get(function() {
    return this.firstName + ((this.lastName) ? this.lastName : "");
  });

  /* Get Password
   * Returns the user's password hash.
   */
  User.virtual('password').get(function(){
    return this.passwordHash;
  });

  /* Set Password
   * Generates a hash from the string parameter
   * and sets it as the user's password.
   * Returns true if the password was set successfully.
   */
  User.virtual('password').set(function(password) {
    if(password === undefined || password === null || password === "")
      password = new ObjectId().toString();

    this.passwordHash = bcrypt.hashSync(password, saltRounds);             // Synchronous call to create a bcrypt salt & hash, then set that hash as the password.
    this.passwordReset = hash.generateKeySync(24);
    return true;
  });

  /* Get Security Answer
   * Returns the user's security answer hash.
   */
  User.virtual('securityAnswer').get(function(){
    return this.securityAnswerHash;
  });

  /* Set Security Answer
   * Hashes the parameter value and sets it as the user's security
   * answer.  If the parameter is undefined, then a unique answer
   * will be generated and encrypted for you.
   */
  User.virtual('securityAnswer').set(function(answer) {
    if(answer === undefined || answer === null || answer === "")
      answer = new ObjectId().toString();
    
    this.security_answer = bcrypt.hashSync(answer, saltRounds);                   // Synchronous call to create a bcrypt salt & hash, then set that hash as the password.
    return true;
  });

  User.virtual('accessToken').get(function(accessToken) {
    if( ! AccessToken) {
      if(db.model("AccessToken")) {
        AccessToken = db.model("AccessToken");
      } else {
        log.e("Cannot load access token model.", debug);
        return undefined;
      }
    }

    AccessToken.findOne({user: this._id}, function(err, accessToken) {
      if(err) {
        log.e(err, debug);
        return undefined;
      } 
      return accessToken.token;
    });

  });

  User.virtual('token').get(function(accessToken) {
    if( ! AccessToken) {
      if(db.model("AccessToken")) {
        AccessToken = db.model("AccessToken");
      } else {
        log.e("Cannot load access token model.", debug);
        return undefined;
      }
    }

    AccessToken.findOne({user: this._id}, function(err, accessToken) {
      if(err) {
        log.e(err, debug);
        return undefined;
      } else if( ! accessToken) {
        return undefined;
      }

      return accessToken.token;
    });

  });

  /********************************************************/
  /********************* User Methods *********************/


  User.methods.createAccessToken = function(obj, next) {
    if( ! AccessToken) {
      if(db.model("AccessToken")) {
        AccessToken = db.model("AccessToken");
      } else {
        var err = new Error("Cannot load access token model.");
        if(next) {
          return next(err)
        } 
        return log.e(err, debug);
      }
    }

    obj = (obj) ? obj : {};
    obj["user"] = this._id;
    
    var accessToken = new AccessToken(obj);
    accessToken.save(next);
  }

  /* Is Security Answer
   * Checks if the parameter matches the user's stored security answer.
   */
  User.methods.isSecurityAnswer = function(answer, next) {
    if(next)
      return bcrypt.compare(answer, this.securityAnswer, next);                     // Asynchronous call to compare the possible security answer to the encrypted security answer.
    return bcrypt.compareSync(answer, this.securityAnswer);                         // Synchronous call to compare the possible security answer to the encrypted security answer.
  }

  /* Authenticate User
   * Checks if the parameter passed is the user's password and
   * returns true if it is, false otherwise.
   */
  User.methods.authenticate = function(passwordString, next) {
    if(next)
      return bcrypt.compare(passwordString, this.password, next);                   // Asynchronous call to compare the password to the encrypted password.
    return bcrypt.compareSync(passwordString, this.passwordHash);                  // Synchronous call to compare the password to the encrypted password.
  };


  /* Delete User
   * Remove the user object from the database.
   */
  User.methods.delete = function(userId, next) {
    var user = this;

    user.remove(function(err, user) {
      if(err && next !== undefined) return next(err, undefined, false);

      if(next !== undefined)
        return next(undefined, user, true);
    });
  }

  /**
   * Log a failed loggin attempt.  After too many failed
   * login attempts, then deactivate the account. Also 
   * provides a message as to why the account was deactivated.
   */
  User.methods.failedLoginAttempt = function (next) {
    var user = this,
        obj  = {};
    obj.failedLoginAttempts = user.failedLoginAttempts + 1;

    // After too many failed logins, lock out the account.
    if(obj.failedLoginAttempts >= 5) {
      obj.activated = false;
      obj.deactivatedMessage = "Account has been deactivated due to too many unsuccessful login attempts.";
    }

    user.update(obj, undefined, next);
  }


  User.methods.clearFailedLoginAttempts = function(next) {
    var user = this, 
        obj = {};

    if(user.failedLoginAttempts >= 5) {
      obj.activated = true;
      obj.deactivatedMessage = "";
    }

    obj.failedLoginAttempts = 0;

    user.update(obj, undefined, next);
  }

  /**
   * Record and update a user for a successful login.
   * A successful login clears the fail login attempts counter.
   */
  User.methods.successfulLogin = function(next) {
    var user = this, 
        obj  = {};
    obj["lastLogin"] = Date.now();
    obj["failedLoginAttempts"] = 0;
    user.update(obj, undefined, next);
  }

  /**
   * Strip out secret information that should not be seen
   * outside of this server.  This should be called before
   * returning a user object to a client.
   */
  User.methods.sanitize = function() {
    var user = this;
    user = user.toObject();

    delete user.passwordHash;
    delete user.passwordReset;
    delete user.__v;
    delete user.securityAnswerHash;
    return user;
  }

  /* Update
   * Takes in an object parameter and updates the appropriate user fields.
   */
  User.methods.update = function(obj, userId, next) {
    if( ! obj) {
      var err = new Error('Can not update the user object because the parameter is not valid.')
      if(next !== undefined) {
        return next(err);
      }
      return log.e(err);
    }

    var user = this,
        isUserUpdated = false,
        isLastUpdated = false,
        isLastUpdatedBy = false,
        value = undefined;

    // Loop through each property in the new object.  Verify each property and update the user object accordingly.
    for (var key in obj) {
      switch(key) {
        
        // Number Property Types
        case 'failedLoginAttempts':
          value = sanitize.number(obj[key]);
          break;

        // Object ID Property Types
        case 'lastUpdatedBy':
          isLastUpdatedBy = true;
        case 'roles':
          value = sanitize.objectId(obj[key]);
          break;

        // Date Property Types
        case 'dateCreated':
        case 'lastLogin':
        case 'lastUpdated':
          isLastUpdated = true;
          value = sanitize.date(obj[key]);
          break;

        // Boolean Property Types  
        case 'activated':
          value = sanitize.boolean(obj[key]);
          break;

        // String Property Types, handled by default.
        default:
          value = sanitize.string(obj[key]);
          break;
      }

      // If the value was valid, then update the user object.
      if(value !== undefined) {
        
        // Trigger an update to the lastUpdated and lastUpdatedBy property if we are not tracking a login or login attempt.
        if(key !== "failedLoginAttempts" && key !== "lastLogin") {
          isUserUpdated = true
        }
        
        // Update the user property with the new value.
        user[key] = value;
      }
    }

    if( ! isLastUpdated && isUserUpdated) {
      user['lastUpdated'] = Date.now();
    }

    if( ! isLastUpdatedBy && isUserUpdated) {
      user['lastUpdatedBy'] = sanitize.objectId(userId);
    }

    user.save(function(err, user) {
      if(! user && ! err) {
        var err = new Error('There was a problem saving the updated user object.');
      }

      if(err) {
        if(next !== undefined) {
          return next(err);
        }
        return log.e(err);
      }

      if(next !== undefined)
        return next(undefined, user);
    });
  }


  /********************************************************/
  /********************** User Events *********************/

  /* Before Saving User
   * Executed before saving the object, checks to make sure
   * the schema object is valid.
   * Note:  This is executed after the schema model checks.
   */
  User.pre('save', function(next) {
    var user = this;

    if(sanitize.string(user.name) === undefined) {
      return next(new Error('Please enter a valid name.'));
    }

    if(sanitize.string(user.password) === undefined)
      return next(new Error('Please enter a password.'));

    try {
      check(this.email).len(6,64).isEmail();                                        // Check if string is a valid email.
    } catch (e) {
      return next(new Error('Please enter a valid email address.'));
    }

    return next();
  });

  /********************************************************/
  /****************** Export User Schemas *****************/

  db.model('User', User);                                                     // Set the user schema.
};