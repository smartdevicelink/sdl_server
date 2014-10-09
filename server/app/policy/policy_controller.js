// ~> Controller
// ~A Scott Smereka

/* Policy Controller
 */

var url = require("url");

module.exports = function(app, db, config) {
  

  var async = require("async");

  /* ************************************************** *
   * ******************** Load Libraries and Models
   * ************************************************** */

  var fox         = require("foxjs"),            //
      sender      = fox.send,                    //
      auth        = fox.authentication,          //
      model       = fox.model;
      
  // Load database schemas
  var Application = db.model("Application"),
      EndUser = db.model("EndUser"),
      ConsumerFriendlyMessage = db.model("ConsumerFriendlyMessage"),
      FunctionalGroups = db.model("FunctionalGroup"),
      //Module = db.model("Module"),
      //ModuleConfig = db.model("ModuleConfig"),
      Phone = db.model("Phone"),
      UserConsent = db.model("UserConsent"),
      UsageReport = db.model("UsageReport"),
      Vehicle = db.model("Vehicle");

  // Load protocol constants.
  var SDL = config["const"]["TYPE_SDL"],
      SADL = config["const"]["TYPE_SADL"];

  var sdlPolicyRequest = [
    queryApp,
    queryVehicle,
    populateFunctionalGroups,
    populateConsumerFriendlyMessages,
    queryPhones,
    queryEndUser,
    queryUsageReports,
    //queryErrorReports,
    createSdlPolicy
  ];

  var sdlPolicyRequestV2 = [
    queryApp,
    queryVehicle,
    queryPhones,
    queryEndUser,
    queryEndUsers,
    createSdlPolicyV2
  ]


  /* ************************************************** *
   * ******************** Routes and Permissions
   * ************************************************** */

  app.all('/api/policies', function(req,res, next) {

  });

	app.all('/policies.:format', function (req, res, next) {
		console.log("Policy Requested!")
		sender.setResponse({}, req, res, next);
	});

  // Build and return a policy for a specific user, car, and apps.
  app.get('/policies/sdl/1/query.:format', sdlPolicyRequest);

  app.get('/policies/sdl/2/query.:format', sdlPolicyRequestV2);



  app.get('/doit.json', function(req, res, next) {
    Phone.findOne({"_id":"5359813cb8ef790000000006"}).exec(function(err, phone) {
      if(err) {
        return next(err);
      }

      phone.userConsents = ["535e6c8ead11170000000005" ];

      phone.save(function(err, updatedPhone) {
        sender.setResponse(updatedPhone, req, res, next);
      });
    });
  });
  app.get('/fuckingdoit.json', function(req, res, next){
    var uc = new UserConsent({
      application: "535922b969ff525a97000006",
      consent_groups: {
        "Notifications": true,
        "VehicleInfo-3": true
      },
      endUser: "535a7bd3420704433b000011",
      input: "GUI"
    });

    console.log(uc);
    uc.save(function(err, uc_saved){
      if(err) {
        return next(err);
      }
      sender.setResponse(uc_saved, req, res, next);
    });
  });
 

  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */


  /**
   * Creates a policy table in a new and improved format.
   */
  function createPolicy(req, res, next) {
    console.log("Policy Request");
    console.log(req);
    sender.setResponse({}, req, res, next);
  }


  function createSdlPolicyV2(req, res, next) {
    var policy = {};

    // Set vehicle and sanitize vehicle.
    if(res.locals.vehicle) {
      policy["vehicle"] = res.locals.vehicle.toObject();
      delete policy.vehicle["module"];
      delete policy.vehicle["_id"];
      delete policy.vehicle["__v"];
    }

    // Set the module data and sanitize it.
    if(res.locals.vehicle.module) {
      policy["module"] = res.locals.vehicle.module.toObject();
      delete policy.module["symmetricKey"];
      delete policy.module["_id"];
      delete policy.module["__v"];
    }

    if(res.locals.endUsers) {
      policy.users = [];
      for(var i = 0; i < res.locals.endUsers.length; i++) {
        policy.users.push(res.locals.endUsers[i].toObject());
        delete policy.users[i]["__v"];
        delete policy.users[i]["vehicles"];
      }
    }

    sender.setResponse(policy, req, res, next);
  }


  /**
   * Creates a policy table in the original format and 
   * sets the return response.
   */
  function createSdlPolicy(req, res, next) {
    // Calculate the the seconds between retries based on
    // exponential backoff.
    var seconds_between_retries = [];
    var backoffSeconds;
    for(var i = 0; i <= res.locals.vehicle.module.updateSettings.retryAttempts && i < 6; i++) {
      backoffSeconds = Math.pow(2,i)-1;
      if(backoffSeconds > 720) {
        backoffSeconds = 720;
      }
      seconds_between_retries.push(backoffSeconds);
    }

    // Create the policy object.
    var policy = {
      "policy_table": {
        "module_config": {
          "preloaded_pt": false,
          "endpoints": {

          },
          "exchange_after_x_kilometers": res.locals.vehicle.module.updateSettings.kilometers,
          "exchange_after_x_days": res.locals.vehicle.module.updateSettings.days,
          "exchange_after_x_ignition_cycles": res.locals.vehicle.module.updateSettings.ignitionCyles,
          "notifications_per_minute_by_priority": {
            "COMMUNICATION": res.locals.vehicle.module.notificationSettings.communication,
            "EMERGENCY": res.locals.vehicle.module.notificationSettings.emergency,
            "NAVIGATION": res.locals.vehicle.module.notificationSettings.navigation,
            "NONE": res.locals.vehicle.module.notificationSettings.none,
            "NORMAL": res.locals.vehicle.module.notificationSettings.normal,
            "voiceCOMMUNICATION": res.locals.vehicle.module.notificationSettings.voice
          },
          "seconds_between_retries": seconds_between_retries,
          "timeout_after_x_seconds": res.locals.vehicle.module.updateSettings.timeout,
          "vehicle_make": res.locals.vehicle.make,
          "vehicle_model": res.locals.vehicle.model,
          "vehicle_year": res.locals.vehicle.year,
        },
        "module_meta": {
          "ccpu_version": res.locals.vehicle.module.firmwareVersion,
          //"ignition_cycles_since_last_exchange": ,
          "language": res.locals.vehicle.module.language,
          //"pt_exchanged_at_odometer_x": ,
          //"pt_exchanged_x_days_after_epoch": ,
          "vin": res.locals.vehicle.vin,
          "wers_country_code": res.locals.vehicle.module.countryCode
        },

        // Device data will be populated below by looping through each device.
        "device_data": {},
        "usage_and_error_counts": {

        },
        "functional_groupings": {

        },
        "Base": {

        }
      },
      
      "consumer_friendly_messages": {
      },

      "layouts": {

      }
    };

    // Populate the device data field with all the connected phone information.
    for(var i = res.locals.phones.length-1; i >= 0; --i) {
      var os = (res.locals.phones[i].android.isAndroid) ? "Android" : "iOS";
      var phone = {
        "carrier": res.locals.phones[i].carrior,
        "consent_groups": {},
        "firmware_rev": res.locals.phones[i].firmwareVersion,
        "hardware": res.locals.phones[i].name,
        "max_number_rfcom_ports": res.locals.phones[i].rfcomPorts,
        "os": os,
        "os_version": res.locals.phones[i].softwareVersion
      };

      // Populate the device's consent group for each application.
      for(var x = res.locals.phones[i].userConsents.length-1; x >= 0; --x) {
        phone.consent_groups[res.locals.phones[i].userConsents[x].application.key] = {
          "consent_groups": res.locals.phones[i].userConsents[x].consent_groups,
          "input": res.locals.phones[i].userConsents[x].input,
          "time_stamp": res.locals.phones[i].userConsents[x].time_stamp
        }
      }

      policy.policy_table.device_data[res.locals.phones[i].bluetoothMacAddress || res.locals.phones[i].usbSerial] = phone;
    }

    // Populate the functional Groups
    for(var i = res.locals.functionalGroups.length-1; i >=0; --i) {
      policy.policy_table.functional_groupings[res.locals.functionalGroups[i].name] = res.locals.functionalGroups[i].properties;

      policy.policy_table.functional_groupings[res.locals.functionalGroups[i].name] = {
        "rpcs": res.locals.functionalGroups[i].rpcs
      }
    }

    // Populate consumer friendly messages
    for(var i = res.locals.consumerFriendlyMessages.length-1; i >=0; --i) {
      policy.consumer_friendly_messages["version"] = res.locals.consumerFriendlyMessages[i].version;
      policy.consumer_friendly_messages["messages"] = res.locals.consumerFriendlyMessages[i].messages;
    }

    // Set the response and move on.
    sender.setResponse(policy, req, res, next);
  }


  /**
   * Find all phones that have connected to the vehicle and populate the 
   * user consent information.  Stores the result in the local phones variable.
   */
  function queryPhones(req, res, next) {
    Phone.find({"vehicles": res.locals.vehicle}).populate("userConsents").exec(function(err, phones) {
      if(err) {
        return next(err);
      }

      // Perform a sub populate on the User Consents' Application property.
      var iter = function(phone, callback) {
        UserConsent.populate(phone.userConsents, { path: 'application' }, callback)
      };

      async.each(phones, iter, function done(err) {
        res.locals.phones = phones;
        return next();
      });

    });
  }

  /**
   * Handle a vehicle lookup from a policy request.
   * Stores the results in the request local variable.
   */
  function queryVehicle(req, res, next) {
    // Grab the VIN number from the query string or body.
    var vin = (req.body["vin"]) ? req.body.vin : url.parse(req.url, true).query["vin"];
    
    // No Vin Number, for now throw an error.
    if( ! vin) {
      return next(sender.createError("Request requires a vehicle 'vin' property.", 400));
    }

    // Find the vehicle with that vin.
    Vehicle.findOne({"vin" : vin}).populate("module").exec(function(err, vehicle) {
      if(err) {
        next(err);
      } else if( ! vehicle) {
        // Vehicle was not found, so create a new one.
        vehicle = new Vehicle();
        vehicle.update(req.body, (req.user) ? req.user._id : undefined, function(err, vehicle) {

          // Vehicle was possibly created so update the local variable.
          res.locals.vehicle = vehicle;
          next(err);
        });
      } else {
        // Vehicle was found, update our local variable and continue.
        res.locals.vehicle = vehicle;
        next();
      }
    });
  }

  function populateFunctionalGroups (req, res, next) {
    if(res.locals.vehicle && res.locals.vehicle.module) {
      var module = res.locals.vehicle.module.toObject();
      if(module.functionalGroups && module.functionalGroups.length > 0) {
        FunctionalGroups.findById(module.functionalGroups[0], function(err, functionalGroup) {
          if(err) {
            return next(err);
          }
          //console.log(functionalGroup);
          res.locals.functionalGroups = [ functionalGroup ];
          next();
        });
      } else {
        next();
      }
    } else {
      next();
    }
  }

  function populateConsumerFriendlyMessages(req, res, next) {
    if(res.locals.vehicle && res.locals.vehicle.module) {
      var module = res.locals.vehicle.module.toObject();
      if(module.consumerFriendlyMessages && module.consumerFriendlyMessages.length > 0) {
        ConsumerFriendlyMessage.findById(module.consumerFriendlyMessages[0], function(err, consumerFriendlyMessage) {
          if(err) {
            return next(err);
          }
          res.locals.consumerFriendlyMessages = [ consumerFriendlyMessage ];
          next();
        });
      } else {
        next();
      }
    } else {
      next();
    }
  }

  /**
   * Handle an applciation lookup from a policy request.
   * Stores the results in the request local variable.
   */
  function queryApp(req, res, next) {
    // Get the application's key from the query string or the body.
    var key = (req.body["app"]) ? req.body.app : url.parse(req.url, true).query["app"];

    // No app key, for now throw an error.
    if( ! key) {
      return next(sender.createError("Request requires an 'app' property.", 400));
    }

    // Find the application by the key.
    Application.findOne({ "key": key}, function(err, app) {
      if(err) {
        next(err);
      } else if( ! app) {
        // No application found, send back an error for bad app key.
        next(sender.createError("Request's 'app' property is invalid."));
      } else {
        // Application was found, update our local variable and continue.
        res.locals.app = app;
        next();
      }
    });
  }


  function queryEndUsers(req, res, next) {
    EndUser.find({ vehicles: res.locals.vehicle._id }).populate("userConsents").exec(function(err, endUsers) {
      if(err) {
        return next(err);
      }

      res.locals.endUsers = endUsers;
      next();
    });
  }


  function queryEndUser(req, res, next) {
    // Grab the bluetooth mac address from the query string or body.
    var query = {
      vehicles: res.locals.vehicle._id
    };

    // Check for a bluetooth mac address
    var bluetoothMacAddress = (req.body["bluetoothMacAddress"]) ? req.body.bluetoothMacAddress : url.parse(req.url, true).query["bluetoothMacAddress"];
    if(bluetoothMacAddress !== undefined) {

      // Determine the user's phone from the list of possible phones.
      for(var i = res.locals.phones.length-1; i >=0; --i) {
        if(res.locals.phones[i].bluetoothMacAddress === bluetoothMacAddress) {
          query.phones = res.locals.phone = res.locals.phones[i]._id;
          break;
        }
      }
    } else {

      // Check for a usb serial number
      var usbSerial = (req.body["usbSerial"]) ? req.body.usbSerial : url.parse(req.url, true).query["usbSerial"];

      // If we don't have a serial number or mac address then we need to throw an error.
      if(usbSerial === undefined) {
        return next(sender.createError("Request requires a 'bluetoothMacAddress' or 'usbSerial' property.", 400));  
      }

      // Determine the user's phone from the list of possible phones.
      for(var i = res.locals.phones.length-1; i >=0; --i) {
        if(res.locals.phones[i].bluetoothMacAddress === bluetoothMacAddress) {
          query.phones = res.locals.phone = res.locals.phones[i]._id;
          break;
        }
      }
    }
    
    // Find the end user with the phone and vehicle.
    EndUser.findOne(query).populate('userConsent').exec(function(err, endUser) {
      if(err) {
        next(err);
      } else if ( ! endUser) {
        next(sender.createError("Invalid 'bluetoothMacAddress' or 'usbSerial' value"))
      } else {
        res.locals.endUser = endUser;
        next();
      }
    });
  }

  function queryUserConsents(req, res, next) {
    var query = {
      phone: res.locals.phone,
      endUser: res.locals.endUser
    };

    UserConsent.find(query).populate("application").exec(function(err, userConsents) {
      if(err) {
        return next(err);
      }

      res.locals.userConsents = userConsents;
      next();
    });
  }

  function queryUsageReports(req, res, next) {
    UsageReport.find({ vehicle: res.locals.vehicle._id }).exec(function(err, usageReports) {
      if(err) {
        return next(err);
      }
      //console.log(usageReports);

      res.locals.usageReports = usageReports;
      next();
    });
  }

};