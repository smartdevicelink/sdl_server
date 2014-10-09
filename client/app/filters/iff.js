'use strict';

/**
 * Inline if statement to be used anywhere.
 */
angular.module('SDL.iff', []).filter('iff', function() {
	return function(input, trueValue, falseValue) {
		return input ? trueValue : falseValue;
	};
});