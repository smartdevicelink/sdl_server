// ~> Controller
// ~A Scott Smereka

module.exports = function(app, db, config) {

  var fox    = require('foxjs'),
    sender = fox.send,
    auth   = fox.authentication,
    model  = fox.model,
    Vehicle   = db.model('Vehicle');


  /* ************************************************** *
   * ******************** Routes and Permissions
   * ************************************************** */

  app.get('/vehicles.:format', read);

  app.get('/vehicles/:id.:format', getById);

  // Load user roles used for authentication.
  var adminRole = auth.queryRoleByName("admin"),
    selfRole  = auth.queryRoleByName("self");


  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  function read(req, res, next) {
    Vehicle.find().populate('module').exec(function(err, vehicles) {
      if(err) return next(err);

      sender.setResponse(vehicles, req, res, next);
    });
  }

  function getById(req, res, next) {
    Vehicle.findById(req.params.id).populate('module').exec(function(err, vehicle) {
      if(err) return next(err);

      sender.setResponse(vehicle, req, res, next);
    });
  }
};