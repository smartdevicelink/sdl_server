'use strict';

/**
 */
angular.module('SDL.functionalGroups', []).controller('functionalGroupsCtrl', ['$scope', '$state', 'Restangular', 'DataTableService', 'ErrorService', 'SubNavService', function($scope, $state, Restangular, DataTable, Error, SubNav) {
	var tableName = "fgTable",
			restangularUrl = "functionalGroups";


	// Create the data table and populate it with data.
	DataTable.createAndPopulate(tableName, restangularUrl);

	// Create and show the sub navigation.
	SubNav.show(SubNav.create(
		SubNav.createBtn("New Functional Group", false, function() { $state.transitionTo("functionalGroupCreate"); }),
		SubNav.createBtn("Search", false, function() { DataTable.clearFilters(tableName); $scope.show_filter = ! $scope.show_filter;}),
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

	$scope.deleteSelected = function() {
		DataTable.deleteAllSelectedItems(tableName);
	};

	Date.prototype.today = function () {
		return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
	};

	Date.prototype.timeNow = function () {
		return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
	};

	$scope.copy = function(item) {
		//var name = item.name + " (Copied on" + new Date().today() + " " + new Date().timeNow() + ")";
		var name = item.name + " (Copy)";
		Restangular.one(restangularUrl, item._id).post("copy", { "name": name}).then(function (data) {
			DataTable.updateDataById(tableName, data);
		}, function(res) {
			Error.display(res.data.error);
		});
	}

}]);
