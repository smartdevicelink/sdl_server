'use strict';

/**
 */
angular.module('SDL.authService', []).factory('AuthService', ['$http', '$location', '$rootScope', '$q', '$log', 'Session', 'Alert', 'UserService', 'AUTH_EVENTS', function($http, $location, $rootScope, $q, $log, Session, Alert, UserService, AUTH_EVENTS) {
		return {

			/**
			 * Attempt to login the user to the backend server.
			 */
			login: function(credentials) {
				return $http.post('/login.json', credentials).success(function(data, status, headers, config) {

					// Remove any alerts generated from invalid logins.
					Alert.removeAllGroup(AUTH_EVENTS.loginFailed);

					// Create a new user session.
					Session.create(data.response);
					$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
				}).error(function(data, status, headers, config) {

					// Add an alert with the login error message.
					Alert.removeAllGroup(AUTH_EVENTS.loginFailed);
					Alert.addUnsticky(data.error, 'danger', AUTH_EVENTS.loginFailed);
					$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
				});
			},

			/**
			 * Attempt to logout the user from the backend server.
			 */
			logout: function() {
				return $http.post('/logout.json').success(function(data, status, headers, config) {

					// Remove any alerts generated from invalid logins/logouts.
					Alert.removeAllGroup(AUTH_EVENTS.logoutFailed);
					Alert.removeAllGroup(AUTH_EVENTS.loginFailed);

					// Destroy the local client session.
					Session.destroy();

					// Broadcast Event for successful logout.
					$rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
				})
					.error(function(data, status, headers, config) {

						// Add alert message with details about unsuccessful logout.
						Alert.addUnsticky(data.error, 'danger', AUTH_EVENTS.logoutFailed);

						// Broadcast Event for failure logging out.
						$rootScope.$broadcast(AUTH_EVENTS.logoutFailed);
					});
			},

			/**
			 * Attempt to refresh the client session information with data from
			 * the backend server.  This also refreshes the list of possible user
			 * roles, since they are needed for session user population.
			 */
			refreshSession: function() {
				// Create a promise
				var deferred = $q.defer();

				// Update the user roles list.
				UserService.getUserRoles().then(function() {

					// Get the current user's session from the backend server, if it exists.
					$http.get('/login/user.json').success(function(data, status, headers, config) {

						// Attempt to create a new session. If user object is invalid then a session will not be created.
						Session.update(data.response);

						// Resolve the promise returning the session object.
						deferred.resolve(Session);
					}).error(function(data, status, headers, config) {

						// Error occurred trying to get the current session.
						$log.debug("Refresh Session: Error");
						$log.error(data);

						// Resolve the promise with an error.
						deferred.reject(data);
					});
				}, function(error) {
					// User roles lookup failed, abort the refresh attempt.
					deferred.reject(error);
				});

				// Set the session's refresh promise.
				Session.setRefreshPromise(deferred.promise);

				// Return the session's refresh promise.
				return Session.getRefreshPromise();
			},

			/**
			 * Returns whether or not the user is authenticated.
			 */
			isAuthenticated: function() {
				return !!Session.id;
			},

			/**
			 * Returns whether or not the user contains the permission to
			 * access content.  The content's authorized roles are passed
			 * as an array into this method.
			 */
			isAuthorized: function(authorizedRoles) {
				// If the authorized roles is undefined, then non-authenticated
				// users can access the content, return true.
				if(authorizedRoles === undefined) {
					return true;
				}

				// Check if the user is authenticated.
				if( ! this.isAuthenticated()) {
					return false;
				}

				// If authorized roles is empty, then all authenticated users
				// can access the content.
				if(authorizedRoles === []) {
					return true;
				}

				// Ensure that authorized roles is an array.
				if (!angular.isArray(authorizedRoles)) {
					authorizedRoles = [ authorizedRoles ];
				}

				// If the role "all" is present, then all authenticated users can
				// access the content, return true.
				if(authorizedRoles.indexOf('all') !== -1) {
					return true;
				}

				// If the user contains an authorized role then they are authorized
				// to access the content, otherwise return false.
				//TODO: or higher?
				return (authorizedRoles.indexOf(Session.userRole.queryName) !== -1);
			}
		}
	}]);
