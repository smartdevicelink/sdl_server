'use strict';

/**
 * Http Request Interceptor will intercept all http requests and perform
 * general actions, such as error handling.
 */
angular.module('SDL.httpRequestInterceptorService', []).factory('httpRequestInterceptor', function ($q, $rootScope, Alert, ALERTS) {
		$rootScope.responseError = undefined;
		return {
			/*'request': function (request) {
			 console.log("Request")
			 console.log(request);
			 return request; //$q.resolve();
			 },

			 'requestError': function(rejection) {
			 console.log("requestError")
			 console.log(rejection);
			 return $q.reject(rejection);
			 },*/

			'response': function(response) {
				// Remove error alerts.
				if($rootScope.responseError) {
					Alert.removeAllGroup("httpRequestInterceptor");
					$rootScope.responseError = undefined;
				}

				return response;
			},

			'responseError': function(rejection) {
				Alert.removeAllGroup("httpRequestInterceptor");

				// TODO:  Handle other errors such as 404, 403, 500, etc.
				switch(rejection.status) {
					case 0: // Show an alert for no connection to server.
						Alert.addUnsticky("Error connecting to server, please try your request again...", "danger", "httpRequestInterceptor");
						break;

					default:
						console.log(rejection);
						//Alert.addUnsticky(rejection.data.error, "danger", "httpRequestInterceptor");
						break;
				}

				$rootScope.responseError = rejection.status;
				return $q.reject(rejection);
			}

		}
	});

