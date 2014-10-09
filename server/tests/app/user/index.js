module.exports = function(app, db, config, token, next) {
	require("./user.js")(app, db, config, token, function() {
		require("./userRole.js")(app, db, config, token, next);
	});
}