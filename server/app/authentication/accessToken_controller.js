// ~> Controller
// ~A Scott Smereka

/* Access Token Controller
 * Handles logic related to performing operations
 * on access token schema objects as well as 
 * handing out new access tokens.
 */

module.exports = function(app, db, config) {
  

  /* ************************************************** *
   * ******************** Load Libraries and Models
   * ************************************************** */

  var fox         = require("foxjs"),            //
      sender      = fox.send,                    //
      auth        = fox.authentication,          //
      model       = fox.model,                   //
      accessToken = fox.accessToken;             //
      
  // Load database schemas
  var AccessToken = db.model('AccessToken'),     //
      User        = db.model('User');            //


  /* ************************************************** *
   * ******************** Routes and Permissions
   * ************************************************** */
  
  // CRUD routes are already enabled for access tokens.

  // Request an access token.
  app.post('/requestAccessToken.:format', requestAccessToken)
  
  
  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  /**
   * Request a new access token
   */
  function requestAccessToken(req, res, next) {

    // TODO: Implement how one requests an access token.
  }
  
};