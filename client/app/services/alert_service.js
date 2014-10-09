'use strict';

/**
 * Alert service stores a list of alerts that are shown to a user at any
 * given time.
 */
angular.module('SDL.alertService', []).service('Alert', ['$rootScope', 'ALERTS', function($rootScope, ALERTS) {
		// Holds the next alert ID value.  Increments each time it is used.
		var alertIdCount = 0;

		// Holds the current list of alerts.
		this.alerts = [];

		/**
		 * Create and return an alert object.
		 *
		 * @param msg the text to be displayed in the alert.
		 * @param type (optional) is the angular ui alert type e.g. 'danger', 'success', 'warning', or 'info'.  This value will default to 'error'.
		 * @param group (optional) is used to group alerts together so they can be easily removed.
		 * @param btn (optional) is an object that contains properties to be added to the button displayed in the alert.  This properties are equivalent to the properties found on an angular button e.g. 'ng-click'.
		 * @param isCloseBtn (optional) boolean value that when true, shows a close button for the alert.  This value will default to true.
		 * @param isSticky (optional) boolean value that when true, forces the alert to be shown until it is dismissed by the user or other methods.
		 * @return an alert object if the creation was successful, otherwise undefined.
		 */
		this.createAlert = function(msg, type, group, btn, isCloseBtn, isSticky) {
			// Build the alert object.
			var alert = {
				"id": ++alertIdCount,
				"msg": (msg) ? msg : "",
				"isSticky": (isSticky !== undefined) ? isSticky : false,
				"type": (type) ? type : "error",
				"isCloseBtn": (isCloseBtn === undefined) ? true : isCloseBtn
			}

			// Set the alert group, used to easily clear alerts of a similar type.
			alert.group = (group) ? group : alert.type;

			// Add a button if one is specified.
			if(btn) {
				alert.btn = {
					"type": (btn["type"]) ? "btn-"+btn.type : "btn-" + alert.type,
					"text": (btn["text"]) ? btn.text : "OK",
					"ngClick": (btn["ngClick"]) ? btn["ngClick"] : function() {}
				}
			}

			return alert;
		}

		/**
		 * Create and add an alert to be displayed on all pages. This alert will not go away until the user dismisses the alert.
		 *
		 * @param msg the text to be displayed in the alert.
		 * @param type (optional) is the angular ui alert type e.g. 'danger', 'success', 'warning', or 'info'.  This value will default to 'error'.
		 * @param group (optional) is used to group alerts together so they can be easily removed.
		 * @param btn (optional) is an object that contains properties to be added to the button displayed in the alert.  This properties are equivalent to the properties found on an angular button e.g. 'ng-click'.
		 * @param isCloseBtn (optional) boolean value that when true, shows a close button for the alert.  This value will default to true.
		 * @return true if an alert was successfully added, false otherwise.
		 */
		this.addSticky = function(msg, type, group, btn, isCloseBtn) {
			return this.add(this.createAlert(msg, type, group, btn, isCloseBtn, true));
		};

		/**
		 * Remove all alerts in the current list that are not sticky.
		 *
		 * @return a list of removed alerts if successful.  If no alerts were removed or an error occurred an empty list will be returned.
		 */
		this.removeAllSticky = function() {
			return this.removeAllByValue("isSticky", true);
		};

		/**
		 * Create and add an alert to be displayed on the current page. This alert will go away when the user dismisses it or the user navigates to a new page.
		 *
		 * @param msg the text to be displayed in the alert.
		 * @param type (optional) is the angular ui alert type e.g. 'danger', 'success', 'warning', or 'info'.  This value will default to 'error'.
		 * @param group (optional) is used to group alerts together so they can be easily removed.
		 * @param btn (optional) is an object that contains properties to be added to the button displayed in the alert.  This properties are equivalent to the properties found on an angular button e.g. 'ng-click'.
		 * @param isCloseBtn (optional) boolean value that when true, shows a close button for the alert.  This value will default to true.
		 * @return true if an alert was successfully added, false otherwise.
		 */
		this.addUnsticky = function(msg, type, group, btn, isCloseBtn) {
			return this.add(this.createAlert(msg, type, group, btn, isCloseBtn, false));
		};

		/**
		 * Remove all alerts in the current list that are sticky.
		 *
		 * @return a list of removed alerts if successful.  If no alerts were removed or an error occurred an empty list will be returned.
		 */
		this.removeAllUnsticky = function() {
			return this.removeAllByValue("isSticky", false);
		};

		/**
		 * Add a list of alerts to be displayed on the current page.
		 *
		 * @param alerts is an array of alert objects.
		 * @return true will be returned if the alerts were successfully added, false otherwise.
		 */
		this.addAll = function(alerts) {
			if( ! alerts) {
				return false;
			}

			for(var i = alerts.length-1; i>=0; --i) {
				if(alerts[i]) {
					this.alerts.push(angular.copy(alerts[i]));
				}
			}

			// If the alerts array was changed, notify everyone.
			if(alerts.length > 0) {
				$rootScope.$emit(ALERTS.added, alerts)
				return true;
			}

			return false;
		}

		/**
		 * Remove all alerts in the current list.
		 *
		 * @return a list of removed alerts if successful.  If no alerts were removed or an error occurred an empty list will be returned.
		 */
		this.removeAll = function() {
			var removedAlerts = angular.copy(this.alerts);
			this.alerts = [];

			if(removedAlerts.length > 0) {
				$rootScope.$emit(ALERTS.removed, removedAlerts)
			}

			return removedAlerts;
		};

		/**
		 * Remove all alerts in the current list that contain the key/value pair.
		 *
		 * @return a list of removed alerts if successful.  If no alerts were removed or an error occurred an empty list will be returned.
		 */
		this.removeAllByValue = function(key, value) {
			var removedAlerts = [];

			for(var i = this.alerts.length-1; i>=0; --i) {
				if(this.alerts[i][key] === value) {
					removedAlerts.push(this.alerts.splice(i, 1));
				}
			}

			// If the alerts array was changed, notify everyone.
			if(removedAlerts.length > 0) {
				$rootScope.$emit(ALERTS.removed, removedAlerts)
			}

			return removedAlerts;
		};

		/**
		 * Remove all alerts in the current list that are part of a specified group.
		 *
		 * @return a list of removed alerts if successful.  If no alerts were removed or an error occurred an empty list will be returned.
		 */
		this.removeAllGroup = function(group) {
			return this.removeAllByValue("group", group);
		};

		/**
		 * Add an alert to be displayed on the current page.
		 *
		 * @param alert is a valid alert object.
		 * @return true if an alert was successfully added, false otherwise.
		 */
		this.add = function(alert) {
			if( ! alert) {
				return false;
			}

			// Add the alert to the list of alerts.
			this.alerts.push(alert);

			// Let listeners know that a new alert has been added.
			$rootScope.$emit(ALERTS.added, [alert]);

			return true;
		};

		/**
		 * Remove a single alert with the given key/value pair from the current list of alerts.
		 *
		 * @return the removed alert if successful.  If an alert was not removed or an error occurred, then a value of undefined will be returned.
		 */
		this.removeByValue = function(key, value) {
			var removedAlert;

			for(var i = this.alerts.length-1; i>=0; --i) {
				if(this.alerts[i][key] === value) {
					removedAlert.push(this.alerts.splice(i, 1));
					break;
				}
			}

			// If the alerts array was changed, notify everyone.
			if(removedAlert.length > 0) {
				$rootScope.$emit(ALERTS.removed, [removedAlert])
			}

			return removedAlert;
		}

		/**
		 * Remove a single alert with the given ID.
		 *
		 * @return the removed alert if successful.  If an alert was not removed or an error occurred, then a value of undefined will be returned.
		 */
		this.removeById = function(id) {
			return this.removeByValue("id", id);
		};

		/**
		 * Remove a single alert with the given index in the current list of alerts.
		 *
		 * @return the removed alert if successful.  If an alert was not removed or an error occurred, then a value of undefined will be returned.
		 */
		this.removeByIndex = function(index) {
			var removedAlert;

			if(index !== undefined && index >= 0 && index < this.alerts.length) {
				removedAlert = this.alerts.splice(index, 1);
				$rootScope.$emit(ALERTS.removed, removedAlert);
			}

			return removedAlert;
		};

		// Return the service object.
		return this;
	}]);

