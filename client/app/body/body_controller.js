
'use strict';

/**
 * Body controller is a parent controller for all controllers.  It maintains
 * scope, events, and other global data for the children controllers.
 */
angular.module('SDL.body', []).controller('bodyCtrl', [ '$scope', '$rootScope', '$log', '$state', 'AuthService', 'UserService', 'CacheService', 'Session', 'Alert', 'Restangular', 'USER_ROLES', 'AUTH_EVENTS', 'EVENTS', 'DEBUG', 'ALERTS',function ($scope, $rootScope, $log, $state, AuthService, UserService, CacheService, Session, Alert, Restangular, USER_ROLES, AUTH_EVENTS, EVENTS, DEBUG, ALERTS) {

	/******** Initalization ********/

	// List of alerts.
	$scope.alerts = [];


	/******** Events ********/

	// Session Created or Updated
	$rootScope.$on(EVENTS.sessionUpdated, function(event, e) {
		if(DEBUG.session) {  $log.debug("Event: Session Updated");  }
		$scope.session = Session;
	});

	// Session Refreshing
	$rootScope.$on(EVENTS.sessionRefreshing, function(event, e) {
		if(DEBUG.session) {  $log.debug("Event: Session Refreshing");  }
	});

	// Session Destroyed
	$rootScope.$on(AUTH_EVENTS.sessionDestroyed, function(event, e) {
		if(DEBUG.session) {  $log.debug("Event: Session Destroyed");  }
		$scope.session = Session;
	});

	// Alerts Added
	$scope.$onRootScope(ALERTS.added, function(event, alerts){
		$scope.alerts = Alert.alerts;
	});

	// Alerts Removed
	$scope.$onRootScope(ALERTS.removed, function(event, alerts){
		$scope.alerts = Alert.alerts;
	});

	// Login Success
	$rootScope.$on(AUTH_EVENTS.loginSuccess, function(event, e) {
		$log.debug("Event: Login Success");
	});

	// Logout Success
	$rootScope.$on(AUTH_EVENTS.logoutSuccess, function(event, e) {
		$log.debug("Event: Logout Success");
		$state.transitionTo("login");
	});

	/******** Methods ********/

	// Global method for checking if a user is logged in or not.
	$scope.isAuthenticated = AuthService.isAuthenticated;

	// Global method for checking if a user is authorized or not.
	//$scope.isAuthorized = AuthService.isAuthorized;

	// Global method to log a user out.
	$scope.logout = AuthService.logout;

	// Global method to close an alert.
	$scope.closeAlert = Alert.removeByIndex;

	$scope.goBack = function(activeForm, quantity) {
		if($rootScope.fromState === undefined || $rootScope.fromState.length <= 0) {
			return false;
		}

		if(quantity === undefined) {
			quantity = 1;
		} else if(quantity >= $rootScope.fromState.length) {
			quantity = $rootScope.fromState.length-1;
		}

		if(quantity <= 0) {
			return false;
		}

    var index = $rootScope.fromState.length - quantity;

		if(activeForm !== undefined || activeForm === "") {
			$rootScope.fromParams[$rootScope.fromState.length-1]["activeFormId"] = activeForm;
		}

		$state.transitionTo($rootScope.fromState[index], $rootScope.fromParams[index]);

		$rootScope.fromState.splice(index, $rootScope.fromState.length-index);
		$rootScope.fromParams.splice(index, $rootScope.fromParams.length-index);

		$rootScope.doNotTrackTransition = true;

		return true;
	};

	$scope.goBackToUrl = function(url, activeForm) {
		if(url === undefined || url === "") {
			$log.error("Cannot navigate back to an invalid url.");
			return false;
		}

		if($rootScope.fromState === undefined || $rootScope.fromState.length <= 0) {
			return false;
		}

		var index = -1;

		for(var i = $rootScope.fromState.length-1; i >= 0; --i) {
			if($rootScope.fromState[i] !== undefined && $rootScope.fromState[i].url !== undefined) {
				if($rootScope.fromState[i].url.indexOf(url) >= 0) {
					index = i;
					break;
				}
			}
		}

		if(index < 0) {
			$log.error("Cannot navigate back to " + url + " because it was not in the client's history.");
			return false;
		}

		$rootScope.doNotTrackTransition = true;

		if(activeForm !== undefined || activeForm !== "") {
			$rootScope.fromParams[index]["activeFormId"] = activeForm;
		}

		$state.transitionTo($rootScope.fromState[index], $rootScope.fromParams[index]);

		$rootScope.fromState.splice(index, $rootScope.fromState.length-index);
		$rootScope.fromParams.splice(index, $rootScope.fromParams.length-index);

		return true;
	};

	/******** Initalization ********/

	// Get a list of user roles from the backend server.
	//UserService.getUserRoles();

	// Refresh the client side session object when the page is reloaded.
	AuthService.refreshSession();

}]);