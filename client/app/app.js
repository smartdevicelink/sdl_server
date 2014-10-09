"use strict";

var modules = [
  'ui.bootstrap',
  'ui.router',
  'ngRoute',
  'ngCookies',
  'ngTable',
  'ngGrid',
  'restangular',

	'SDL.sessionService',
	'SDL.cacheService',
	'SDL.authService',
	'SDL.userService',
	'SDL.dataFormService',
	'SDL.dataTableService',
	'SDL.subNavService',
	'SDL.httpRequestInterceptorService',
	'SDL.alertService',
	'SDL.languageService',
	'SDL.errorService',

	'SDL.showErrorsDirective',
	'SDL.ngThumbDirective',

	'SDL.userCreate',
	'SDL.login',
	'SDL.header',
	'SDL.apps',
	'SDL.app',
	'SDL.users',
	'SDL.user',
	'SDL.vehicles',
	'SDL.vehicle',
	'SDL.register',
	'SDL.consumerFriendlyMessages',
	'SDL.consumerFriendlyMessage',
	'SDL.functionalGroups',
	'SDL.functionalGroup',
	'SDL.messageType',
	'SDL.body',

	'SDL.iff',

  'toggle-switch',
  'angularFileUpload'
];

var app = angular.module('SDL', modules)
  .constant('DEBUG', {
    debug: true,       // Toggle on/off display of all log messages.
    emit: false,       // When enabled, logs all emit messages in the application.
    session: false,    // When enabled, logs information about the user's session(s).
    routes: false      // When enabled, logs information about routes and states.
  })
  .constant('ALERTS', {
    added: 'alerts-added-event',
    removed: 'alerts-removed-event',
    remove: 'alerts-remove-event',
    add: 'alerts-add-event',
    types: {
      'default': 'danger',
      'error': 'danger',
      'danger': 'danger',
      'info': 'info',
      'success': 'success',
      'warning': 'warning'
    }
  })
  .constant('EVENTS', {
    alertsUpdated: 'alerts-updated-event',
		languagesUpdated: 'languages-updated-event',
    sessionRefreshing: 'session-refreshing-event',
    sessionUpdated: 'session-updated-event',
    sessionDestroyed: 'session-destroyed-event',
    error: 'error-event'
  })
  .constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    logoutFailed: 'auth-logout-failed'
  })
  .constant('USER_ROLES', {
    all: 'all',
    self: 'self',
    superadmin: 'superadmin',
    admin: 'admin',
    moderator: 'moderator',
    user: 'user',
    guest: 'guest'
  });


