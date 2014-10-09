'use strict';

/**
 */
angular.module('SDL.userService', []).factory('UserService', ['$q', '$log', '$http', '$rootScope', function($q, $log, $http, $rootScope) {
		return {
			getAllUsers: function() {
				return $http
					.get('/users.json')
					.success(function(data, status, headers, config) {

					})
					.error(function(data, status, headers, config) {
					});
			},

			/**
			 * Get a list of all the possible user roles from the server.
			 */
			getUserRoles: function() {
				// Create a deferred promise.
				var deferred = $q.defer();

				// Perform the lookup and return the result to the promise.
				$http.get('/userRoles.json').success(function(data, status, headers, config) {
					$rootScope.userRoles = data.response;

					// Sanitize user roles.
					$rootScope.userRolesSanitized = [];
					if(data.response) {
						for(var i = data.response.length-1; i >=0; --i) {
							if(data.response[i] !== undefined && data.response[i].index > 1) {
								$rootScope.userRolesSanitized.push(data.response[i]);
							}
						}
					}

					deferred.resolve($rootScope.userRoles);
				}).error(function(data, status, headers, config) {
					$log.error(data.response);
					deferred.reject(data.response);
				});

				// Return the promise to the caller.
				return deferred.promise;
			},

			clearFailedLogins: function(userId) {
				// Create a deferred promise.
				var deferred = $q.defer();

				$http.post("/users/"+userId+"/clearFailedLoginAttempts.json").success(function(data, status, headers, config) {
					deferred.resolve(data.response);
				}).error(function(data, status, headers, config) {
					deferred.reject(data.response);
				});

				// Return the promise to the caller.
				return deferred.promise;
			}
		}
	}]);