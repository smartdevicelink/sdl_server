'use strict';

/**
 * Vehicles controller handles the logic to display, search, and modify a list of vehicles.
 * @param $filter used for formatting data displayed to the user.
 * @param $scope local scope shared between the application's view and this controller.
 * @param $state ui-router method(s) and variable(s) for navigation between views.
 * @param DataTableService helper service to create, view, and modify data in a table.
 * @param SubNavService helper service to display a sub navigation designed for control buttons.
 */
angular.module('SDL.vehicles', []).controller('vehiclesCtrl', ['$filter', '$scope', '$state', 'DataTableService', 'SubNavService', function($filter, $scope, $state, DataTable, SubNav){
	// Name of the data table in the view.  This must be unique.
	var tableName = "vehiclesTable";

	// Create the data table and populate it with data.
	DataTable.createAndPopulate(tableName, 'vehicles');

	// Create and show the sub navigation.
	SubNav.show(SubNav.create(
		// Create a New button to navigate to the create vehicle page.
		SubNav.createBtn("New Car", false, function() { $state.transitionTo("carCreate"); }),
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
	}

}]);