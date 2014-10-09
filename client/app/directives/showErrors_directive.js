'use strict';

/**
 */
angular.module('SDL.showErrorsDirective', []).directive('showErrors', function($timeout) {
	return {
		restrict: 'A',
		require: '^form',
		link: function(scope, elem, attrs, formCtrl) {
			// Append error icon.
			elem.append('<span class="fa fa-times-circle form-control-feedback"/>');

			var inputElem = elem[0].querySelector("[name]");

			var inputAngularElem = angular.element(inputElem);

			var inputName = inputAngularElem.attr('name');

			// Apply has-error class after the user leaves the text box.
			// TODO: They added $touch event in latest version of angular and we should not have to bind to the 'blur' event.
			inputAngularElem.bind('blur', function() {
				toggleClassIfInvalid();
			});

			// When the text changes, check if valid.
			inputAngularElem.bind('keyup', function() {
				toggleClassIfInvalid();
			});

			// When the text changes, check if valid.
			inputAngularElem.bind('change', function() {
				toggleClassIfInvalid();
			});

			// If input element is a select control.
			if(inputAngularElem[0].nodeType === 1) {
				inputAngularElem.bind('select', function() {
					toggleClassIfInvalid();
				});
			}

			// Event to force validation. Call $scope.$broadcast('show-errors-check-validity') in ctrls to check all controls that implement this directive.
			scope.$on('show-errors-check-validity', function() {
				toggleClassIfInvalid();
			});

			// Event to clear validation. Call $scope.$broadcast('show-errors-reset) in ctrls to clear error messages.
			scope.$on('show-errors-reset', function() {
				$timeout(function() {
					elem.removeClass('has-error has-feedback', false);
				}, 0, false);
			});

			function toggleClassIfInvalid() {
				elem.toggleClass('has-error has-feedback', isInputInvalid(formCtrl[inputName]));
			}

			function isInputInvalid(input) {
				var isInvalid = ((input.$invalid && !input.$pristine) || (input.$invalid && scope.submitted));

				if(isInvalid === undefined) {
					return true;
				} else {
					return isInvalid;
				}
			}
		}
	};
});