app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  var adminRoles = [ 'superadmin', 'admin' ];
  var allRoles = [ 'all' ];

  $stateProvider

    /******** No Authentication Required ********/

    .state('login', { url: '/login', templateUrl: '/login/login.html', controller: 'loginCtrl' })
    .state('register', { url: '/register', templateUrl: '/user/register.html', controller: 'registerCtrl' })

    /******** Authentication Required ********/

    .state('users', { url: '/users', templateUrl: '/user/users.html', controller: 'usersCtrl', activeTab: 'users', roles: allRoles })
    .state('userCreate', { url: '/users/create', templateUrl: '/user/create.html', controller: 'userCreateCtrl', activeTab: 'users', roles: allRoles })
    .state('user', { url: '/users/:id?activeFormId', templateUrl: '/user/user.html', controller: 'userCtrl', activeTab: 'profile', activeForm: '', roles: allRoles })

    .state('apps', { url: '/apps', templateUrl: '/app/apps.html', controller: 'appsCtrl', activeTab: 'apps', roles: allRoles })
    .state('appCreate', { url: '/apps/create', templateUrl: '/app/app.html', controller: 'appCtrl', activeTab: 'apps', roles: allRoles })
    .state('app', { url: '/apps/:id?activeFormId', templateUrl: '/app/app.html', controller: 'appCtrl', activeTab: 'apps', activeForm: '', roles: allRoles })

    .state('cars', { url: '/cars', templateUrl: '/vehicle/vehicles.html', controller: 'vehiclesCtrl', activeTab: 'cars', roles: allRoles })
    .state('carCreate', { url: '/cars/create', templateUrl: '/vehicle/vehicle.html', controller: 'vehicleCtrl', activeTab: 'cars', roles: allRoles })
    .state('car', { url: '/cars/:id?activeFormId', templateUrl: '/vehicle/vehicle.html', controller: 'vehicleCtrl', activeTab: 'cars', roles: allRoles })

    .state('policies', { url: '/policies', templateUrl: '/policy/policies.html', controller: 'policiesCtrl', activeTab: 'policies', roles: allRoles })
    .state('consumerFriendlyMessages', { url: '/consumerFriendlyMessages', templateUrl: '/policy/consumerFriendlyMessages.html', controller: 'consumerFriendlyMessagesCtrl', activeTab: 'policies', roles: allRoles })
    .state('consumerFriendlyMessageCreate', { url: '/consumerFriendlyMessages/create', templateUrl: '/policy/consumerFriendlyMessage.html', controller: 'consumerFriendlyMessageCtrl', activeTab: 'policies', roles: allRoles })
    .state('consumerFriendlyMessage', { url: '/consumerFriendlyMessages/:id?activeFormId', templateUrl: '/policy/consumerFriendlyMessage.html', controller: 'consumerFriendlyMessageCtrl', activeTab: 'policies', roles: allRoles })

		.state('messageTypeCreate', { url: '/messageTypes/create?consumerFriendlyMessageId', templateUrl: '/policy/messageType.html', controller: 'messageTypeCtrl', activeTab: 'policies', roles: allRoles })
		.state('messageType', { url: '/messageTypes/:id?activeFormId&consumerFriendlyMessageId', templateUrl: '/policy/messageType.html', controller: 'messageTypeCtrl', activeTab: 'policies', roles: allRoles })

		.state('functionalGroups', { url: '/functionalGroups', templateUrl: '/policy/functionalGroups.html', controller: 'functionalGroupsCtrl', activeTab: 'policies', roles: allRoles })
		.state('functionalGroupCreate', { url: '/functionalGroups/create', templateUrl: '/policy/functionalGroup.html', controller: 'functionalGroupCtrl', activeTab: 'policies', roles: allRoles })
		.state('functionalGroup', { url: '/functionalGroups/:id?activeFormId', templateUrl: '/policy/functionalGroup.html', controller: 'functionalGroupCtrl', activeTab: 'policies', roles: allRoles })

    /******** Unhandled Routes ********/

    .state('otherwise', { url: "*path", templateUrl: '/user/users.html', controller: 'usersCtrl', activetab: 'users', roles: allRoles});


    // Hide hasbangs.
    $locationProvider.html5Mode(true);
});

/**
 * Enable or disable debug mode.
 */
app.config(function($logProvider, DEBUG) {
  $logProvider.debugEnabled(DEBUG.debug);
});

/**
 * Formats an API response so that restangular can parse it.
 */
app.config(function(RestangularProvider) {
  RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
    // Get data from the response property.
    return data.response;
  });

  // Set restangular to use the '_id' field rather than 'id'.
  RestangularProvider.setRestangularFields({
    id: "_id"
  });

  //RestangularProvider.setBaseUrl('http://sdl.livioconnect.com');
  RestangularProvider.setRequestSuffix('.json');
});

/**
 * Handle subscribe and emit efficiently. 
 */
app.config(['$provide', function($provide){
  $provide.decorator('$rootScope', ['$delegate', function($delegate){

    Object.defineProperty($delegate.constructor.prototype, '$onRootScope', {
      value: function(name, listener) {
        var unsubscribe = $delegate.$on(name, listener);
        this.$on('$destroy', unsubscribe);
        return unsubscribe;
      },
      enumerable: false
    });

    return $delegate;
  }]);
}]);

/**
 * Log all emits that occur in the application.  Used only for debug purposes
 */
app.config(['$provide', 'DEBUG', function ($provide, DEBUG) {
  if(DEBUG.emit) {
    $provide.decorator('$rootScope', function ($delegate) {
      var _emit = $delegate.$emit;

      $delegate.$emit = function () {
        console.log.apply(console, arguments);
        _emit.apply(this, arguments);
      };

      return $delegate;
    });
  }
}]);

