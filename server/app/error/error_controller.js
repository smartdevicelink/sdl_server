// ~> Error
// ~A Scott Smereka

/* Error
 * Displays, sends, or otherwise handles all errors 
 * generated from previous routes.
 */

module.exports = function(app, db, config) {

  /* ************************************************** *
   * ******************** Module Variables
   * ************************************************** */

  var fox = require('foxjs'),
      sender = fox.send,
      log = fox.log,
      debug = config.server.debug,
      url = require('url');


  /* ************************************************** *
   * ******************** Routes
   * ************************************************** */

  // Handle errors from previous routes.
  app.all('/*', handleErrors);

  // Handle routes that were not yet handled.
  app.all('/*', handle404);


  /* ************************************************** *
   * ******************** Routes Methods
   * ************************************************** */

  /**
   * Handle any and all errors that occur during
   * a route by sending a properly formatted error
   * object to the caller.
   */
  function handleErrors(err, req, res, next) {
    // If there is not an error, move on.
    if( ! err) {
      next();
    }

    sender.sendError(err, req, res, next, debug);
  }

  /**
   * Send a 404 not found error message.
   * Place this method at the very end of the routes.
   */
  function handle404(req, res, next) {
    // If the request has already been handled, move on.
    if(req.isHandled) {
      console.log(req.method.toUpperCase() + " " +req.url);
      return next();
    }

    // Get the format of the url if available.
    var urlSplit = req.url.split('.');
    var format = (urlSplit.length > 1) ? urlSplit.pop() : undefined;

    // If this was a server request, send a 404.
    if(format && format !== "html") {
      if(debug) {
        console.log("Warning:  You requested a route '"+req.url+"' that does not exist or was not handled.  Ensure at least one route calls 'sender.setResponse(data, req, res, next);'");
      }
      sender.createAndSendError("Method or Request not found.", 404, req, res, next);
    } else {
      if(debug) {
        console.log("Info:  Redirecting to client's home page.");
      }
      res.writeHead(301,{Location: req.protocol + "://" + req.get('host') + "/"});
      //res.body({redirect: req.originalUrl});
      res.end();
    }
    next();
  }
};