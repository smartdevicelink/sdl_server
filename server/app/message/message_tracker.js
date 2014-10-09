// ~> Tracker
// ~A Chris Rokita
// ~C Scott Smereka

/* Tracker
 * Keep track of requests and response exchanges that 
 * occur on the server.
 */


module.exports = function(app, db, config) {
  
  /* ************************************************** *
   * ******************** Local Variables
   * ************************************************** */

  var fox    = require('foxjs'),  // Fox library reference
      log    = fox.log,           // Fox logger for logging data.
      sender = fox.send;          // Fox sender for handling requests and responses.

  // Message database model
  var Message = db.model('Message');


  /* ************************************************** *
   * ******************** Routes
   * ************************************************** */

  // Attempt to track all requests.
  app.all("/*", whitelist, blacklist, track);


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

   /**
    * Enforce a blacklist of request/response exchanges
    * to track.  Do not proceed with items that are in 
    * the configuration's blacklist.
    */
   function blacklist(req, res, next) {
    // Do not track a request that has tracking disabled.
    if(req.isTrackingEnabled === false) {
      return next();
    }

    if(req.url === undefined) {
      log.error("Request url is missing.");
      return next();
    }

    //TODO: Enforce a blacklist of urls that will not be 
    //      tracked by the tracker, so sayith the config.

    // Do not track a call made to query for messages.
    if(req.url.indexOf('/messages') !== -1) {
      req.isTrackingEnabled = false;
    }

    next();
   }

   /**
    * Enforce a whitelist of request/response exchanges
    * to track.  Do not proceed with items not in the
    * configuration's whitelist.
    */
   function whitelist(req, res, next) {
    // Do not check a request that has tracking disabled.
    if(req.isTrackingEnabled === false) {
      return next();
    }

    //TODO: Enforce a whitelist of urls that will not be 
    //      tracked by the tracker, so sayith the config.

    next();
   }

  /**
   * Track the request and response exchanage by creating
   * a message object and storing it.
   */
  function track(req, res, next) {
    // Do not track a request that has tracking disabled.
    if(req.isTrackingEnabled === false) {
      return next();
    }

    // Do not track unhandled requests.
    if( ! sender.isRequestHandled(req) || sender.getResponse(res) === undefined) {
      return next();
    }

    // Create a new message object and populate it with the 
    // request and response data.
    var msg = new Message();
    msg.populateResponse(res);
    msg.populateRequest(req);

    // Save the message object.
    msg.save(function(err, msg) {
      if(err) {
        log.error(err);
      }
    });

    next();
  }
}