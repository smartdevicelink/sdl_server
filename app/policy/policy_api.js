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
      fs = require('fs');


  /* ************************************************** *
   * ******************** API Routes and Permissions
   * ************************************************** */

  var api = express.Router();

  // Handle policy update requests.
  api.route('/').post(policyTableUpdate);

  // Use the router and set the router's base url.
  app.use('/api/:version/policies', api);


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */


  function policyTableUpdate(req, res, next) {
    getPolicyTableByName("default", function(err, policy) {
      if(err) {
        next(err);
      } else {
        res.send(policy);
      }
    });
  }


  /* ************************************************** *
   * ******************** Private Methods
   * ************************************************** */

  /**
   * Get a policy table with the specified name.
   * @param {string} name is the name of a policy table,
   * without an extension.
   * @param {getDataCallbackMethod} cb is a callback method.
   */
  function getPolicyTableByName(name, cb) {
    fs.readFile(config.policiesDirectory+name+".json", function(err, policy) {
      if(err) {
        cb(err);
      } else if( ! policy) {
        cb(error.build("Policy with name '"+name+"' was not found.", 400));
      } else {

        // Replace the default SDL server endpoint to this server.
        policy = JSON.parse(policy);
        policy.policy_table.module_config.endpoints["0x07"].default = [config.server.url+"/api/1/policies"];
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