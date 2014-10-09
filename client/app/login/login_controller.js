'use strict';

/**
 * Login controller handles the components of the login page.  It does not handle
 * session(s) or authentication.  Simply attempting to login.
 * @param $cookies provides read/write access to browser's cookies
 * @param $scope local scope shared between the application's view and this controller.
 * @param $state ui-router method(s) and variable(s) for navigation between views.
 * @param AuthService contains authentication and authorization methods.
 */
angular.module('SDL.login', []).controller('loginCtrl', ['$cookies', '$scope', '$state', 'AuthService', function($cookies, $scope, $state, AuthService){

	//TODO: Remove me before production.
	$scope.credentials = {
		username: "superadmin@localhost.com",
		password: "IOlQ9V6Tg6RVL7DSJFL248723Bm3JjCF34FI0TJOVPvRzz"
	};

	// Attempt to login a user using a username and password.
	$scope.signIn = function(credentials) {

		// Use the auth service to perform a login attempt.
		AuthService.login(credentials).then(function() {

			// Login Success
			// A session was created for the now authenticated user.

			// If the user received the login page as a result of a failed authentication
			// then the user will be redirect to the page they were attempting to access.
			// Otherwise, the user will be redirect to the default home page state "otherwise".
			$state.transitionTo(($cookies.loginRedirectToState === "undefined" || $cookies.loginRedirectToState === undefined) ? "otherwise" : $cookies.loginRedirectToState);

			// Clear the stored login redirect location after we use it.
			$cookies.loginRedirectToState = undefined;
		}, function() {

			// Login Failure
			// An alert should automatically be shown to the user with the error message.

		});
	}
}]);