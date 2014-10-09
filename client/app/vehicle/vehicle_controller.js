'use strict';

/**
 */
angular.module('SDL.vehicle', []).controller('vehicleCtrl', function($scope, $state, $stateParams, Restangular, Alert, SubNavService, DataForm){
	var pageName = "vehicle";
	// Create the sub navigation.  (You can copy past this code)
	SubNavService.show(SubNavService.create(
		SubNavService.createBtn("New Car", true, function() { $state.transitionTo("carCreate"); }),
		undefined,
		SubNavService.createBtn("Delete", false, function() { DataForm.deleteItem(pageName, function() { SubNavService.clickRightBtn(); }); })
	));

	var forms = [{
		id: "vehicleInfoForm",
		name: "Vehicle Info",
		isDisabledOnCreate: false
	}, {
		id: "moduleInfoForm",
		name: "Module Info",
		isDisabledOnCreate: true
	}, {
		id: "moduleNotificationForm",
		name: "Module Notifications",
		isDisabledOnCreate: true
	}, {
		id: "moduleUpdateForm",
		name: "Module Updates",
		isDisabledOnCreate: true
	}, {
		id: "moduleCfmForm",
		name: "Module Consumer Friendly Messages",
		isDisabledOnCreate: true
	},{
		id: "moduleFunctionalGroupsForm",
		name: "Module Functional Groups",
		isDisabledOnCreate: true
	},{
		id: "moduleConfigurationForm",
		name: "Module Configuration",
		isDisabledOnCreate: true
	}];

	DataForm.create(pageName, "vehicles", forms, {}, "car");

	$scope.clearForm = function(form, formId) {
		DataForm.clearForm(pageName, form, formId);
	};

	$scope.switchForm = function(formId) {
		DataForm.switchForm(pageName, formId);
	};

	$scope.submit = function(form) {
		// If there is a module then we update it.
		if($scope[pageName].item.module)
		{
			if(form.$valid) {
				var element = Restangular.restangularizeElement(undefined, $scope[pageName].item.module, 'modules');
				element.post().then(function(module) {
					DataForm.submitForm(pageName, form, function(err, item) {
						if(err) {
							//TODO: Do something...
						}

						//TODO: DO something with item.
						$scope[pageName].item.module = module;
					});
				});
			}
		} else {
			DataForm.submitForm(pageName, form);
		}
	};
});