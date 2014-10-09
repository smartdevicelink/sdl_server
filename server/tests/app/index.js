module.exports = function(app, db, config, token, next) {
	require("./vehicle")(app, db, config, token, function() {
		require("./application")(app, db, config, token, function() {
			require("./user")(app, db, config, token, function() {
				require("./authentication")(app, db, config, token, next);
			});
		});
	});
}