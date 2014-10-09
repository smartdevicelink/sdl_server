// ~> Service

'use strict';

/**
 * Data Table Service handles logic to display, search, and modify a table of data.
 * @param $filter used for formatting data displayed to the user.
 * @param $log is a service for logging safely to the browser's console, if present.
 * @param $rootScope parent scope for the entire application.
 * @param Restangular service for performing CRUD operations on the server's backend.
 * @param ngTableParams is a table settings object used to create ng Tables.
 */
angular.module('SDL.dataTableService', []).factory('DataTableService', ['$filter', '$log', '$rootScope', 'Restangular', 'ngTableParams', function($filter, $log, $rootScope, Restangular, ngTableParams) {
		// Default table object.
		var defaultTable = {
			items: [],                 // Stores all data for table.
			selected: {                // Information about selected items
				enabled: false,          // Enable/disable selection of items
				count: 0,                // Current number of selected items
				isAll: false,            // Flag indicating if all items are selected.
				isAllCheckbox: false,    // Flag indicating if the select all checkbox is selected.
				isIndeterminate: false   // Flag indicating if the select all checkbox is indeterminate.
			},
			ui: {                                     // Stores info related to the view
				selectAllBtn: "selectAllItemsCheckbox"  // ID of the select all button.
			},
			data: {                                   // Stores information about getting dealing with the data
				restangular: undefined,                 // Restangular URL to perform CRUD on data.
				formatFn: function(data, next) { 				// Method to format the data once retrieved.
					next(undefined, data)
				}
			}
		};

		return {

			/**
			 * Create a new ng table object and add it to the root scope.
			 * @param tableName is the name of the table in the root scope object.
			 * @param data is an array of data to be used in the data table.
			 * @param tableParams (optional) is a ngTable parameter object.
			 * @param tableSettings (optional) is a ngTable settings object.
			 * @param overwrite (optional) when false the create method will not write over an existing table.
			 */
			create: function(tableName, data, tableParams, tableSettings, overwrite) {
				// Ensure table name and data are defined.
				if( ! tableName || ! data) {
					$log.error("Cannot create a data table with an invalid name and/or invalid data.");
					return;
				}

				// Check if the table already exists in the root scope.  Do not write over an existing
				// table is the overwrite parameter is false.  By default, overwrite is assumed true.
				if(overwrite === false && $rootScope[tableName] !== undefined) {
					$log.error("Error:  Cannot override an existing "+tableName+" data table.");
					return;
				}

				// Reuse an existing table is possible.
				if($rootScope[tableName] !== undefined) {
					for(var key in defaultTable) {
						if(defaultTable.hasOwnProperty(key)) {
							$rootScope[tableName][key] = defaultTable[key];
						}
					}
					this.updateData(tableName, data);
					return;
				}

				// Create a default table in the root scope with the specified table name.
				$rootScope[tableName] = {};
				angular.copy(defaultTable, $rootScope[tableName]);

				// Set the tables data set.
				$rootScope[tableName].items = (data) ? data : [];

				// Reload the table now that data is available.
				//$rootScope[tableName].ngTableParams.reload();
				//this.updateData(tableName, data);

				// If the ngTable parameters are not defined, set them to default.
				tableParams = (tableParams) ? tableParams : {
					page: 1,
					count: 10,
					filter: {},
					sorting: {}
				};

				// If the table settings are not defined, set them to default.
				tableSettings = (tableSettings) ? tableSettings : {

					// Set the delay to filter search results.
					filterDelay: 0,

					// Create a function to populate the table with data.
					getData: function($defer, params) {
						var filteredData = params.filter() ? $filter('filter')($rootScope[tableName].items, params.filter()) : $rootScope[tableName].items;
						var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : $rootScope[tableName].items;

						if(orderedData) {
							params.total(orderedData.length);
							if( ! angular.isArray(orderedData)) {
								orderedData = [orderedData];
							}
							$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
						} else {
							params.total(0);
							$defer.resolve([]);
						}
					}
				};

				// Create the ngTable
				$rootScope[tableName].ngTableParams = new ngTableParams(tableParams, tableSettings);

			},

			/**
			 * Create a new ng table object and add it to the root scope.  Then populate the table with
			 * data from the backend server's endpoint using Restangular.
			 * @param tableName is the name of the table in the root scope object.
			 * @param restangularUrl is the server's endpoint used to retrieve data using Restangular.
			 * @param formatFn (optional) formats the raw data into a usable format for the data table.
			 * @param tableParams (optional) is a ngTable parameter object.
			 * @param tableSettings (optional) is a ngTable settings object.
			 * @param overwrite (optional) when false the create method will not write over an existing table.
			 */
			createAndPopulate: function(tableName, restangularUrl, formatFn, tableParams, tableSettings, overwrite) {
				// Ensure table name and data are defined.
				if( ! tableName || ! restangularUrl) {
					$log.error("Cannot create a data table with an invalid name and/or invalid data.");
					return;
				}

				// Check if the table already exists in the root scope.  Do not write over an existing
				// table is the overwrite parameter is false.  By default, overwrite is assumed true.
				if(overwrite === false && $rootScope[tableName] !== undefined) {
					$log.error("Error:  Cannot override an existing "+tableName+" data table.");
					return;
				}

				// Create a default table in the root scope with the specified table name.
				$rootScope[tableName] = {};
				angular.copy(defaultTable, $rootScope[tableName]);

				// Set the format function, if one was given.
				if(formatFn) {
					$rootScope[tableName].data.formatFn = formatFn;
				}

				// Create the Restangular object.
				$rootScope[tableName].data.restangular = Restangular.all(restangularUrl);

				// Load the data from the server backend using restangular.
				this.reloadData(tableName);

				// If the ngTable parameters are not defined, set them to default.
				tableParams = (tableParams) ? tableParams : {
					page: 1,
					count: 10,
					filter: {},
					sorting: {}
				};

				// If the table settings are not defined, set them to default.
				tableSettings = (tableSettings) ? tableSettings : {
					filterDelay: 0,
					getData: function($defer, params) {
						var filteredData = params.filter() ? $filter('filter')($rootScope[tableName].items, params.filter()) : $rootScope[tableName].items;
						var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : $rootScope[tableName].items;

						if(orderedData) {
							params.total(orderedData.length);
							if( ! angular.isArray(orderedData)) {
								orderedData = [orderedData];
							}
							$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
						} else {
							params.total(0);
							$defer.resolve([]);
						}
					}
				};

				// Create the ngTable
				$rootScope[tableName].ngTableParams = new ngTableParams(tableParams, tableSettings);
			},

			/**
			 * Delete a created table.
			 * @param tableName is the name of the table in the root scope object.
			 */
			remove: function(tableName) {
				if($rootScope[tableName] === undefined) {
					$log.error("Cannot delete a data table with an invalid name.");
					return;
				}

				// Remove a table from the root scope.
				$rootScope[tableName] = undefined;
			},

			/**
			 * Enabled/Disable selection of the table items.  If value is undefined,
			 * then enable select will be toggled instead.
			 * @param tableName is the name of the table in the root scope object.
			 * @param value (optional) when true will enable the data table's selection, when false it will disable, and when undefined the selection will be toggled.
			 * @param clearSelectedItems (optional) when true, it will clear all the currently selected items.
			 */
			enableSelected: function(tableName, value, clearSelectedItems) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot enable selection for a data table that does not exist or has an invalid name.");
					return;
				}

				// Check if selected is already enabled.  Don't do anything if it is.
				if($rootScope[tableName].selected.enabled === value) {
					return;
				}

				// Check if value is defined, if it is not then default it to toggling enable/disable.
				value = (value === undefined) ? ! $rootScope[tableName].selected.enabled : value;

				// Enable/disable selection.
				$rootScope[tableName].selected.enabled = value;

				// Clear current items selected if the clearSelected flag is true.
				if(clearSelectedItems) {
					this.selectAllItems(tableName, false);
				}

				// Update the UI.
				this.updateUi(tableName);
			},

			/**
			 * Select or deselect all the items in the table. If value is undefined, select all items will be toggled instead.
			 * @param tableName is the name of the table in the root scope object.
			 * @param value (optional) when true all items will be selected, when false all items will be deselected, and when undefined the selection of all items will be toggled.
			 */
			selectAllItems: function(tableName, value) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot select all items in a data table that does not exist or has an invalid name.");
					return;
				}

				// Make sure selection is enabled.
				if( ! $rootScope[tableName].selected.enabled) {
					//$log.debug("Cannot select all items if the data table 'selected' property is not enabled.");
					return;
				}

				// If value is undefined, then toggle selectAllItems.
				if(value === undefined) {
					// If one of the current flags for indeterminate or isAll are enabled, then deselect all items.
					value = ! ($rootScope[tableName].selected.isIndeterminate || $rootScope[tableName].selected.isAll);
				}

				// Update all the table's items with the new selected value.
				for(var i = $rootScope[tableName].items.length-1; i>=0; --i) {
					$rootScope[tableName].items[i].selected = value;
					$rootScope[tableName].items[i]["selectedCheckbox"] = value;
				}

				// Set the flag(s) for if all the items are selected.
				$rootScope[tableName].selected.isAll = value;
				$rootScope[tableName].selected.isIndeterminate = false;

				// Set the new selected count.
				$rootScope[tableName].selected.count = (value) ? $rootScope[tableName].items.length : 0;

				// Update the UI.
				this.updateUi(tableName);
			},

			/**
			 * Select an individual item in the table.  If value is undefined, the selected item will be toggled instead.
			 * @param tableName is the name of the table in the root scope object.
			 * @param item is the data table item to be selected.
			 * @param selected (optional) when true the item will be selected, when false the item will be deselected, and when undefined the item's selection will be toggled.
			 */
			selectItem: function(tableName, item, selected) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot select an item in a data table that does not exist or has an invalid name.");
					return;
				}

				// Make sure selection is enabled.
				if( ! $rootScope[tableName].selected.enabled) {
					//$log.debug("DataTable.selectItem(): Item was not selected because the 'selected' property is not enabled.");
					return;
				}

				// Make sure the item is valid.
				if( ! item) {
					$log.error("Cannot select an invalid item.");
					return;
				}

				// Ensure selected has a value.  Default to toggling the item.
				selected = (selected === undefined) ? ! item["selected"] : selected;

				// Mark the application and app checkbox as selected or deselected.
				item["selected"] = selected;
				item["selectedCheckbox"] = selected;

				// Update the number of items selected.
				$rootScope[tableName].selected.count += (selected) ? 1 : -1;

				// Update selected flag.
				$rootScope[tableName].selected.isAll = ($rootScope[tableName].selected.count >= $rootScope[tableName].items.length);
				$rootScope[tableName].selected.isIndeterminate = ($rootScope[tableName].selected.count > 0 && ! $rootScope[tableName].selected.isAll);

				this.updateUi(tableName);
			},

			/**
			 * Delete all the currently selected items from the backend server and from the client side data list.
			 * @param tableName is the name of the table in the root scope object.
			 */
			deleteAllSelectedItems: function(tableName) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot delete an item in a data table that does not exist or has an invalid name.");
					return;
				}

				// Make sure selection is enabled.
				if( ! $rootScope[tableName].selected.enabled) {
					$log.error("Cannot delete all selected items if the data table 'selected' property is not enabled.");
					return;
				}

				// Delete each item that is selected.
				for(var i = $rootScope[tableName].items.length-1; i>=0; --i) {

					if($rootScope[tableName].items[i].selected) {
						// Call remove on the restangular object, deleting it on the backend.
						$rootScope[tableName].items[i].remove();

						// Remove the item from the client side list.
						$rootScope[tableName].items.splice(i, 1);
					}
				}

				// Check if the current page is empty by seeing if it is greater then the maximum number of pages possible with the current item count.
				// If it is we need to force it back to first page, otherwise it shows a blank page.
				var maxNumOfPages = Math.ceil($rootScope[tableName].items.length / $rootScope[tableName].ngTableParams.$params.count);
				if($rootScope[tableName].ngTableParams.$params.page > maxNumOfPages) {
					$rootScope[tableName].ngTableParams.$params.page = 1;
				}

				// Reload the ng Table.
				$rootScope[tableName].ngTableParams.reload();

				// Toggle off selection of items.
				this.enableSelected(tableName);
			},

			deleteAllSelectedSubItems: function(tableName, next) {
				// If the tableName is invalid or the table does not exist, then exit.
				if (!tableName || !$rootScope[tableName]) {
					$log.error("Cannot delete an item in a data table that does not exist or has an invalid name.");
					return;
				}

				// Make sure selection is enabled.
				if (!$rootScope[tableName].selected.enabled) {
					$log.error("Cannot delete all selected items if the data table 'selected' property is not enabled.");
					return;
				}

				// Delete each item that is selected.
				for (var i = $rootScope[tableName].items.length - 1; i >= 0; --i) {

					if ($rootScope[tableName].items[i].selected) {
						// Remove the item from the client side list.
						$rootScope[tableName].items.splice(i, 1);
					}
				}

				if (next) {
					next(undefined, angular.copy($rootScope[tableName].items));
				}

				// Check if the current page is empty by seeing if it is greater then the maximum number of pages possible with the current item count.
				// If it is we need to force it back to first page, otherwise it shows a blank page.
				var maxNumOfPages = Math.ceil($rootScope[tableName].items.length / $rootScope[tableName].ngTableParams.$params.count);
				if($rootScope[tableName].ngTableParams.$params.page > maxNumOfPages) {
					$rootScope[tableName].ngTableParams.$params.page = 1;
				}

				// Reload the ng Table.
				$rootScope[tableName].ngTableParams.reload();

				// Toggle off selection of items.
				this.enableSelected(tableName);
			},

			/**
			 * Update UI elements based on the current data table object.
			 * Precondition:  tableName and $rootScope[tableName] are both defined.
			 * @param tableName is the name of the table in the root scope object.
			 */
			updateUi: function(tableName) {
				if($rootScope[tableName].selected.enabled) {

					// Mark the checkbox as indeterminate if more than 1 value is selected, but not all are selected.
					angular.element(document.getElementById($rootScope[tableName].ui.selectAllBtn)).prop("indeterminate", $rootScope[tableName].selected.isIndeterminate);

					// Mark the checkbox value as checked if any item is selected.
					$rootScope[tableName].selected.isAllCheckbox = ($rootScope[tableName].selected.count > 0);
				}
			},

			/**
			 * Clear all table filters.
			 * @param tableName is the name of the table in the root scope object.
			 */
			clearFilters: function(tableName) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot clear filters for a data table that does not exist or has an invalid name.");
					return;
				}

				// Clear the ng Table filter object.
				$rootScope[tableName].ngTableParams.filter({});
			},

			/**
			 * Refresh the data by pulling from the backend server.
			 * @param tableName is the name of the table in the root scope object.
			 */
			reloadData: function(tableName) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot delete an item in a data table that does not exist or has an invalid name.");
					return;
				}

				// Make sure a valid restangular object is defined.
				if(! $rootScope[tableName].data.restangular) {
					$log.error('Cannot reload a data table without a valid restangular object.");')
					return;
				}

				// Get data from the backend server.
				$rootScope[tableName].data.restangular.getList().then(function(data) {

					// Format the data
					$rootScope[tableName].data.formatFn(data, function(err, data) {

						// Set the tables data set.
						$rootScope[tableName].items = (data) ? data : [];

						// Reload the table now that data is available.
						$rootScope[tableName].ngTableParams.reload();
					});
				});
			},

			createWithPromise: function(tableName, dataPromise, tableParams, tableSettings, overwrite) {
				// Ensure table name and data are defined.
				if( ! tableName || ! data) {
					$log.error("Cannot create a data table with an invalid name and/or invalid data.");
					return;
				}

				// Check if the table already exists in the root scope.  Do not write over an existing
				// table is the overwrite parameter is false.  By default, overwrite is assumed true.
				if(overwrite === false && $rootScope[tableName] !== undefined) {
					$log.error("Error:  Cannot override an existing "+tableName+" data table.");
					return;
				}

				// Create a default table in the root scope with the specified table name.
				$rootScope[tableName] = {};
				angular.copy(defaultTable, $rootScope[tableName]);

				//dataPromise

				// Set the tables data set.
				$rootScope[tableName].items = (data) ? data : [];

				// If the ngTable parameters are not defined, set them to default.
				tableParams = (tableParams) ? tableParams : {
					page: 1,
					count: 10,
					filter: {},
					sorting: {}
				};

				// If the table settings are not defined, set them to default.
				tableSettings = (tableSettings) ? tableSettings : {

					// Set the delay to filter search results.
					filterDelay: 0,

					// Create a function to populate the table with data.
					getData: function($defer, params) {
						var filteredData = params.filter() ? $filter('filter')($rootScope[tableName].items, params.filter()) : $rootScope[tableName].items;
						var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : $rootScope[tableName].items;

						params.total(orderedData.length);

						$defer.resolve(orderedData.slice((params.page() -1) * params.count(), params.page() * params.count()));
					}
				};

				// Create the ngTable
				$rootScope[tableName].ngTableParams = new ngTableParams(tableParams, tableSettings);
			},

	  	updateData: function(tableName, data) {
				// Ensure table name and data are defined.
				if( ! tableName || ! data) {
					$log.error("Cannot create a data table with an invalid name and/or invalid data.");
					return;
				}

				// Set the tables data set.
				$rootScope[tableName].items = (data) ? data : [];

				// Reload the table now that data is available.
				$rootScope[tableName].ngTableParams.reload();
			},

			updateDataById: function(tableName, data) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot update a data row in a data table that does not exist or has an invalid name.");
					return;
				}

				// Ensure the data is valid.
				if(! data) {
					$log.error("Cannot update a data row with an invalid data.");
					return;
				}

				var isUpdated = false;

				for(var i = $rootScope[tableName].items.length-1; i>=0; --i) {
					if($rootScope[tableName].items[i]._id === data._id) {
						$rootScope[tableName].items[i] = data;
						isUpdated = true;
						break;
					}
				}

				// If we are not updating a row, then add it.
				if( ! isUpdated) {
					$rootScope[tableName].items.push(data);
				}

				// Reload the table now that data is available.
				$rootScope[tableName].ngTableParams.reload();
			},

			updateDataRow: function(tableName, dataRow, data) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot update a data row in a data table that does not exist or has an invalid name.");
					return;
				}

				// Ensure the data is valid.
				if(! data) {
					$log.error("Cannot update a data row with an invalid data.");
					return;
				}

				// Ensure the data row is valid.
				if(dataRow === undefined || dataRow < 0) {
					$log.error("The data row number "+dataRow+" is invalid.  Cannot update data row.");
					return;
				}

				// Set the tables data set.
				$rootScope[tableName].items[dataRow] = data;

				// Reload the table now that data is available.
				$rootScope[tableName].ngTableParams.reload();
			},

			// Check if the table already exists in the root scope.
			isTable: function(tableName) {
				return ($rootScope[tableName] !== undefined);
			},

			getItems: function(tableName) {
				// If the tableName is invalid or the table does not exist, then exit.
				if( ! tableName || ! $rootScope[tableName]) {
					$log.error("Cannot return data from a table that does not exist or has an invalid name.");
					return;
				}

				return $rootScope[tableName].items;
			}
		}

}]);
