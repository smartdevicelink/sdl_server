'use strict';

angular.module('SDL.userCreate', []).controller('userCreateCtrl', function($scope, $rootScope, $state, SubNavService) {
		//TODO: See if we need this, probably not.
		/* Load the previous state from cache, if cached. */
		var fromState = ($rootScope.fromState) ? $rootScope.fromState : 'users';
		var fromParams = ($rootScope.fromParams) ? $rootScope.fromParams : undefined;

		// Create the sub navigation.  (You can copy past this code)
		SubNavService.show(SubNavService.create(
			SubNavService.createBtn("New User", true),
			undefined,
			SubNavService.createBtn("Cancel", false, function() { $state.transitionTo(fromState, fromParams)})
		));
	});
