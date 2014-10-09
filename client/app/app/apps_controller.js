'use strict';

/**
 * Applications controller handles the logic to display, search, and modify a
 * list of applications.
 * @param $filter used for formatting data displayed to the user.
 * @param $q a promise/deferred implementation.
 * @param $rootScope parent scope for the entire application.
 * @param $scope local scope shared between the application's view and this controller.
 * @param $state ui-router method(s) and variable(s) for navigation between views.
 * @param CacheService stores static information retrieved from the backend server.
 * @param DataTableService helper service to create, view, and modify data in a table.
 * @param SubNavService helper service to display a sub navigation designed for control buttons.
 */
angular.module('SDL.apps', []).controller('appsCtrl', ['$filter','$q', '$rootScope', '$scope', '$state', 'CacheService', 'DataTableService', 'SubNavService', function($filter, $q, $rootScope, $scope, $state, CacheService, DataTable, SubNav) {
	// Name of the data table in the view.  This must be unique.
	var tableName = "appsTable";

	// Method to format application data from the backend server
	// to be used in the client side table view.
	var formatAppData = function(apps, next) {
		for(var i = apps.length-1; i>=0; --i) {

			// Apps should be unselected.
			apps[i].selected = false;

			// Apps should display the current status of development, production, or deactivated.
			if(apps[i].activated) {
				apps[i].status = (apps[i].development) ? 'Development' : 'Production';
			} else {
				apps[i].status = 'Deactivated';
			}
		}

		// Return the reformatted list of apps.
		return next(undefined, apps);
	};

	// Create the data table in the $rootScope and populate it with data.
	DataTable.createAndPopulate(tableName, 'applications', formatAppData);

	// Create and show the sub navigation bar.
	SubNav.show(SubNav.create(
		// Create a New button to navigate to the create application page.
		SubNav.createBtn("New App", false, function() { $state.transitionTo("appCreate"); }),
		// Create a Search button to the toggle the display of the table's search filters.
		SubNav.createBtn("Search", false, function() { DataTable.clearFilters(tableName); $scope.show_filter = ! $scope.show_filter;}),
		// Create Delete button to toggle the display of a DataTable's delete functionality.
		SubNav.createBtn("Delete", false, function() { DataTable.enableSelected(tableName, undefined, true); })
	));

	// Expose the DataTable select an item method for the table view.
	$scope.selectItem = function(value) {
		DataTable.selectItem(tableName, value);
	};

	// Expose the DataTable select all items method for the table view.
	$scope.selectAllItems = function(value) {
		DataTable.selectAllItems(tableName, value);
	};

	// Expose the DataTable delete all selected items method for the table view.
	$scope.deleteSelectedApps = function() {
		DataTable.deleteAllSelectedItems(tableName);
		SubNav.toggleRightBtn();
	};

	// Set the options available in the status filter select box.
	$scope.statusFilterOptions = function() {
		var promise = $q.defer();

		// Set the status options.
		var options = [
			{ id: "Development", title: "Development" },
			{ id: "Deactivated", title: "Deactivated" },
			{ id: "Production", title: "Production" }
		];

		promise.resolve(options);
		return promise;
	};

	// Set the options available in the sdl category filter select box.
	$scope.sdlCategoryFilterOptions = function() {
		var promise = $q.defer();

		// Get the list of SDL categories from the Cache service.
		var sdlCategories = CacheService.get('sdlCategories');

		// Create a list of option objects from the SDL categories.
		var options = [];
		for(var i = sdlCategories.length-1; i >= 0; --i) {
			options.push({ id: sdlCategories[i].name, title: sdlCategories[i].name });
		}

		promise.resolve(options);
		return promise;
	};

}]);
