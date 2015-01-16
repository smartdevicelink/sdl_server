// ~> Controller
// ~A Scott Smereka

module.exports = function(app, db, config) {

  var fox    = require('foxjs'),
      sender = fox.send,
      auth   = fox.authentication,
      model  = fox.model,
      _      = require('underscore'),
      Application  = db.model('Application'),
      Module = db.model('Module');

  /* ************************************************** *
   * ******************** Routes and Permissions
   * ************************************************** */


  app.get('/applications/available/:moduleId.:format', Module.findByIdFromRequest, queryApplications);


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  /**
   * Find and return a list of applications for a specific module.
   */
  function queryApplications(req, res, next) {
    var module = res.locals.module,
        isAndroid = (req.query.os !== undefined && req.query.os.toLowerCase() === "android"),
        isIos = (req.query.os !== undefined && req.query.os.toLowerCase() === "ios"),
        sdlMaxVersion = (req.query.sdlMaxVersion !== undefined) ? Number(req.query.sdlMaxVersion) : undefined,
        sdlMinVersion = (req.query.sdlMinVersion !== undefined) ? Number(req.query.sdlMinVersion) : undefined;

    // Query for all applications that work with the specified module.
    var query = {
      $or: [
        {
          $and: [ {
              "whitelist.enabled": true
            }, {
              "whitelist.list": module._id
            }
          ]
        }, {
          "whitelist.enabled": false
        }
      ]
    };

    // Exclude development applications by default.
    if(req.query.development === undefined || req.query.development === false || req.query.development === "false") {
      query.development = false;
    }

    // Filter applications by operating system.
    if(isIos) {
      query["ios.enabled"] = true;
    } else if(isAndroid) {
      query["android.enabled"] = true;
    }

    // Filter applications by SDL versions.
    if(req.query.sdlVersion !== undefined) {
      sdlMaxVersion = sdlMinVersion = Number(req.query.sdlVersion);
    }

    // Perform query for applications.
    Application.find(query).exec(function(err, apps) {
      if(err) {
        return next(err);
      }

      // Filter by comparable sdl versions and format application list.
      for (var i = apps.length - 1; i >= 0; --i) {
        var isAndroidValid = (checkVersion(apps[i].android.sdlVersion, sdlMinVersion, sdlMaxVersion)),
            isIosValid = (checkVersion(apps[i].ios.sdlVersion, sdlMinVersion, sdlMaxVersion));

        // Remove ios or android data if not required.
        if (isAndroid === true) {
          if(isAndroidValid) {
            apps[i] = apps[i].toObject();
            delete apps[i].ios;
          } else {
            apps.splice(i, 1);
          }
        } else if(isIos === true) {
          if(isIosValid) {
            apps[i] = apps[i].toObject();
            delete apps[i].android;
          } else {
            apps.splice(i, 1);
          }
        } else {
          if( ! isAndroidValid && ! isIosValid) {
            apps.splice(i,1);
          } else if( ! isAndroidValid) {
            apps[i] = apps[i].toObject();
            delete apps[i].android;
          } else if ( ! isIosValid) {
            apps[i] = apps[i].toObject();
            delete apps[i].ios;
          }
        }
      }

      sender.setResponse(apps, req, res, next);
    });
  }


  /* ************************************************** *
   * ******************** Private Methods
   * ************************************************** */

  /**
   * Check if the version string is between a minimum and
   * maximum value.  The max and min values are inclusive.
   * @param version is a string SDL version.
   * @param min is a string minimum SDL version.
   * @param max is a string maximum SDL version.
   * @returns {boolean} true if the version is within the limits or
   * if the version is undefined.  Otherwise returns false.
   */
  function checkVersion(version, min, max) {
    if(version === undefined) {
      return true;
    }

    version = Number(version);
    if(_.isNaN(version)) {
      return false;
    }

    min = Number(min);
    if( ! _.isNaN(min) && version < min) {
      return false;
    }

    max = Number(max);
    if( ! _.isNaN(max) && version > max) {
      return false;
    }

    return true;
  }


 };
