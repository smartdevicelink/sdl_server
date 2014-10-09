// ~> Controller
// ~A Scott Smereka

module.exports = function(app, db, config) {
  
  var fox    = require('foxjs'),
      sender = fox.send,
      auth   = fox.authentication,
      model  = fox.model,
      User   = db.model('User'),                                    // Pull in the user schema
      auth        = fox.authentication,    // Fox methods for controlling access to routes and data.
      accessToken = fox.accessToken;       // Fox methods for authorizing users based on access tokens.

  /* ************************************************** *
   * ******************** Routes and Permissions
   * ************************************************** */

  // Load user roles used for authentication.
  var adminRole = auth.queryRoleByName("admin"),
      selfRole  = auth.queryRoleByName("self");

  var allowAdmin = [                                   // Authenticate a call allowing only the super admin or higher roles.
    accessToken.allow,
    auth.allowRolesOrHigher([adminRole])
  ];

  app.get('/users.:format', users);                          // Get all users.
  app.get('/users/:userId.:format', user);                 // Get a specific user.
  app.post('/users/:userId/clearFailedLoginAttempts.:format', allowAdmin, clearFailedLoginAttempts);

  


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  /* User
   * Get and return the user object specified by their Object ID,
   * name, or index.
   */
  function user(req, res, next) {
    User.findOne({_id:req.params.userId}).populate('roles').exec(function(err, user){
      if(err) return next(err);
      else if(!user) return next(new Error('Invalid user requested'));
      user = user.sanitize();
      sender.setResponse(user, req, res, next);
    })
  }

  /* Users
   * Get all the users and return them in the requested format.
   */
  function users(req, res, next) {
    User.find().populate('roles').sort('index').exec(function(err, userRoles) {    // Find all the user roles and sort them by their permission level.
      if(err) return next(err);

      for(index in userRoles){
        userRoles[index] = userRoles[index].sanitize();
      }

      sender.setResponse(userRoles, req, res, next);
    });
  }


  /**
   *
   */
  function clearFailedLoginAttempts(req, res, next) {
    User.findOne({_id:req.params.userId}).populate('roles').exec(function(err, user){
      if(err) return next(err);
      else if(!user) return next(new Error('Invalid user requested'));
      user.clearFailedLoginAttempts(function(err) {
        if(err) return next(err);

        sender.setResponse(user, req, res, next);
      });
    });
  }

};