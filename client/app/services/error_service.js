
'use strict';

/**
 * Alert service stores a list of alerts that are shown to a user at any
 * given time.
 */
angular.module('SDL.errorService', []).service('ErrorService', ['$rootScope', 'Alert', 'ALERTS', function($rootScope, Alert, ALERTS) {

	var displayAlertOnError = false;
	var displayLogOnError = false;

	this.display = function(err, type) {
		if(displayAlertOnError) {
			Alert.addUnsticky(err.message || err, (type) ? type : ALERTS.types.error, ALERTS.types.error, undefined, undefined);
		}

		if(displayLogOnError) {
			$log.error(err.message || err);
		}
	};

	this.handle = function(err, type, next) {
		next = (next) ? next : function() { };

		if(! err) {
			return next();
		}

		if(displayAlertOnError) {
			Alert.addUnsticky(err.message || err, (type) ? type : ALERTS.types.error, ALERTS.types.error, undefined, undefined);
		}

		if(displayLogOnError) {
			$log.error(err.message || err);
		}
	};

	this.alert = function(err, next) {

	};

	this.log = function(err, next) {

	};

	// Return the service object.
	return this;
}]);

