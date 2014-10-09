
'use strict';

/**
 * Session stores data related to the current user.
 */
angular.module('SDL.sessionService', []).service('Session', ['EVENTS', '$rootScope', '$log', function(EVENTS, $rootScope, $log, user) {
	// Regular Expression used to check if a string is a possible object ID.
	var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

	// Date and time of the last time the session was created, destroyed, or refreshed.
	// Use this to check if we have recently queried the backend API for an authenticated user.
	this.lastSessionRefresh = undefined;

	// When a session refresh occurs this promise value should be set so others are aware that
	// the session may be changing and can subscribe to the result of the session update.
	this.deferredRefreshPromise = undefined;


	/**
	 * Create a new session for an authenticated user.
	 */
	this.create = function(user) {
		// Validate the user object.
		if( ! user || user._id === undefined) {
			$log.debug("Cannot create user session, because user object is invalid.");
			return;
		}

		this.id = user._id
		this.user = user;
		this.setUserRole(user.roles);

		this.lastSessionRefresh = Date.now();
		this.deferredRefreshPromise = undefined;

		$rootScope.$broadcast(EVENTS.sessionUpdated);
	};

	/**
	 * Update the current session with new information or create a new session.
	 * If the session info is not new then the session updated event will not
	 * be broadcasted, however the lastSessionRefresh variable will be updated.
	 */
	this.update = function(user) {
		// Validate the user object.
		if( ! user || user._id === undefined) {
			$log.debug("Cannot create user session, because user object is invalid.");
			return false;
		}

		// Check if the session data needs to be updated.
		if(this.id === undefined || (this.id !== undefined && this.user !== user)) {
			this.id = user._id
			this.user = user;
			this.setUserRole(user.roles);
			this.lastSessionRefresh = Date.now();
			this.deferredRefreshPromise = undefined;
			$rootScope.$broadcast(EVENTS.sessionUpdated);

			return true;
		}

		// Session info was not update, but we successfully refreshed the session data.
		this.lastSessionRefresh = Date.now();
		return false;
	}

	/**
	 * Destroy the current session object, affectively logging
	 * a user out on the client side.
	 */
	this.destroy = function() {
		this.id = undefined;
		this.user = undefined;
		this.userRole = undefined;
		this.lastSessionRefresh = Date.now();
		this.deferredRefreshPromise = undefined;
		$rootScope.$broadcast(EVENTS.sessionDestroyed);
	};

	/**
	 * Returns a session refresh promise if one exists.
	 */
	this.getRefreshPromise = function() {
		return this.deferredRefreshPromise;
	}

	/**
	 * Sets a new session refresh promise.
	 */
	this.setRefreshPromise = function(deferredPromise) {
		this.deferredRefreshPromise = deferredPromise;
		$rootScope.$broadcast(EVENTS.sessionRefreshing);
	}

	/**
	 * Get the last time the client session was updated from the
	 * server backend's session.
	 */
	this.getLastSessionRefresh = function() {
		return this.lastSessionRefresh;
	}

	/**
	 * Get the lowest user role from a list of possible user roles.
	 * Returns undefined if the userRole list is empty or invalid.
	 */
	var getLowestUserRole = function(userRoles) {
		var lowestRole = undefined;
		for(var i = userRoles.length-1; i >=0; --i) {
			if(lowestRole === undefined || userRoles[i].index > lowestRole.index) {
				lowestRole = userRoles[i];
			}
		}
		return lowestRole;
	}

	/**
	 * Get the highest user role from a list of possible user roles.
	 * Returns undefined if the userRole list is empty or invalid.
	 */
	var getHighestUserRole = function(userRoles) {
		var highestRole = undefined;
		for(var i = userRoles.length-1; i >=0; --i) {
			if(highestRole === undefined || userRoles[i].index < highestRole.index) {
				highestRole = userRoles[i];
			}
		}
		return highestRole;
	}

	/**
	 * Checks if a role is already a populated object.
	 */
	var isRolePopulated = function(role) {
		return (typeof role === 'object' && role._id !== undefined);
	}

	/**
	 * Populate a single role Object ID string with the proper
	 * role object from the backend server.
	 * Returns undefined if the ID is invalid.
	 */
	var populateRole = function(role) {
		if(role === undefined || ! checkForHexRegExp.test(role)) {
			$log.error("Cannot populate invalid role id: " + role);
			return undefined;
		}

		for(var i = $rootScope.userRoles.length-1; i >=0; --i) {
			if($rootScope.userRoles[i]._id === role) {
				return $rootScope.userRoles[i];
			}
		}

		$log.error("Could not find role with id: "+ role);
		return undefined;
	}

	/**
	 * Set the user's role to their most permissive role.
	 * Also handles population of an unpopulated list of roles.
	 */
	this.setUserRole = function(roles) {
		// If roles is undefined, set the lowest possible role.
		if(roles === undefined) {
			this.userRole = getLowestUserRole($rootScope.userRoles);
			$log.warn("Cannot set user's role to undefined, defaulting to " +this.userRole.name);

			// If roles is a list of roles, find the highest role and
			// assign this.userRole to that value.
		} else if(roles instanceof Array && roles.length > 0) {

			// Find the user's role that is the most permissive.
			var highestRole = undefined;
			for(var i = roles.length-1; i >= 0; --i) {

				// Ensure the role is populated.
				if( ! isRolePopulated(roles[i])) {
					roles[i] = populateRole(roles[i]);
				}

				if(highestRole === undefined || highestRole.index < roles[i].index) {
					highestRole = roles[i];
				}
			}

			// Set the user's role to their role with the most permission.
			this.userRole = highestRole;

			// If roles is a single object, set this.userRoles to that role.
		} else if(typeof roles === 'object') {
			this.userRole = roles;

			// If we reach here roles is probably a single role that is not yet
			// populated, so attempt to populate it.
		} else {
			// Populate roles.
			var roles = populateRole(roles);

			// If we could not populate roles, it is probably invalid.
			if(roles === undefined) {
				$log.warn("Session detected invalid user role, setting default user role.");

				// Set the role to the lowest possible role.
				this.userRole = getLowestUserRole($rootScope.userRoles);

				// If we populated the role successfully, then set this.userRole to that role value.
			} else {
				this.userRole = roles;
			}
		}
	}

	// Return the session instance.
	return this;
}])
