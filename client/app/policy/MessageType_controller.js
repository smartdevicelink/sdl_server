'use strict';

/**
 */
angular.module('SDL.messageType', []).controller('messageTypeCtrl', [ '$log', '$q', '$rootScope', '$scope', '$state', '$stateParams', 'DataForm', 'DataTableService', 'ErrorService', 'LanguageService', 'Restangular', 'SubNavService',function($log, $q, $rootScope, $scope, $state, $stateParams, DataForm, DataTable, Error, Language, Restangular, SubNav) {

	var pageName = "messageType",    	 			  // Name of the current page, used by sub navigation.
	    tableName = "languageTable",  				// Name of the table displaying the language codes and details.
      languagesFormName = "languagesForm", 	// Name of the languages form that contains subforms.
			createLanguageFormName = "createLanguageForm"; 	// Name of the create new language form.

	// In order to edit a language in the languages array we first
	// copy the language data here to be modified freely.  When this value
	// is defined, then a language form is shown to the user.
	$scope.language = undefined;

  // The form in the user's focus.  If there is not a form in focus, this should be a blank object or undefined.
	$scope.currentForm = {};

	$scope.showCreateNewLanguageForm = false;

	$scope.updateLanguagesStatus = false;
	$scope.deleteLanguages = false;

	$scope.cfmId = ($stateParams["consumerFriendlyMessageId"]) ? $stateParams["consumerFriendlyMessageId"] : undefined;

	// Create the sub navigation buttons
	SubNav.show(SubNav.create(
		SubNav.createBtn("New Message Type", false, function() { $state.transitionTo("messageTypeCreate", {"consumerFriendlyMessageId": $scope.cfmId}) }),

		SubNav.createBtn("Search", false, function() { DataTable.clearFilters(tableName); $scope.show_filter = ! $scope.show_filter;}, undefined, undefined, ($stateParams["activeFormId"] === languagesFormName)),

		SubNav.createBtn("Delete", false, function() { DataForm.deleteItem(pageName, function() { SubNav.clickRightBtn(); }); })
	));

	// Create the forms to be displayed in the form navigation.
	var forms = [{
		id: "infoForm",
		name: "Info",
		isDisabledOnCreate: false
	}, {
		id: languagesFormName,
		name: "Languages",
		isDisabledOnCreate: true
	}];

	/**
	 * Create the language table to display and edit language data.
	 * @param data is the language objects to be displayed in the table.
	 */
	var createLanguageTable = function(data) {
		// Initialize data object if necessary.
		data = (data) ? data : {};
		data.languages = (data.languages) ? data.languages : [];


		// Pull the language codes from the backend server, if not already cached.
		// Then add additional language information to the existing language data objects.
		updateLanguageCodeDescriptions(data, function(err, data) {

			// Create the data table with the altered data.
			DataTable.create(tableName, data.languages);
		});
	};

	/**
	 * Copy the language to a new variable to be edited and then show the
	 * edit language form.
	 * @param languageIndex is index of the language to edit in the item's languages property.
	 */
	var showEditLanguageForm = function(language) {
		if(language === undefined) {
			$log.warn("Cannot show the edit language form because the language to edit is invalid.");
		}

		// By populating the language variable with data, the correct form should be shown in the view.
		$scope.language = angular.copy(language);
	};

	/**
	 * Clear the language form, but prompt the user before clearing unsaved changes.
	 * Then hide the language form.
	 * @param next is a callback called after the form has been cleared.
	 */
	var clearLanguageWithPrompt = function(next) {
		next = (next) ? next : function(err) { Error.handle(err); };

		// If the form has unsaved changes, prompt the user to continue before clearing changes.
		if($scope.currentForm && ($scope.currentForm.$name === languagesFormName || $scope.currentForm.$name === createLanguageFormName) && $scope.currentForm.$dirty) {
			DataForm.warnOfUnsavedChanges(undefined, function() {
				clearLanguage();
				next();
			});
		} else {
			clearLanguage();
			next();
		}
	};

	/**
	 * Clear the language form, then hide the language form.
	 */
	var clearLanguage = function() {
		// Clearing the language object will also hide the form.
		$scope.language = undefined;

		// The languages form must be forced back into pristine state.
		if($scope.currentForm && $scope.currentForm.$name === languagesFormName) {
			$scope.currentForm.$setPristine();
		}

		// Ensure all forms are hidden
		$scope.showCreateNewLanguageForm = false;
	};

	/**
	 * Add the language code description properties to the language data.
	 * @param data is the language table data
	 * @param next is a callback where the updated data is returned to.
	 */
	var updateLanguageCodeDescriptions = function(data, next) {
		next = (next) ? next : function(err) { Error.handle(err, undefined, function() { return data; }); }

		if(data === undefined || data.languages === undefined) {
			return next(new Error("Cannot update language codes for invalid data."));
		}

		// Get the cached languages from the backend server.
		Language.updateIfNotCached().then(function(success){
			if(! success) {
				return next(new Error("Cannot update language name and country because there was an error retrieving the language and country lists."));
			}

			for(var i = data.languages.length-1; i>=0; --i) {
				var language = Language.getLanguageByCode(data.languages[i].key.substring(0, 2));
				data.languages[i].language = (language) ? language.language : "";

				var country = Language.getCountryByCode(data.languages[i].key.substring(3));
				data.languages[i].country = (country) ? country.country : "";
			}
			return next(undefined, data);
		});
	};

	/**
	 * Add the language code description properties to a single language object.
	 * @param data is the language table data
	 * @param next is a callback where the updated data is returned to.
	 */
	var updateLanguageCodeDescription = function(data, next) {
		next = (next) ? next : function(err, data) { Error.handle(err, undefined, function() { return data; }); }

		if(data === undefined) {
			return next(new Error("Cannot update language code for an invalid language"));
		}

		Language.updateIfNotCached().then(function(success){
			if(! success) {
				return next(new Error("Cannot update language name and country because there was an error retrieving the language and country lists."));
			}

			var language = Language.getLanguageByCode(data.key.substring(0, 2));
			data.language = (language) ? language.language : "";

			var country = Language.getCountryByCode(data.key.substring(3));
			data.country = (country) ? country.country : "";

			return next(undefined, data);
		});
	};

	/**
	 * Return the index of a language object in the pass languages array
	 * that contains the key.
	 * @param languages an array of language objects.
	 * @param key is the key, such as en-us, to look for.
	 * @returns the index or -1 if it was not found.
	 */
	var findLanguageIndexByKey = function(languages, key) {
		if( ! languages) {
			return -1;
		}

		for(var i = languages.length-1; i >=0; --i) {
			if(languages[i].key === key) {
				return i;
			}
		}
		return -1;
	};

  var findLanguageIndex = function(language) {
		for(var i = $rootScope[tableName].items.length-1; i>=0; --i) {
			if($rootScope[tableName].items[i] === language) {
				return i;
			}
		}
	};

	/**
	 * Finds a language object in the languages array that
	 * contains the key.
	 * @param languages an array of language objects.
	 * @param key is the key, such as en-us, to look for.
	 * @returns the language object or undefined if one was not found.
	 */
	var findLanguageByKey = function(languages, key) {
		var index = findLanguageIndexByKey(languages, key);
		if(index >= 0) {
			return languages[index];
		}
		return undefined;
	};


	// Create the data form(s)
	DataForm.create(pageName, "messageTypes", forms, { }, "messageType", undefined, undefined, function(err, data) {
		if(err) {
			return Error.display(err);
		}

		createLanguageTable(data);
	});

	/**
	 * Resets the current form, or the form passed as the parameter,
	 * back to its original state removing all changes made to it.
	 *
	 * Note: Do not use for languages form.
	 *
	 * @param form is the form object from the view.
	 * @param formId is the id of the form found in the form(s) object.
	 */
	$scope.clearForm = function(form, formId) {
		DataForm.clearForm(pageName, (form) ? form : $scope.currentForm, formId);
	};

	/**
	 * Set the current form object.  This should be called when a form is
	 * given focus.
	 * @param form is the form object from the view.
	 */
	$scope.setFormScope = function(form) {
		$scope.currentForm = form;
	};

	/**
	 * Switch between forms using their ID's.  This will
	 * remove all changes made to the current form.
	 * @param formId is the ID of the form in the forms object.
	 */
	$scope.switchForm = function(formId) {

		// Show/Hide search button.
		$rootScope.subNav.middleBtn.enabled = (formId === languagesFormName);

		if($scope.currentForm.$name === languagesFormName || $scope.currentForm.$name === createLanguageFormName) {
			clearLanguageWithPrompt(function() {
				DataForm.switchForm(pageName, formId);
			});
		} else {
			DataForm.switchForm(pageName, formId, $scope.currentForm);
		}
	};

	/**
	 * Submit a form's changes to the backend server.
	 * @param form is the form object to be submitted
	 */
	$scope.submit = function(form, next) {
		next = (next) ? next : function(err, cfm) { Error.handle(err); };

		DataForm.submitForm(pageName, form, function(err, newMessageType) {
			if(err) {
				return next(err);
			}

			// Associate a new message type with the current consumer friendly message.
			if( ! $rootScope[pageName].isNew) {
				return next(undefined, newMessageType);
			}

			if( ! newMessageType || newMessageType._id === undefined) {
				return next(new Error("Cannot link invalid message type to the consumer friendly message."));
			}

			Restangular.one("consumerFriendlyMessages", $scope.cfmId).get().then(function (cfm) {
				if ( ! cfm) {
					return next("Could not find the consumer friendly message with id " + $scope.cfmId);
				}

				// Ensure the messages array if formatted correctly.
				for (var i = cfm.messages.length - 1; i >= 0; --i) {
					if( typeof(cfm.messages[i]) === 'object' ) {
						cfm.messages[i] = cfm.messages[i]._id;
					}
				}

				// Add the new message type to the message's array in the cfm.
				cfm.messages.push(newMessageType._id);

				Restangular.one("consumerFriendlyMessages").post($scope.cfmId, cfm).then(function (cfm) {
					next(undefined, cfm);
				}, function (res) {
					next(res.data.error);
				});
			}, function(res) {
				next(res.data.error);
			});
		});
	};

	/**
	 * Set the options available in the status filter select box.
	 * @returns a promise.
	 */
	$scope.statusFilterOptions = function() {
		var promise = $q.defer();

		// Set the status options.
		var options = [
			{ id: "true", title: "Approved" },
			{ id: "false", title: "Not Approved" }
		];

		promise.resolve(options);
		return promise;
	};

	// Toggle showing and hiding the edit language form.
	$scope.toggleEditLanguage = function(language) {
		if(language === undefined) {
			$log.error("Cannot edit an invalid language.");
			return;
		}

		if($scope.language === undefined) {
			showEditLanguageForm(language);
		} else {
			// Check if user clicked the clear button.
			if(language._id === $scope.language._id) {
				clearLanguage();
			} else {
				clearLanguageWithPrompt(function() {
					showEditLanguageForm(language);
				});
			}
		}
	};

	// Save the changes made on the edit language form.
	$scope.saveLanguage = function(language) {
		language = (language !== undefined) ? language : $scope.language;

		var obj = DataForm.getItemCopy(pageName);

		var isNewLanguage = true;

		for(var i = obj.languages.length-1; i >= 0; --i) {
			if(obj.languages[i]._id === language._id) {
				obj.languages[i] = language;
				isNewLanguage = false;
				break;
			}
		}

		if(isNewLanguage) {
			obj.languages.push(language);
		}

		DataForm.updateItem(pageName, undefined, obj, function(err, data) {
			if(err) {
				Error.display(err);
			}

			if(! isNewLanguage) {
				for(var i = data.languages.length-1; i >= 0; --i) {
					if (data.languages[i]._id === language._id) {
						language = data.languages[i];
						break;
					}
				}
			} else {
				for(var i = data.languages.length-1; i >= 0; --i) {
					if (data.languages[i].key === language.key && data.languages[i].tts === language.tts) {
						language = data.languages[i];
						break;
					}
				}
			}

			updateLanguageCodeDescription(language, function(err, language) {
				if(err) {
					Error.display(err);
				}

				DataTable.updateDataById(tableName, language);
				clearLanguage();
			});

		});
	};

	// Add a new line to the current language being edited.
	$scope.addLine = function(item) {
		if($scope.language.lines === undefined) {
			$scope.language.lines = [ item ] || [];
		} else {
			$scope.language.lines.push(item || "");
		}

		if($scope.currentForm !== undefined && $scope.currentForm.$setDirty !== undefined) {
			$scope.currentForm.$setDirty();
		}
	};

	// Remove a line from the current language being edited.
	$scope.deleteLine = function(item, index) {
		if($scope.language.lines !== undefined && $scope.language.lines.length > index) {
			$scope.language.lines.splice(index, 1);
			$scope.currentForm.$setDirty();
		} else {
			$log.error("Could not delete line at index " + index);
		}
	};

	$scope.setCurrentFormDirty = function() {
		$scope.currentForm.$setDirty();
	};

	$scope.toggleCreateLanguage = function() {
		$scope.deleteLanguages = false;
		$scope.updateLanguagesStatus = false;
		DataTable.enableSelected(tableName, false, true);
		$scope.showCreateNewLanguageForm = ! $scope.showCreateNewLanguageForm;

		var item = DataForm.getItem(pageName);

		if($scope.showCreateNewLanguageForm) {
			$scope.language = {
				"enabled": true,
				//"index": (item && item.languages) ? item.languages.length: 0,
				"lines": []
			};
		} else {
			$scope.language = false;
		}
	};

	$scope.selectAndUpdateStatus = function() {
		if($scope.showCreateNewLanguageForm) {
			clearLanguageWithPrompt(function() {
				$scope.showCreateNewLanguageForm = false;
				$scope.deleteLanguages = false;
				$scope.updateLanguagesStatus = ! $scope.updateLanguagesStatus;
				DataTable.enableSelected(tableName, $scope.updateLanguagesStatus, true);
			});
		} else {
			$scope.deleteLanguages = false;
			$scope.updateLanguagesStatus = ! $scope.updateLanguagesStatus;
			DataTable.enableSelected(tableName, $scope.updateLanguagesStatus, true);
		}
	};

	$scope.selectAndDelete = function() {
		if($scope.showCreateNewLanguageForm) {
			clearLanguageWithPrompt(function() {
				$scope.showCreateNewLanguageForm = false;
				$scope.updateLanguagesStatus = false;
				$scope.deleteLanguages = ! $scope.deleteLanguages;
				DataTable.enableSelected(tableName, $scope.deleteLanguages, true);
			});
		} else {
			$scope.updateLanguagesStatus = false;
			$scope.deleteLanguages = !$scope.deleteLanguages;
			DataTable.enableSelected(tableName, $scope.deleteLanguages, true);
		}
	};

	// Expose the Select All Items method for the data table.
	$scope.selectAllItems = function(value) {
		DataTable.selectAllItems(tableName, value);
	};

	$scope.deleteSelected = function() {
		DataTable.deleteAllSelectedSubItems(tableName, function(err, data){
			if(err) {
				return Error.display(err);
			}

			$scope.deleteLanguages = false;

			if(! data) {
				return Error.display(new Error("Problem occurred while deleting the selected languages."));
			}
			var obj = DataForm.getItemCopy(pageName);

			obj.languages = data;

			//for(var i = obj.languages.length-1; i >=0; --i) {
			//	delete obj.languages[i].index;
			//}

			DataForm.updateItem(pageName, undefined, obj, function(err, data) {
				if(err) {
					Error.display(err);
				}
			});
		});
	};

	// Expose the Select Item method for the data table.
	$scope.selectItem = function(value) {
		DataTable.selectItem(tableName, value);
	};

	$scope.approveSelected = function(value) {
		$scope.updateLanguagesStatus = false;
		DataTable.enableSelected(tableName, false, true);

		for(var i = $rootScope[tableName].items.length-1; i >=0; --i) {
			if ($rootScope[tableName].items[i].selected) {
				$rootScope[tableName].items[i].enabled = value;
			}
		}

		var obj = DataForm.getItemCopy(pageName);
		obj.languages = DataTable.getItems(tableName);

		DataForm.updateItem(pageName, undefined, obj, function(err, data) {
			if(err) {
				Error.display(err);
			}

			//console.log("After Update Status: ");
			//for(var i = 0; i < obj.languages.length; i++) {
			//	console.log(data.languages[i].enabled);
			//}
		});
	};

}]);