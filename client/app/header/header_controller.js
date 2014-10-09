'use strict';

/**
 * Header controller is a child of the Body controller.  Handles navigation(s) and
 * other elements in the header.
 * @param $rootScope parent scope for the entire application.
 * @param $scope local scope shared between the application's view and this controller.
 */
angular.module('SDL.header', []).controller('headerCtrl', ['$rootScope', '$scope', function($rootScope, $scope) {

	// Hack for bootstrap to work correctly?  I don't remember.
	$scope.navCollapsed = true;

	// Watch for state changes and update the current active tab.
	$rootScope.$on('$stateChangeStart' , function(event, toState) {
		if (toState) {
			$scope.activeTab = toState.activeTab;
		}
	});

}]);