/**
 * Inject an HTTP request interceptor to handle general 
 * request actions, such as error handling.
 */
app.config( function ($httpProvider) {
    $httpProvider.interceptors.push('httpRequestInterceptor');
});

app.run(['$rootScope', 'AuthService', '$cookies', '$state', '$log', 'Restangular', 'Session', 'Alert', 'SubNavService', 'EVENTS', 'DEBUG', 'ALERTS', function ($rootScope, AuthService, $cookies, $state, $log, Restangular, Session, Alert, SubNavService, EVENTS, DEBUG, ALERTS) {

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    //console.log("Route Change Start");
  });

  $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
		if(DEBUG.routes) {  $log.debug("State Change Successful: '" + toState.name + "', Params: " + JSON.stringify(toParams));  }
    SubNavService.hide();

		if(fromState !== undefined && ! $rootScope.doNotTrackTransition) {
			if ($rootScope.fromState === undefined) {
				$rootScope.fromState = [ fromState ];
				$rootScope.fromParams = (fromParams !== undefined) ? [ fromParams ] : [
					{}
				];
			} else {
				if ($rootScope.fromState.length >= 10) {
					$rootScope.fromState.splice(0, 1);
					$rootScope.fromParams.splice(0, 1);
				}

				if ($rootScope.fromState[$rootScope.fromState.length - 1] !== fromState) {
					$rootScope.fromState.push(fromState);
					$rootScope.fromParams.push((fromParams !== undefined) ? fromParams : {});
				}
			}
		}
		$rootScope.doNotTrackTransition = false;

    // On a successful state change, remove all unsticky alerts.
    Alert.removeAllUnsticky();
  });

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    if(DEBUG.routes) {  $log.debug("State Change: '" + fromState.name + "' --> '" + toState.name +"'");  }

    // Authentication required?
    if(toState.roles !== undefined) {

      // Check if a session refresh is in progress, if one is
      // then wait for the refresh before proceeding.
      if(Session.getRefreshPromise() !== undefined) {
        if(DEBUG.routes) {  $log.debug("State Change:  ...waiting for session to refresh.");  }
        event.preventDefault();

        // When the session is finished refreshing
        Session.getRefreshPromise().then(function() {

          // Check if user has logged in.
          if( ! AuthService.isAuthenticated()) {

            // Store the location they were trying to access so we can redirect
            // the user there after they login.
            $cookies.loginRedirectToState = toState.name;

            // Redirect to the login page.
            $state.transitionTo("login");

            // Check if the user is authorized to access the page.
          } else if( ! AuthService.isAuthorized(toState.roles)) {

            // User is not authorized so show an alert.
            Alert.addUnsticky("You are not authorized to access " + toState.url, "danger", EVENTS.error);

            // User is authenticated and authorized
          } else {
            // Redirect the user to their destination.
            $state.transitionTo(toState.name);
          }
        }, function(error) {
          // An error occurred so show the error message.
          Alert.addUnsticky(error, "danger", EVENTS.error);
        });
      } else {
        // Check if user has logged in.
        if( ! AuthService.isAuthenticated()) {
          event.preventDefault();

          // Store the location they were trying to access so we can redirect
          // the user there after they login.
          $cookies.loginRedirectToState = toState.name;

          // Redirect to the login page.
          $state.transitionTo("login");

          // Check if the user is authorized to access the page.
        } else if( ! AuthService.isAuthorized(toState.roles)) {
          event.preventDefault();

          // User is not authorized so show an alert.
          Alert.addUnsticky("You are not authorized to access " + toState.url, "danger", EVENTS.error);

          // User is authenticated and authorized
        }

        // Otherwise do nothing and the user will be routed to their destination.
      }
    }

    // Authentication is not required so the user will be routed to their destination.
  });

  $rootScope.$on('$locationChangeStart', function(event, newUrl, currentUrl) {
    //console.log("Location Change Start")
  });

  $rootScope.$on('$routeChangeError', function(ev, current, previous, rejection) {
    //console.log("Route Change Error");
  });

  $rootScope.$on('locationChangeSuccess', function(event, newUrl, currentUrl) {
    //console.log("Location Change Success");
  });

}]);