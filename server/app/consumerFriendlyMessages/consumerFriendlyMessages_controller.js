// ~> Controller
// ~A Scott Smereka

module.exports = function(app, db, config) {

	var fox    = require('foxjs'),
			sender = fox.send,
			auth   = fox.authentication,
			model  = fox.model,
			Cfm   = db.model('ConsumerFriendlyMessage'),
			Language = db.model('Language');
		  MessageType = db.model('MessageType');


	/* ************************************************** *
	 * ******************** Routes and Permissions
	 * ************************************************** */

	// Load user roles used for authentication.
	var adminRole = auth.queryRoleByName("admin");

	app.get('/consumerFriendlyMessages.:format', cfms);
	app.get('/consumerFriendlyMessages/:cfmId.:format', cfm);
	app.post('/consumerFriendlyMessages/:id/copy.:format', copy);
	//app.post('/consumerFriendlyMessages/:cfmId.:format', clearFailedLoginAttempts);


	/* ************************************************** *
	 * ******************** Route Methods
	 * ************************************************** */

	/*
	 * Get and return the consumer friendly message object
	 * specified by their Object ID.
	 */
	function cfm(req, res, next) {
		Cfm.findOne({_id:req.params.cfmId}).populate('messages').exec(function(err, cfm){
			if(err) return next(err);

			// Format to look like policy table.
			// var obj = cfm.format();

			sender.setResponse(cfm, req, res, next);
		})
	}

	/*
	 * Get all the  and return them in the requested format.
	 */
	function cfms(req, res, next) {
		Cfm.find().populate('messages').exec(function(err, cfms) {    // Find all the user roles and sort them by their permission level.
			if(err) return next(err);

			// Format to look like policy table.
			//var cfmsFormatted = [];
			//for(index in cfms) {
			//  cfmsFormatted.push(cfms[index].format());
			//}

			sender.setResponse(cfms, req, res, next);
		});
	}


	function copy(req, res, next) {
		Cfm.findOne({_id:req.params.id}).populate('messages').exec(function(err, cfm){
			if(err) return next(err);

			if( ! cfm) {
				return next(new Error("Could not find a consumer friendly message with id " + req.params.id));
			}

			cfm.copy(req.body, function(err, cfmCopy) {
				if(err) return next(err);

				sender.setResponse(cfmCopy, req, res, next);
			});
		})
	}

};