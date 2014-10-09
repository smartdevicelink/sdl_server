'use strict';

/**
 * Application controller handles the logic to display, create, or modify a single application.
 * @param $fileUploader
 * @param $rootScope parent scope for the entire application.
 * @param $scope local scope shared between the application's view and this controller.
 * @param $state ui-router method(s) and variable(s) for navigation between views.
 * @param CacheService stores static information retrieved from the backend server.
 * @param DataForm helper service to create, view, and modify data in a form for a single item.
 * @param SubNavService helper service to display a sub navigation designed for control buttons.
 */
angular.module('SDL.app', []).controller('appCtrl', function($fileUploader, $rootScope, $scope, $state, CacheService, DataForm, SubNavService){
	var pageName = "app";

  // Default application icon for new applications. If updated be sure to update the server configs: clientDefaultApplicationIcon.
	var defaultAppIcon = "/assets/img/sdl-logo-without-text-icon.png";

	$scope.sdlCategories = CacheService.get('sdlCategories');
	$scope.iosCategories = CacheService.get('iosAppStoreCategories');
	$scope.androidCategories = CacheService.get('androidAppStoreCategories');
	$scope.sdlVersions = CacheService.get('sdlVersions');

	// Create the sub navigation.  (You can copy past this code)
	SubNavService.show(SubNavService.create(
		SubNavService.createBtn("New App", false, function() { $state.transitionTo("appCreate"); }),
		undefined,
		SubNavService.createBtn("Delete", false, function() { DataForm.deleteItem(pageName, function() { SubNavService.clickRightBtn(); }); })
	));


	$scope.afterToggle = function() {
		console.log("YAY");
	};
	/*$rootScope.$watch('app.item.activated', function() {
	 if($rootScope.app !== undefined && $rootScope.app.forms !== undefined && $rootScope.app.forms.length > 0 && $rootScope.app.forms[0]) {
	 //console.log($rootScope.app.forms[0]);
	 console.log($rootScope.app.forms[0].$pristine);
	 }
	 }, true); */
	//https://github.com/paul-tST/angular-toggle-switch.git

	var forms = [{
		id: "appInfoForm",
		name: "Info",
		isDisabledOnCreate: false
	}, {
		id: "androidForm",
		name: "Android",
		isDisabledOnCreate: true
	}, {
		id: "iosForm",
		name: "iOS",
		isDisabledOnCreate: true
	}, {
		id: "securityForm",
		name: "Security",
		isDisabledOnCreate: true
	}];

	DataForm.create(pageName, "applications", forms, { activated: true, iconUrl: defaultAppIcon }, "app");

	var imageToUpload;
	var currentForm;

	// Image uploader
	var uploader = $scope.uploader = $fileUploader.create({
		scope: $scope,
		url: "/upload/appIcon",   // URL to POST the image files.
		autoUpload: false,        // Do not upload until .upload() is specifically called on an item.
		removeAfterUpload: true,  // Clean up local files after uploading
		queueLimit: 2             // Queue can only have two files in it.
	});

  // Set filters so the uploader only accepts images.
	uploader.filters.push(function(item) {
		var type = uploader.isHTML5 ? item.type : '/' + item.value.slice(item.value.lastIndexOf('.') + 1);
		type = '|' + type.toLowerCase().slice(type.lastIndexOf('/') + 1) + '|';
		return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
	});

	uploader.bind('afteraddingfile', function(event, item) {
    // Only allow one item to be queue, clean up the old one.
		if(uploader.queue.length > 1) {
			uploader.clearQueue();
			uploader.addToQueue(item.file);
		}
		imageToUpload = item;
	});

	uploader.bind('success', function (event, xhr, item, response) {
		$scope[pageName].item.iconUrl = response.response.iconPath;

		DataForm.submitForm(pageName, currentForm);
	});

	uploader.bind('error', function (event, xhr, item, response) {
		console.info('Error uploading image', xhr, item, response);
	});

	$scope.clearForm = function(form) {
		resetUploaderQueue();
		DataForm.clearForm(pageName, form);
	};

	$scope.switchForm = function(formId) {
		DataForm.switchForm(pageName, formId);
	};

	$scope.submit = function(form) {
		if(imageToUpload && form.$valid) {
			// Form will be submitted after a successful image upload. See upload.bind('success' ...)
			currentForm = form;
			imageToUpload.upload();
		} else {
			DataForm.submitForm(pageName, form);
		}
	};

	$scope.restoreDefaultIcon = function() {
		DataForm.setFieldToValue(pageName, "iconUrl", defaultAppIcon);

    // If they are restoring the icon clear any items that were pending upload.
    resetUploaderQueue();
	};

  function resetUploaderQueue() {
    if(uploader.queue && uploader.queue.length > 0) {
      uploader.clearQueue();
    }

    currentForm = undefined;
    imageToUpload = undefined;
  }
});
