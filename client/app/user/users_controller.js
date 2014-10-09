'use strict';

/**
 * Users controller handles the logic to display, search, and modify a list of users.
 * @param $q a promise/deferred implementation.
 * @param $scope local scope shared between the application's view and this controller.
 * @param $state ui-router method(s) and variable(s) for navigation between views.
 * @param DataTableService helper service to create, view, and modify data in a table.
 * @param SubNavService helper service to display a sub navigation designed for control buttons.
 */
angular.module('SDL.users', []).controller('usersCtrl', ['$q', '$scope', '$state', 'DataTableService', 'SubNavService', function($q, $scope, $state, DataTable, SubNav){
	// Name of the data table in the view.  This must be unique.
	var tableName = "usersTable";

	// Method to format user data from the backend server
	// to be used in the client side tables.
	var formatUserData = function(users, next) {
		for(var i = users.length-1; i>=0; --i) {

			// Create full name attribute from the first and last name.
			users[i].fullName = (users[i].lastName) ? users[i].lastName + ", " + users[i].firstName : users[i].firstName;

			// Create status attribute of activated or deactivated.
			users[i].status = (users[i].activated) ? "Activated" : "Deactivated";

			// If the user has a role, add the name to the roles string with the first
			// letter capitalized.  If the user has no roles, then add a blank string.
			var roles = (users[i].roles && users[i].roles.length > 0) ? users[i].roles[0].name.charAt(0).toUpperCase() + users[i].roles[0].name.slice(1) : "";

			// For every role after that add the next role to the string using a
			// comma to separate the roles.  Also capitalize the first letter of each role.
			for(var y = 1; y < users[i].roles.length; y++) {
				roles += ", " + users[i].roles[y].name.charAt(0).toUpperCase() + users[i].roles[y].name.slice(1);
			}

			// Add the role string attribute.
			users[i].roles = roles;
		}

		// Return the updated list of users.
		return next(undefined, users);
	};

	// Create the data table and populate it with data.
	DataTable.createAndPopulate(tableName, 'users', formatUserData);

	// Create and show the sub navigation.
	SubNav.show(SubNav.create(
		// Create a New button to navigate to the create user page.
		SubNav.createBtn("New User", false, function() { $state.transitionTo("userCreate"); }),
		// Create a Search button to the toggle the display of the table's search filters.
		SubNav.createBtn("Search", false, function() { DataTable.clearFilters(tableName); $scope.show_filter = ! $scope.show_filter;}),
		// Create Delete button to toggle the display of a DataTable's delete functionality.
		SubNav.createBtn("Delete", false, function() { DataTable.enableSelected(tableName, undefined, true); })
	));

	// Expose the Select Item method for the data table.
	$scope.selectItem = function(value) {
		DataTable.selectItem(tableName, value);
	};

	// Expose the Select All Items method for the data table.
	$scope.selectAllItems = function(value) {
		DataTable.selectAllItems(tableName, value);
	};

	// Expose the DataTable delete all selected items method for the table view.
	$scope.deleteSelected = function() {
		DataTable.deleteAllSelectedItems(tableName);
		SubNav.toggleRightBtn();
	};

	// Set the options available in the status filter select box.
	$scope.statusFilterOptions = function() {
		var promise = $q.defer();

		// Set the status options.
		var options = [
			{ id: "Activated", title: "Activated" },
			{ id: "Deactivated", title: "Deactivated" }
		];

		promise.resolve(options);
		return promise;
	};

}]);