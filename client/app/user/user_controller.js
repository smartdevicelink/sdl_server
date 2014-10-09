'use strict';

/**
 */
angular.module('SDL.user', []).controller('userCtrl', function($scope, $rootScope, $state, Session, SubNavService, DataForm, UserService, Alert, EVENTS, ALERTS) {
	var pageName = "user";    // Set the data form page name in the root scope.

	// Create the header sub navigation.  (You can copy past this code)
	SubNavService.show(SubNavService.create(
		SubNavService.createBtn("New User", false, function() { $state.transitionTo("userCreate"); }),
		undefined,
		SubNavService.createBtn("Delete", false, function() { DataForm.deleteItem(pageName, function() { SubNavService.clickRightBtn(); }); })
	));

	// Create the sidebar navigation for the data form.
	var forms = [{
		id: "userInfoForm",
		name: "Info",
		isDisabledOnCreate: false
	}, {
		id: "securityForm",
		name: "Security",
		isDisabledOnCreate: true
	}];

	/**
	 * Unlock a user by clearing the failed login property and
	 * ensuring the user is activated.
	 */
	var unlockUserById = function(userId) {
		// Make a request to clear the failed logins property.
		var clearFailedLogins = UserService.clearFailedLogins(userId);

		// After the promise returns, update the data form.
		clearFailedLogins.then(function(user) {
			if(user) {
				DataForm.updateField(pageName, "failedLoginAttempts", user.failedLoginAttempts);
				DataForm.updateField(pageName, "activated", user.activated);
			}
		});
	};

	/**
	 * Format the data recieved from the server to be displayed
	 * in the data form.
	 */
	var formatDataFn = function(user, next) {
		// Get the most permissive user role from the user's roles
		for(var i = user.roles.length-1; i >=0; --i) {
			if(user.role === undefined || user.roles[i].index < user.role.index) {
				user.role = user.roles[i];
			}
		}

		// Create a human readable data for Date Created.
		var dateCreated = new Date(user.dateCreated);
		user.dateCreated = (dateCreated.getMonth() + 1) + '/' + dateCreated.getDate() + '/' + dateCreated.getFullYear()+" "+dateCreated.getHours()+":"+dateCreated.getMinutes();

		// Create a human readable data for Last Login.
		var lastLogin = new Date(user.lastLogin);
		user.lastLogin = (lastLogin.getMonth() + 1) + '/' + lastLogin.getDate() + '/' + lastLogin.getFullYear()+" "+lastLogin.getHours()+":"+lastLogin.getMinutes();

		// If the current user is a profile page, apply updates to
		// the session based on the server's response.
		if(user._id === Session.user._id) {
			Session.update(angular.copy(user));
		}

		// Continue on.
		next(undefined, user);
	};

	// After the data has finished loading and the form is setup
	// add an alert if the user is locked out for security reasons.
	var next = function(err, user) {
		if(user.failedLoginAttempts >= 5) {
			Alert.addUnsticky(
				"This account has been locked for security reasons.",
				ALERTS.types.danger,
				"user",
				{
					"text": "Unlock",
					"type": ALERTS.types.success,
					"ngClick": function(alertIndex) {
						unlockUserById(DataForm.getItem(pageName)._id);
						Alert.removeByIndex(alertIndex);
					}
				},
				true
			);
		}
	};

	// Create the data form.
	DataForm.create(pageName, "users", forms, {  }, "user", formatDataFn, next);

	/**
	 * Clear the form's data and reset it back to its original state.
	 */
	$scope.clearForm = function(form, formId) {
		DataForm.clearForm(pageName, form, formId);
	};

	/**
	 * Switch between forms by form ID.
	 */
	$scope.switchForm = function(formId) {
		DataForm.switchForm(pageName, formId);
	};

	/**
	 * Submit a form to the backend server.
	 */
	$scope.submit = function(form) {
		DataForm.submitForm(pageName, form);
	}
});