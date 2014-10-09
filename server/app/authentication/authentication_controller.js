// ~> Controller

/**
 * Authentication Controller
 * Handles all routes related to authentication.
 * For example:  Login, logout, password recovery, etc.
 */

/* ************************************************** *
 * ******************** Load Modules
 * ************************************************** */

var passport         = require("passport"),                       // Used for authentication
    sanitize         = require('sanitize-it'),                    // Used to sanitize data into something predictable.  For example a value of 'null' or 'undefined' both equal undefined.
    LocalStrategy    = require('passport-local').Strategy;        // Authentication strategy of username and password used by passport module.

module.exports = function(app, db, config) {


  /* ************************************************** *
   * ******************** Load libraries and Models
   * ************************************************** */

  var fox      = require("foxjs"),
      log      = fox.log,
      sender   = fox.send,
      request  = fox.request,
      debug    = config.debug;
      url      = require("url"),
      User     = db.model('User'),
      UserRole = db.model('UserRole');   
      
  // Route(s) to require username and password parameters
  // and move them into the body.
  var requireUsernameAndPassword = [
    request.joinAndRequireParameters({
      username: "",
      password: ""
    })
  ]
 

  /* ************************************************** *
   * ******************** Define Routes
   * ************************************************** */

  // Get the current authentication status.
  app.get('/login/status.:format', isLoggedIn);

  // Login to a session using username and password.
  app.post('/login.:format', requireUsernameAndPassword, login);

  // Logout of the current session.
  app.post('/logout.:format', logout);

  // Get the user that is logged in
  app.get('/login/user.:format', getUser);

  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  /**
   * Log a user out and terminate their session.
   */
  function logout(req, res, next) {
    if(! req.isAuthenticated()) {
      return next(sender.createError("User is already logged out.", 400));
    }
    req.logout();
    sender.setResponse(sender.createSuccessObject(), req, res, next);
  }

  /**
   * Login a user and create their session, or throw an error if login
   * was unsuccessful.
   */
  function login(req, res, next) {
    // Check if the user is already logged in.
    if(req.isAuthenticated()) {
      return next(sender.createError("User is already logged in.", 400));
    }


    // If the user is not logged in, authenticate them using the local (username and password) authentication strategy.
    passport.authenticate('local', function(err, user, user_error) {
      if(err) {
        return next(err);
      } 

      // If authentication was not successful, send the info back in the response.
      if ( ! user || user_error) {
        return next(user_error);
      }

      // If authentication was successful, log in the user and notify the requester.
      req.logIn(user, function(err) {
        if(err) {
          return next(err);
        }

        return sender.setResponse(user, req, res, next);
      });
    })(req, res, next);
  }

  /**
   * Returns if a user is logged in or not.
   */
  function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
      return sender.setResponse(sender.createSuccessObject(), req, res, next);
    } else {
      return sender.setResponse(sender.createSuccessObject(false), req, res, next);
    }
  }

  /**
   * Returns a potential logged in user
   */
  function getUser(req, res, next) {
    if(req.isAuthenticated()) {
      req.user = req.user.sanitize();
      return sender.setResponse(req.user, req, res, next);
    } else {
      return sender.setResponse({}, req, res, next);;
    }
  }


  /* ************************************************** *
   * ******************** Passport Methods
   * ************************************************** */

  /**
   * Passport method to get the user ID from the user object.
   */
  var serializeUser = function(user, next) {
    return next(null, user._id);
  }

  /**
   * Passport method to find a user in the database 
   * given their user ID.
   */
  var deserializeUser = function(userId, next) {
    User.findById(userId).populate('roles').exec(function(err, user) {
      next(err, user);
    });
  }

  /**
   * Authenticate a user by username and password.  Returns the authenticated
   * user or an error.  Also handles any logic around logging in a user.
   */
  var usernameAndPasswordAuth = function (username, password, next) {
    if(sanitize.value(username) === undefined) {
        log.e("Username cannot be undefined", debug);
        return next(null, false, sender.createError('Please enter an email address.', 400));
    }
    
    if(sanitize.value(password) === undefined) {
        log.e("Password cannot be undefined", debug);
        return next(null, false, sender.createError('Please enter a password.', 400));
    }

    User.findOne({email: username}).populate('roles').exec(function(err, user) {
        if(err) {
          next(err, false, err);
        } else if(!user) {      
            log.e("Login attempt failed:  username is invalid.", debug);                                                      // If the username does not match a user in the database, report an error.
            next(null, false, sender.createError('Username or password is invalid.', 403));
            //user.failedLoginAttempt();
        } else if(!user.authenticate(password)) {                                 // If the password does not match the found user, report an error.
            log.e("Login attempt failed: "+user.email+" password is invalid.", debug);
            next(null, false, sender.createError('Username or password is invalid.', 403));
            user.failedLoginAttempt();        
        } else if(user.activated === false) {                                         // If the user is not activated, report an error.
            log.e("Login attempt failed:  user is not activated.", debug);
            next(null, false, sender.createError(user.deactivatedMessage, 403));
        } else {                                                                      // Otherwise, the username and password are valid, let the user login.
            
            //TODO: Limit what is shown here, remove password hash and stuff.
            next(null, user.sanitize());  
            user.successfulLogin();
        }
    });
  }


  /* ************************************************** *
   * ******************** Passport Configuration
   * ************************************************** */
  
  /* Local Strategy
   * Configures passport to authenticate a user by username & password.
   */
  passport.use(new LocalStrategy(usernameAndPasswordAuth));

  /* Passport Serialize User
   */
  passport.serializeUser(serializeUser);

  /* Passport DeserializeUser
   * Defines how passport will get the user from the database.
   */
  passport.deserializeUser(deserializeUser);

};