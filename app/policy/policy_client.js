/**
 * Defines routes related to policy client pages.
 * @param {object} app is the express application object.
 * @param {object} config is the server's configuration object.
 * @param {object} log is the server's current logger instance.
 */
module.exports = function(app, config, log) {


  /* ************************************************** *
   * ******************** Module's Global Variables
   * ************************************************** */

   var express = require('express');


  /* ************************************************** *
   * ******************** User Client Routes
   * ************************************************** */

  // Create a router for the following group of requests.
  var client = express.Router();

  // All CRUD requests to /policy should show the policy
  // request page.
  client.route('/').all(showPolicyRequestPage);

  // Use the web router and set the router's base url.
  app.use('/policy', client);


  /* ************************************************** *
   * ******************** Web Route Methods
   * ************************************************** */

  /**
   * Show a page where users can perform example policy
   * table updates.
   * @param {object} req is the express request object.
   * @param {object} res is the express response object
   * @param {expressCallback} next is a callback method.
   */
  function showPolicyRequestPage(req, res, next) {
    res.render('policy');
  }

 };


/* ************************************************** *
 * ******************** Documentation Stubs
 * ************************************************** */

/**
 * A callback to the next method list of express
 * methods for a client's request.  This method should
 * not be called if the request has already been handled
 * and the response has been returned to the client.
 *
 * @callback expressCallback
 * @param {object|undefined} error describes an error
 * that occurred.
 */