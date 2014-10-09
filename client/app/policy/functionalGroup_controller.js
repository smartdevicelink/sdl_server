'use strict';

angular.module('SDL.functionalGroup', []).controller('functionalGroupCtrl', [ '$rootScope', '$scope', '$state', '$stateParams', 'DataForm', 'DataTableService', 'SubNavService',function($rootScope, $scope, $state, $stateParams, DataForm, DataTable, SubNav) {
	var pageName = "functionalGroup",
			tableName = "rpcsTable",
			rpcsFormName = "rpcsForm",
			createRpcFormName = "createRpcForm"; 	// Name of the create new language form.

	// In order to edit an rpc in the rpcs array we first
	// copy the rpc data here to be modified freely.  When this value
	// is defined, then a rpc form is shown to the user.
	$scope.rpc = undefined;

	// The form in the user's focus.  If there is not a form in focus, this should be a blank object or undefined.
	$scope.currentForm = {};

	$scope.showCreateNewRpcForm = false;

	$scope.deleteRpcs = false;

	// Create the sub navigation.  (You can copy past this code)
	SubNav.show(SubNav.create(
		SubNav.createBtn("New Functional Group", false, function() { $state.transitionTo("functionalGroupCreate"); }),

		SubNav.createBtn("Search", false, function() { DataTable.clearFilters(tableName); $scope.show_filter = ! $scope.show_filter;}, undefined, undefined, ($stateParams["activeFormId"] === rpcsFormName)),

		SubNav.createBtn("Delete", false, function() { DataForm.deleteItem(pageName, function() { SubNav.clickRightBtn(); }); })
	));

	var forms = [{
		id: "infoForm",
		name: "Info",
		isDisabledOnCreate: false
	}, {
		id: rpcsFormName,
		name: "RPCs",
		isDisabledOnCreate: true
	}, {
		id: "propertiesForm",
		name: "Other",
		isDisabledOnCreate: true
	}];

	function createDataTable(err, data) {
		if(err) {
			console.log(err);
		} else {
			if( ! data || ! data.rpcs){
				return
			}
			DataTable.create(tableName, data.rpcs);
		}
	}

	DataForm.create(pageName, "functionalGroups", forms, { version: "000.000.001"}, "functionalGroups", undefined, undefined, createDataTable);


	$scope.clearForm = function(form, formId) {
		DataForm.clearForm(pageName, form, formId);
	};

	$scope.switchForm = function(formId) {

		// Show/Hide search button.
		$rootScope.subNav.middleBtn.enabled = (formId === rpcsFormName);

		DataForm.switchForm(pageName, formId);
	};

	$scope.submit = function(form) {
		DataForm.submitForm(pageName, form);
	};

	$scope.goToMessageType = function(id) {
		//$state.transitionTo("messageType", { "id": id, "activeFormId": "languagesForm", "consumerFriendlyMessageId": DataForm.getItemId(pageName) });
	};

	$scope.showDeleteRpcs = false;

	$scope.createNewRpc = function() {
		//$state.transitionTo("messageTypeCreate", { "consumerFriendlyMessageId": DataForm.getItemId(pageName) });
	};

	$scope.deleteRpcs = function() {
		$scope.showDeleteRpcs = ! $scope.showDeleteRpcs;
		DataTable.enableSelected(tableName, $scope.showDeleteRpcs, true);
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
		$scope.showDeleteRpcs = false;
		DataTable.deleteAllSelectedSubItems(tableName, function(err, data){
			if(err) {
				return Error.display(err);
			}

			if(! data) {
				return Error.display(new Error("Problem occurred while deleting the selected rpcs."));
			}
			var obj = DataForm.getItemCopy(pageName);

			obj.rpcs = data;

			for(var i = obj.rpcs.length-1; i >=0; --i) {
				if( typeof(obj.rpcs[i]) === 'object' ) {
					obj.rpcs[i] = obj.rpcs[i]._id;
				}
			}

			DataForm.updateItem(pageName, undefined, obj, function(err, data) {
				if(err) {
					Error.display(err);
				}
			});
		});
	};

	/**
	 * Copy the rpc to a new variable to be edited and then show the edit rpc form.
	 * @param rpc is the rpc data to edit.
	 */
	var showEditItemForm = function(item) {
		if(item === undefined) {
			$log.warn("Cannot show the edit rpc form because the rpc to edit is invalid.");
		}

		// By populating the rpc variable with data, the correct form should be shown in the view.
		$scope.rpc = angular.copy(item);
	};


	/**
	 * Clear the language form, then hide the language form.
	 */
	var clearItem = function() {
		// Clearing the language object will also hide the form.
		$scope.rpc = undefined;

		// The languages form must be forced back into pristine state.
		if($scope.currentForm && $scope.currentForm.$name === rpcsFormName) {
			$scope.currentForm.$setPristine();
		}

		// Ensure all forms are hidden
		$scope.showCreateNewRpcForm = false;
	};



	/**
	 * Clear the language form, but prompt the user before clearing unsaved changes.
	 * Then hide the language form.
	 * @param next is a callback called after the form has been cleared.
	 */
	var clearItemWithPrompt = function(next) {
		next = (next) ? next : function(err) { Error.handle(err); };

		// If the form has unsaved changes, prompt the user to continue before clearing changes.
		if($scope.currentForm && ($scope.currentForm.$name === rpcsFormName || $scope.currentForm.$name === createRpcFormName) && $scope.currentForm.$dirty) {
			DataForm.warnOfUnsavedChanges(undefined, function() {
				clearItem();
				next();
			});
		} else {
			clearItem();
			next();
		}
	};



	// Toggle showing and hiding the edit language form.
	$scope.toggleEditItem = function(item) {
		if(item === undefined) {
			$log.error("Cannot edit an invalid item.");
			return;
		}

		if($scope.rpc === undefined) {
			showEditItemForm(item);
		} else {
			// Check if user clicked the clear button.
			if(item._id === $scope.rpc._id) {
				clearItem();
			} else {
				clearItemWithPrompt(function() {
					showEditItemForm(item);
				});
			}
		}
	};



}]);