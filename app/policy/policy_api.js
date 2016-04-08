/**
 * Defines routes related to policies.
 * @param {object} app is the express application object.
 * @param {object} config is the server's configuration object.
 * @param {object} log is the server's current logger instance.
 */
module.exports = function(app, config, log) {


  /* ************************************************** *
   * ******************** Module's Global Variables
   * ************************************************** */

  var error = require(config.libsDirectory + 'error'),
      express = require('express'),
      fs = require('fs'),
      _ = require('lodash');


  /* ************************************************** *
   * ******************** API Routes and Permissions
   * ************************************************** */

  var api = express.Router();

  // Handle a policy update request.
  api.route('/').post(decryptPolicySnapshot, recordSnapshot, policyTableUpdate);
  api.route('/proprietary').post(decryptPolicySnapshot, recordSnapshot, proprietaryPolicyTableUpdate);
  // Use the router and set the router's base url.
  app.use('/api/:version/policies', api);


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  function policyTableUpdate(req, res, next) {
    var snapshot = req.body || [];

    getPolicyTableByName("default", "http", function(err, policy) {
      if(err) {
        next(err);
      } else {
        res.send(policy);
      }
    });
  }

  function proprietaryPolicyTableUpdate(req, res, next) {
    var snapshot = req.body || [];

    getPolicyTableByName("default", "proprietary", function(err, policy) {
      if(err) {
        next(err);
      } else {
        res.send(policy);
      }
    });
  }

  /**
   * Decrypt an encrypted policy table snapshot.
   * @param {object} req is the express request object.
   * @param {object} res is the express response object.
   * @param {expressCallback} next is a callback method.
   */
  function decryptPolicySnapshot(req, res, next) {
    if(req.body.data) {

      /**
       * Policy snapshots can be encrypted by the SDL core
       * HMI prior to being sent to SDL Server.  It is up
       * to you to implement the encryption portion of the
       * HMI, by default there is none.  Here is where you
       * would decrypt the policy table snapshot, if it is
       * encrypted.
       */
      
      // To simplify later methods, we will remove unneeded 
      // nesting of the snapshot(s)
      req.body = (req && req.body && _.isArray(req.body.data) && req.body.data.length > 0) ? req.body.data : undefined;

      next();
    } else {
      // Policy table snapshot was not included, so there
      // is nothing to decrypt.
      next();
    }
  }

  /**
   * Record information, such as usage and errors, 
   * found in the policy table snapshot.
   * @param {object} req is the express request object.
   * @param {object} res is the express response object.
   * @param {expressCallback} next is a callback method.
   */
  function recordSnapshot(req, res, next) {
    if(req.body) {
      
      /**
       * You can view descriptions of the different types of 
       * information included in a policy table snapshot at 
       * https://goo.gl/vfKoZV
       */
      log.info("Usage and Errors: %s", JSON.stringify(req.body.usage_and_error_counts));

      next();
    } else {
      // Policy table snapshot was not included, so there
      // is nothing to record.
      next();
    }
  }


  /* ************************************************** *
   * ******************** Private Methods
   * ************************************************** */

  /**
   * Get a policy table with the specified name.
   * @param {string} name is the name of a policy table,
   * without an extension.
   * @param {string} type defines the type of policy table
   * update requested by SDL. The two types require the
   * policy table to be returned in slightly different 
   * formats.
   * @param {getDataCallbackMethod} cb is a callback method.
   */
  function getPolicyTableByName(name, type, cb) {
    fs.readFile(config.policiesDirectory+name+".json", function(err, policy) {
      if(err) {
        cb(err);
      } else if( ! policy) {
        cb(error.build("Policy with name '"+name+"' was not found.", 400));
      } else {

        // Replace the default SDL server endpoint to this server.
        policy = JSON.parse(policy);
        if (type == "http") {
          policy.data[0].policy_table.module_config.endpoints["0x07"].default = [config.server.url+"/api/1/policies"];
          policy = policy.data[0];
        } else if (type == "proprietary"){
          policy.data[0].policy_table.module_config.endpoints["0x07"].default = [config.server.url+"/api/1/policies/proprietary"];
        }
        policy = JSON.stringify(policy, undefined, 4);

        cb(undefined, policy);
      }
    });
  }

};


/* ************************************************** *
 * ******************** Documentation Stubs
 * ************************************************** */

/**
 * A callback with response to get json data.  The
 * resulting data will be an error or the json data
 * respectively.
 *
 * @callback getDataCallbackMethod
 * @param {object|undefined} error describes the error
 * that occurred.
 * @param {object|undefined} result is a json object.
 */

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