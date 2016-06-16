/**
 * Defines routes related to the policies API.
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

  var PT_TYPE_HTTP = "http",
    PT_TYPE_PROPRIETARY = "proprietary";


  /* ************************************************** *
   * ******************** API Routes and Permissions
   * ************************************************** */

  var api = express.Router();

  // Handle policy update requests.
  api.route('/').post(decryptPolicySnapshot, recordSnapshot, policyTableUpdate);
  api.route('/proprietary').post(decryptPolicySnapshot, recordSnapshot, proprietaryPolicyTableUpdate);
  
  // Use the router and set the router's base url.
  app.use('/api/:version/policies', api);


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  /**
   * Create and return an updated policy table to the 
   * requesting client.
   * @param {object} req is the express request object.
   * @param {object} res is the express response object.
   * @param {expressCallback} next is a callback method.
   */
  function policyTableUpdate(req, res, next) {
    var snapshot = req.body || [];

    // Get the policy table from /data/policies
    getPolicyTableByName("default", PT_TYPE_HTTP, function(err, policy) {
      if(err) {
        next(err);
      } else {

        /**
         * Here is where you would merge the policy table and 
         * the policy table snapshot.  Making sure to update 
         * any information the snapshot was missing.  
         */

        res.send(JSON.stringify(policy, undefined, 4));
      }
    });
  }

  /**
   * Create, encrypt, and return an updated policy table 
   * to the requesting client.
   * @param {object} req is the express request object.
   * @param {object} res is the express response object.
   * @param {expressCallback} next is a callback method.
   */
  function proprietaryPolicyTableUpdate(req, res, next) {
    var snapshot = req.body || [];

    getPolicyTableByName("default", PT_TYPE_PROPRIETARY, function(err, policy) {
      if(err) {
        next(err);
      } else {

        /**
         * Here is where you would merge the policy table and 
         * the policy table snapshot.  Making sure to update 
         * any information the snapshot was missing.  
         */

        encryptPolicySnapshot(JSON.stringify(policy, undefined, 4), function(err, encryptedPolicy) {
          if(err) {
            next(err);
          } else {
            res.send(encryptedPolicy);
          }
        });
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
       * would decrypt the policy table snapshot, if it was
       * encrypted.
       */
      
      // To simplify later methods, we will also remove the 
      // unneeded nesting of the snapshot(s) in the "data" 
      // property.
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
       * Here is where you might evaluate and save the usage 
       * and error information. You can view descriptions of 
       * the data included in a policy table snapshot at 
       * https://smartdevicelink.com/docs/sdl-server
       */
      
      // For now, let's just log out the usage and errors.
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
    // Load a JSON policy table file located in /data/policies by name.
    fs.readFile(config.policiesDirectory+name+".json", function(err, policy) {
      if(err) {
        cb(err);
      } else if( ! policy) {
        cb(error.build("Policy with name '"+name+"' was not found.", 400));
      } else {

        // Replace the default SDL server endpoint to this server's address
        // so that future policy table updates will be made to this server.
        policy = JSON.parse(policy);
        if (type == PT_TYPE_HTTP) {
          policy.data[0].policy_table.module_config.endpoints["0x07"].default = [config.server.url+"/api/1/policies"];
          policy = policy.data[0];
        } else if (type == PT_TYPE_PROPRIETARY){
          policy.data[0].policy_table.module_config.endpoints["0x07"].default = [config.server.url+"/api/1/policies/proprietary"];
        }
        
        cb(undefined, policy);
      }
    });
  }

  /**
   * Encrypt a policy table snapshot.
   * @param {string} policy is the policy table to be 
   * encrypted.
   * @param {stringResultCallback} cb is a callback method.
   */
  function encryptPolicySnapshot(policy, cb) {
    if(policy) {

      /**
       * Policy snapshots can be encrypted by the SDL 
       * server prior to being sent to SDL core.  It is 
       * up to you to implement the encryption portion of 
       * the SDL server, by default there is none.  Here 
       * is where you would encrypt the policy table.
       */

      cb(undefined, policy);
    } else {
      // Policy table was not included, so there is nothing to encrypt.
      cb(undefined, policy);
    }
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

/**
 * A callback where an error or the string result will 
 * be returned reespectively.
 *
 * @callback stringResultCallback
 * @param {object|undefined} error describes the error
 * that occurred.
 * @param {string|undefined} result is a string.
 */