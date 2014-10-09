// ~> Controller
// ~A Scott Smereka

module.exports = function(app, db, config) {
  
  var fox    = require('foxjs'),
      sender = fox.send,
      auth   = fox.authentication,
      model  = fox.model,
      User   = db.model('User');                                     // Pull in the user schema

	var FunctionalGroup = db.model("FunctionalGroup");

  /* ************************************************** *
   * ******************** Routes and Permissions
   * ************************************************** */

  //app.get('/functionalGroups.:format', functionalGroup);                          // Get all users.
  //app.get('/users/:userId.:format', user);                 // Get a specific user.

  // Load user roles used for authentication.
  var adminRole = auth.queryRoleByName("admin"),
      selfRole  = auth.queryRoleByName("self");


	app.post('/functionalGroups/:id/copy.:format', copy);

  /* ************************************************** *
   * ******************** Route Methods
   * ************************************************** */

  function create(req, res, next) {

  }

	function functionalGroup(req, res, next) {
		FunctionalGroup.find({}).exec(function(err, fgs) {
			if(err) return next(err);

			// Format to look like policy table.
			var fgsFormatted = {};
			for(index in fgs) {
				fgsFormatted[fgs[index].name] = fgs[index].format()[fgs[index].name];
			}

			sender.setResponse(fgsFormatted, req, res, next);
		});
	}

	function copy(req, res, next) {
		FunctionalGroup.findOne({_id:req.params.id}).exec(function(err, functionalGroup){
			if(err) return next(err);

			if( ! functionalGroup) {
				return next(new Error("Could not find a Functional Group with id " + req.params.id));
			}

			functionalGroup.copy(req.body, function(err, functionalGroupCopy) {
				if(err) return next(err);

				sender.setResponse(functionalGroupCopy, req, res, next);
			});
		})
	}

};