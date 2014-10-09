// Controller
// ~A Scott Smereka

module.exports = function(app, db, config) {

	var fox    = require('foxjs'),
			sender = fox.send,
			auth   = fox.authentication,
			model  = fox.model,
			Language = db.model('Language');
			MessageType = db.model('MessageType');


	/* ************************************************** *
	 * ******************** Routes and Permissions
	 * ************************************************** */

	// Load user roles used for authentication.
	var adminRole = auth.queryRoleByName("admin");

	//app.post('/messageTypes/:id.:format', update);


	/* ************************************************** *
	 * ******************** Route Methods
	 * ************************************************** */

	/*
	 * Get and return the consumer friendly message object
	 * specified by their Object ID.
	 */
	function update(req, res, next) {
		MessageType.findOne({_id:req.params.id}).exec(function(err, messageType){
			if(err) return next(err);

			console.log(req.body);

			sender.setResponse(cfm, req, res, next);
		})
	}
};