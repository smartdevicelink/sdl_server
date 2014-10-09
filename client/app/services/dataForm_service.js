// ~> Service

'use strict';

/**
 * Data Form Service handles logic to display, search, and modify a table of data.
 * @param fileUploader
 * @param $log is a service for logging safely to the browser's console, if present.
 * @param $rootScope parent scope for the entire application.
 * @param $state
 * @param $stateParams
 * @param Alert
 * @param Restangular service for performing CRUD operations on the server's backend.
 * @param ALERTS
 * @param EVENTS
 */
angular.module('SDL.dataFormService', []).factory('DataForm', ['$log', '$rootScope', '$state', '$stateParams', 'Alert', 'Restangular', 'ALERTS', 'EVENTS', function ($log, $rootScope, $state, $stateParams, Alert, Restangular, ALERTS, EVENTS) {

  // Default data form object.
  var defaultForm = {
    activeForm: undefined,               // Currently active form
		deleteAlertEventListener: undefined, // Stores the broadcast listener for the delete alert event listener
		deleteAlertClosedClick: undefined,   // A function called when a delete confirmation alert is closed using the X.
		viewState: undefined,                // Page state name for viewing the item.
    defaultItem: {},                     // Default item used to create a new item.
    data: {                              // Info about how to get the item data.
      restangularUrl: undefined,         // Restangular base url
      formatFn: function (data, next) {  // Method to format the data once retrieved.
        next(undefined, data)
      },
      nextFn: function (err, data) {
      }    // ?
    },
    forms: [],                          // List of forms in the order they are to be displayed.
    isDeleteConfirmShown: false,				// Flag indicating if the delete button has been clicked and the confirmation is shown.
		isNew: false,                       // New flag, when true the item is not yet created on the server.
    item: {},                           // Stores the current item's properties.
    itemReadOnly: {},                   // Stores an untouched copy of the current item.
    uploader: undefined									// ?
  };

  return {

		warnOfUnsavedChanges: function(ngClick, next) {
			var btn = {
				"type": "warning",
				"text": "Continue",
				"ngClick": (ngClick) ? ngClick : function() {
					Alert.removeAllGroup("clearFormWithPrompt");
					next();
				}
			};

			Alert.addUnsticky("Your unsaved changes will be discarded if you continue.", "warning", "clearFormWithPrompt", btn);
		},

		clearFormWithPrompt: function(pageName, form, next) {
			if(form.$dirty) {
				this.warnOfUnsavedChanges(function() {
					// Ensure page name is defined and exists in the root scope.
					if (!pageName || !$rootScope[pageName]) {
						$log.error("Cannot clear a data form that does not exist or has an invalid name.");
						next(new Error("Cannot clear a data form that does not exist or has an invalid name."));
					}

					// Clear all error alerts.
					$rootScope.$broadcast('show-errors-reset');

					// Clear all changes by copying over the read only item to the displayed item.
					$rootScope[pageName].item = angular.copy($rootScope[pageName].itemReadOnly);

					// Mark the form as not submitted.
					$rootScope[pageName].submitted = false;

					// Set the form pristine boolean to true after we reset the form.
					if (form && form.$setPristine !== undefined) {
						form.$setPristine();
					}
					Alert.removeAllGroup("clearFormWithPrompt");
					next();
				});
			} else {
				this.clearForm(pageName, form);
				next();
			}
		},

		/**
		 * Clear the data form of all changes that were made.
		 * @param pageName is the name of the data form in the root scope object.
		 * @param form (optional) a reference to the displayed form object.
		 * @return boolean to indicate success or failure.
		 */
		clearForm: function (pageName, form) {
			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot clear a data form that does not exist or has an invalid name.");
				return false;
			}

			// Clear all error alerts.
			$rootScope.$broadcast('show-errors-reset');


			// Clear all changes by copying over the read only item to the displayed item.
			$rootScope[pageName].item = angular.copy($rootScope[pageName].itemReadOnly);


			// Mark the form as not submitted.
			$rootScope[pageName].submitted = false;

			// Set the form pristine boolean to true after we reset the form.
			if (form && form.$setPristine !== undefined) {
				form.$setPristine();
			}
			return true;
		},

		/**
     * Create a new data form in the root scope.
     * @param pageName is the name of the data form in the root scope object.
     * @param restangularUrl the base url to interact with the server backend using Restangular.
     * @param forms an array of form objects to be displayed in order.
     * @param defaultItem the default item used when creating a new item.
     * @param viewState is the view state for viewing and editing the data form.
     * @param formatFn a function used to format the data from the server before it is presented to the user.
     * @param overwrite (optional) when false the create method will not write over an existing form.
     * @param nextFn a function called after the data has been received from the backend server and formatted using the format function.
		 * @return boolean to indicate success or failure.
     */
    create: function (pageName, restangularUrl, forms, defaultItem, viewState, formatFn, overwrite, nextFn) {
      // Ensure page name and restangular url are defined.
      if (!pageName || !restangularUrl) {
        $log.error("Cannot create a data form with an invalid name and/or invalid data url.");
        return false;
      }

      // Check if the table already exists in the root scope.  Do not write over an existing
      // table is the overwrite parameter is false.  By default, overwrite is assumed true.
      if (overwrite === false && $rootScope[pageName] !== undefined) {
        $log.error("Error:  Cannot override an existing " + pageName + " data form.");
        return false;
      }

      // Create a default data object.
      $rootScope[pageName] = {};
      angular.copy(defaultForm, $rootScope[pageName]);

      // Set the format data function, if it exists.
      if (formatFn) {
        $rootScope[pageName].data.formatFn = formatFn;
      }

      // Set the restangular url.
      $rootScope[pageName].data.restangularUrl = restangularUrl;

      // Check if we are creating a new object or viewing an existing one.
      $rootScope[pageName].isNew = !$stateParams || !$stateParams.id;

      // Set the forms.
      if(forms && forms.length > 0) {
        // Copy the forms parameter to the root scope.
        angular.copy(forms, $rootScope[pageName].forms);

				var firstActiveForm = $rootScope[pageName][0];

				// Set the active form, first checking stateParams, then a default "active" attribute, finally default to the first form.
				if($stateParams && $stateParams["activeFormId"] !== undefined && $stateParams["activeFormId"] !== null && $stateParams["activeFormId"] !== "") {
					for(var i = $rootScope[pageName].forms.length - 1; i >=0; --i) {
						if($rootScope[pageName].forms[i].id === $stateParams["activeFormId"]) {
							$rootScope[pageName].activeForm = $rootScope[pageName].forms[i];
						}

						// Check for a form marked active and cache it.
						if ($rootScope[pageName].forms.active === true) {
							firstActiveForm = $rootScope[pageName].forms[i];
						}
					}

					// If the state params do not define an active form, use the cached active form.
					if($rootScope[pageName].activeForm === undefined || $rootScope[pageName].activeForm === null || $rootScope[pageName].activeForm === "") {
						$rootScope[pageName].activeForm = firstActiveForm;
					}
				} else {
					$rootScope[pageName].activeForm = $rootScope[pageName].forms[0];
					// Set the active form based on the form's 'active' attribute or default to the first form in the list.
					for (var i = $rootScope[pageName].forms.length - 1; i >= 0; --i) {
						if ($rootScope[pageName].forms.active === true) {
							$rootScope[pageName].activeForm = $rootScope[pageName].forms[i];
							break;
						}
					}
				}
      } else {
        $rootScope[pageName].forms = [];
      }

      // Set the default item for creating items.
      angular.copy(defaultItem, $rootScope[pageName].defaultItem);

      // Set the view state.
      $rootScope[pageName].viewState = viewState;

      // Set the data retrieval next function.
      if (nextFn) {
        $rootScope[pageName].data.nextFn = nextFn;
      }

      // Get the item from the server or set the default create object.
      return this.populate(pageName, undefined);
    },

		/**
		 * Create a new item on the backend server.  Navigate the user to the view/edit
		 * page of the newly created item.  Finally return the results to the callback method.
		 * @param pageName is the name of the data form in the root scope object.
		 * @param next is the callback function where the results are returned to.
		 */
		createItem: function (pageName, next) {
			// Ensure next is defined.
			next = (next && typeof(next) === typeof(Function)) ? next : function (err, item) {};

			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot create an item on a data form that does not exist or has an invalid name.");
				return next(new Error("Cannot create an item on a data form that does not exist or has an invalid name."));
			}

			// Create the item on the backend server.
			Restangular.all($rootScope[pageName].data.restangularUrl).post($rootScope[pageName].item).then(function (item) {
				// Notify the user if the item is invalid.
				if (!item) {
					Alert.addUnsticky("An error occurred while creating the item.", "danger", EVENTS.error);
					$log.error("An error occurred while creating the item.");
					return;
				}

				// Transition to newly created app so that user can update other fields.
				$state.transitionTo($rootScope[pageName].viewState, { id: item._id });

				// Return the item to the callback function.
				return next(undefined, item);
			});
		},

		/**
		 * Delete the current item in the data form on the backend server.
		 * @param pageName is the name of the data form in the root scope object.
		 * @param next is the callback function where the results are returned to.
		 */
		deleteItem: function(pageName, onDeleteAlertClosedClick, next) {
			// Ensure next is defined.
			next = (next && typeof(next) === typeof(Function)) ? next : function (err, item) {};

			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot get the item from a data form that does not exist or has an invalid name.");
				return next(new Error("Cannot get the item from a data form that does not exist or has an invalid name."));
			}

			// If the delete button is toggled off.
			if($rootScope[pageName].isDeleteConfirmShown) {
				$rootScope[pageName].isDeleteConfirmShown = false;
				Alert.removeAllGroup(pageName);

				// Un-subscribe from the delete alert event listener.
				$rootScope[pageName].deleteAlertEventListener();
				return next(undefined, undefined);
			}

			$rootScope[pageName].deleteAlertClosedClick = (onDeleteAlertClosedClick) ? onDeleteAlertClosedClick : undefined;

			var alertMsgText = "Are you sure you want to delete this?";

			var deleteBtn = {
				"type": "danger",
				"text": "Yes",
				"ngClick": function() {

					if($rootScope[pageName].item.remove) {
						$rootScope[pageName].item.remove();
					}

					$state.transitionTo($rootScope.fromState, $rootScope.fromParams);

					// Delete the data form from the root scope.
					$rootScope[pageName] = undefined;
				}
			};

			// Listen for if the alert is removed by using the Alert close button.
			$rootScope[pageName].deleteAlertEventListener = $rootScope.$on(ALERTS.removed, function(event, alerts){
				for(var i = alerts.length-1; i>= 0; --i) {
					if (alerts[i].group === pageName && alerts[i].msg === alertMsgText) {
						if ($rootScope[pageName].deleteAlertClosedClick) {
							$rootScope[pageName].deleteAlertClosedClick();
						}
					}
				}
			});

			Alert.addUnsticky(alertMsgText, "danger", pageName, deleteBtn, true);

			$rootScope[pageName].isDeleteConfirmShown = true
			return next(undefined, undefined);
		},

		/**
		 * Get the current item from a data form.
		 * @param pageName is the name of the data form in the root scope object.
		 * @returns the current item from the data form root scope or undefined if an error occurred.
		 */
		getItem: function (pageName) {
			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot get the item from a data form that does not exist or has an invalid name.");
				return undefined;
			}

			return $rootScope[pageName].item;
		},

		getItemId: function(pageName) {
			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot get the item id from a data form that does not exist or has an invalid name.");
				return undefined;
			}

			if($rootScope[pageName].item === undefined) {
				$log.error("Cannot get the item id because the data form's item is undefined.");
				return undefined;
			}

			return $rootScope[pageName].item._id;
		},


		getItemCopy: function(pageName) {
			return angular.copy(this.getItem(pageName));
		},

		/**
		 * Populate the data form with data from the backend server or using the default item data if the
		 * user is creating a new object.
		 * @param pageName is the name of the data form in the root scope object.
		 * @param defaultItem (optional) the default object to use when creating a new item.  If you don't define this, the default one will be used from the root scope data form.
		 * @returns boolean to indicate success or failure.
		 */
		populate: function (pageName, defaultItem) {
			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot populate a data form that does not exist or has an invalid name.");
				return false;
			}

			// Check if we are creating a new object, if so set the default object.
			if ($rootScope[pageName].isNew) {
				this.setItem(pageName, (defaultItem) ? defaultItem : $rootScope[pageName].defaultItem);
				return true;
			}

			// Check for a valid ID
			if (!$stateParams.id) {
				Alert.addUnsticky("Invalid item ID.", "danger", EVENTS.error);
				$state.transitionTo($rootScope.fromState, $rootScope.fromParams);
				return false;
			}

			// Otherwise retrieve the data from the backend server.
			//Restangular.one($rootScope[pageName].data.restangularUrl + '/' + $stateParams.id).get().then(function (item) {
			Restangular.one($rootScope[pageName].data.restangularUrl, $stateParams.id).get().then(function (item) {
				// Ensure the item is valid, if not notify the user.
				if (!item) {
					Alert.addUnsticky("Error occurred while finding the item with ID " + $stateParams.id, "danger", EVENTS.error);
					$state.transitionTo($rootScope.fromState, $rootScope.fromParams);
					return false;
				}

				// Format the data using the format function.
				$rootScope[pageName].data.formatFn(item, function (err, item) {
					// Handle errors while formatting.
					if (err) {
						Alert.addUnsticky(err.msg || err, "danger", EVENTS.error);
						return false;
					}

					// Copy the data from the item to the forms data object.
					$rootScope[pageName].item = angular.copy(item);
					$rootScope[pageName].itemReadOnly = angular.copy(item);

					// Call the callback method if it is available.
					if ($rootScope[pageName].data.nextFn) {
						$rootScope[pageName].data.nextFn(undefined, $rootScope[pageName].item);
					}
					return true;
				});
			}, function (res) {

				// Alert the user of the error.
				Alert.addUnsticky("Error: " + res.data.error, "danger", EVENTS.error);

				// Call the callback method if it is available.
				if ($rootScope[pageName].data.nextFn) {
					$rootScope[pageName].data.nextFn(res.data.error, $rootScope[pageName].item);
				}
				return false;
			});
		},

		/**
		 * Remove a data form from the root scope.
		 * @param pageName is the name of the data form in the root scope object.
		 * @return boolean to indicate success or failure.
		 */
		remove: function (pageName) {
			// Ensure page name is defined.
			if (!pageName) {
				$log.error("Cannot remove a data form that has an invalid name.");
				return false;
			}

			// Check is data form exists in the root scope.
			if (!$rootScope[pageName]) {
				$log.warn("Data form with name " + pageName + " does not exist.");
				return true;
			}

			// Delete the data form from the root scope.
			$rootScope[pageName] = undefined;
			return true;
		},

		/**
		 * Set a data form's item property with specified key to a specified value.
		 * @param pageName is the name of the data form in the root scope object.
		 * @param key is the data form's item property name.
		 * @param value is the new value.
		 * @return boolean to indicate success or failure.
		 */
		setFieldToValue: function (pageName, key, value) {
			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot set an item's value in a data form that does not exist or has an invalid name.");
				return false;
			}

			$rootScope[pageName].item[key] = angular.copy(value);
			return true;
		},

		/**
		 * Set the data form's data item.
		 * @param pageName is the name of the data form in the root scope object.
		 * @param item is the new item value to be set.
		 * @returns boolean to indicate success or failure.
		 */
		setItem: function (pageName, item) {
			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot populate a data form that does not exist or has an invalid name.");
				return false;
			}

			// Ensure the item is valid, if not notify the user.
			if (!item) {
				Alert.addUnsticky("Error: Invalid item ID.", "danger", EVENTS.error);
				return false;
			}

			// Format the data using the format function.
			$rootScope[pageName].data.formatFn(item, function (err, item) {
				if (err) {
					Alert.addUnsticky(err.msg || err, "danger", EVENTS.error);
					return false;
				}

				// Copy the data from the item to the forms data object.
				$rootScope[pageName].item = angular.copy(item);
				$rootScope[pageName].itemReadOnly = angular.copy(item);

				return true;
			});
		},

		/**
		 * Submit a form's data to the backend server.
		 * @param pageName is the name of the data form in the root scope object.
		 * @param form (optional) a reference to the displayed form object.
		 * @param next is the callback function where the results are returned to.
		 */
		submitForm: function (pageName, form, next) {
			// Ensure next is defined.
			next = (next && typeof(next) === typeof(Function)) ? next : function (err, item) {};

			// Ensure page name is defined and exists in the root scope.
			if (!pageName || !$rootScope[pageName]) {
				$log.error("Cannot submit a form if the data form does not exist or has an invalid name.");
				return next(new Error("Cannot submit a form if the data form does not exist or has an invalid name."));
			}

			// Ensure form is defined.
			if (!form) {
				$log.error("Cannot submit an invalid form.");
				return next(new Error("Cannot submit an invalid form."));
			}

			// Mark the form as submitted.
			$rootScope[pageName].submitted = true;

			// Show any validation issues to the user.
			$rootScope.$broadcast('show-errors-check-validity');

			// If the form is valid, submit it.
			if (form.$valid) {
				if ($rootScope[pageName].isNew) {
					// Create new item on the backend server.
					this.createItem(pageName, next);
				} else {
					// Update the existing item on the backend server.
					this.updateItem(pageName, form, undefined, next);
				}
			} else {
				$log.debug("Cannot submit form because the form's data is invalid.");
				return next(new Error("Cannot submit form because the form's data is invalid."));
			}
		},

		/**
     * Display another form in the data form.
     * @param pageName is the name of the data form in the root scope object.
     * @param formId the ID of the form to switch to.
     * @return boolean to indicate success or failure.
     */
    switchForm: function (pageName, formId, currentForm) {
      // Ensure page name is defined and exists in the root scope.
      if (!pageName || !$rootScope[pageName]) {
        $log.error("Cannot switch forms on a data form that does not exist or has an invalid name.");
        return false;
      }

      // Ensure form ID is defined.
      if (!formId) {
        $log.error("Cannot switch to a form with an invalid name.");
        return false;
      }

      // Do not attempt to switch to a form that is already active.
      if ($rootScope[pageName].activeForm && $rootScope[pageName].activeForm.id === formId) {
        $log.debug("DataForm.switchForm(): Switching forms was cancelled because the form '" + formId + "' is already active.");
        return false;
      }

      // Search for the form with the specified form ID and switch to it.
      for (var i = $rootScope[pageName].forms.length - 1; i >= 0; --i) {
        if ($rootScope[pageName].forms[i].id === formId) {
          // Clear the current form before switching.

					if(currentForm !== undefined) {

						var index = i;
						this.clearFormWithPrompt(pageName, currentForm, function () {
							// Make the new form active
							$rootScope[pageName].activeForm = $rootScope[pageName].forms[index];
							return true;
						});
					} else {
						this.clearForm(pageName, undefined);
						// Make the new form active
						$rootScope[pageName].activeForm = $rootScope[pageName].forms[i];
						return true;
					}

        }
      }
      return false;
    },

    /**
     * Update an item on the backend server using a form's data.
     * @param pageName is the name of the data form in the root scope object.
     * @param form a reference to the displayed form object.
     * @param next is the callback function where the results are returned to.
     */
    updateItem: function (pageName, form, data, next) {
      // Ensure next is defined.
      next = (next && typeof(next) === typeof(Function)) ? next : function (err, item) {};

      // Ensure page name is defined and exists in the root scope.
      if (!pageName || !$rootScope[pageName]) {
        $log.error("Cannot update an item on a data form that does not exist or has an invalid name.");
        return next(new Error("Cannot update an item on a data form that does not exist or has an invalid name."));
      }

			data = (data) ? data : $rootScope[pageName].item;

      // Update the item on the backend server.
      Restangular.one($rootScope[pageName].data.restangularUrl).post($stateParams.id, data).then(function (item) {
        // Notify the user if the item is invalid.
        if (!item) {
          Alert.addUnsticky("An error occurred while updating the item.", "danger", EVENTS.error);
          $log.error("An error occurred while updating the item.");
          return next(new Error("An error occurred while updating the item."));
        }

        // Format the item using the provided format function.
        $rootScope[pageName].data.formatFn(item, function (err, item) {

          // Copy the data from the formatted item to the form's data objects.
          $rootScope[pageName].item = angular.copy(item);
          $rootScope[pageName].itemReadOnly = angular.copy(item);

          // Set the form to pristine condition.
          if (form) {
            form.$setPristine();
          }

          // Return the result to the callback.
          next(undefined, item);
        }, function (res) {
          Alert.addUnsticky(res.data.error, "danger", EVENTS.error);
          next(new Error(res.data.error));
        });
      });
    },

    /**
     * Update a data form's current and read only property with a specified key/value pair.
     * @param pageName is the name of the data form in the root scope object.
     * @param key is the data form's item property name.
     * @param value is the new value.
     * @returns boolean to indicate success or failure.
     */
    updateField: function (pageName, key, value) {
      // Ensure page name is defined and exists in the root scope.
      if (!pageName || !$rootScope[pageName]) {
        $log.error("Cannot update an item in a data form that does not exist or has an invalid name.");
        return false;
      }

      $rootScope[pageName].item[key] = angular.copy(value);
      $rootScope[pageName].itemReadOnly[key] = angular.copy(value);
      return true;
    }

  }
}]);

