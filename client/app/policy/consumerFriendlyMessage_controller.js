'use strict';

/**
 */
angular.module('SDL.consumerFriendlyMessage', []).controller('consumerFriendlyMessageCtrl', [ '$rootScope', '$scope', '$state', '$stateParams', 'DataForm', 'DataTableService', 'SubNavService',function($rootScope, $scope, $state, $stateParams, DataForm, DataTable, SubNav) {
	var pageName = "cfm",
		  tableName = "messagesTable",
			messagesFormName = "messagesForm";

	// Create the sub navigation.  (You can copy past this code)
	SubNav.show(SubNav.create(
		SubNav.createBtn("New Message", false, function() { $state.transitionTo("consumerFriendlyMessageCreate"); }),

		SubNav.createBtn("Search", false, function() { DataTable.clearFilters(tableName); $scope.show_filter = ! $scope.show_filter;}, undefined, undefined, ($stateParams["activeFormId"] === messagesFormName)),

		SubNav.createBtn("Delete", false, function() { DataForm.deleteItem(pageName, function() { SubNav.clickRightBtn(); }); })
	));

	var forms = [{
		id: "infoForm",
		name: "Info",
		isDisabledOnCreate: false
	}, {
		id: messagesFormName,
		name: "Messages",
		isDisabledOnCreate: true
	}];

	function createDataTable(err, data) {
		if(err) {
			console.log(err);
		} else {
			if( ! data || ! data.messages){
				return
			}
			DataTable.create(tableName, data.messages);
		}
	}

	DataForm.create(pageName, "consumerFriendlyMessages", forms, { version: "000.000.001"}, "consumerFriendlyMessages", undefined, undefined, createDataTable);


	$scope.clearForm = function(form, formId) {
		DataForm.clearForm(pageName, form, formId);
	};

	$scope.switchForm = function(formId) {

		// Show/Hide search button.
		$rootScope.subNav.middleBtn.enabled = (formId === messagesFormName);

		DataForm.switchForm(pageName, formId);
	};

	$scope.submit = function(form) {
		DataForm.submitForm(pageName, form);
	}

	$scope.goToMessageType = function(id) {
		$state.transitionTo("messageType", { "id": id, "activeFormId": "languagesForm", "consumerFriendlyMessageId": DataForm.getItemId(pageName) });
	};

	$scope.showDeleteMessageTypes = false;

	$scope.createNewMessageType = function() {
		$state.transitionTo("messageTypeCreate", { "consumerFriendlyMessageId": DataForm.getItemId(pageName) });
	};

	$scope.deleteMessageTypes = function() {
		$scope.showDeleteMessageTypes = ! $scope.showDeleteMessageTypes;
		DataTable.enableSelected(tableName, $scope.showDeleteMessageTypes, true);
	};

	// Expose the Select Item method for the data table.
	$scope.selectItem = function(value) {
		DataTable.selectItem(tableName, value);
	};

	// Expose the Select All Items method for the data table.
	$scope.selectAllItems = function(value) {
		DataTable.selectAllItems(tableName, value);
	};

	$scope.deleteSelected = function() {
		$scope.showDeleteMessageTypes = false;
		DataTable.deleteAllSelectedSubItems(tableName, function(err, data){
			if(err) {
				return Error.display(err);
			}

			if(! data) {
				return Error.display(new Error("Problem occurred while deleting the selected message types."));
			}
			var obj = DataForm.getItemCopy(pageName);

			obj.messages = data;

			for(var i = obj.messages.length-1; i >=0; --i) {
				if( typeof(obj.messages[i]) === 'object' ) {
					obj.messages[i] = obj.messages[i]._id;
				}
			}

			DataForm.updateItem(pageName, undefined, obj, function(err, data) {
				if(err) {
					Error.display(err);
				}
			});
		});
	};

}]);