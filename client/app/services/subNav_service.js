'use strict';

/**
 */
angular.module('SDL.subNavService', []).factory('SubNavService', function($rootScope, $state) {
		return {
			createBtn: function(text, isActive, fn, iconClass, btnClass, enabled) {
				var onClickFn = function() {
					this.isActive = ! this.isActive;
					if(fn) {
						return fn();
					}
				};
				return {
					'enabled': (enabled !== undefined) ? enabled : true,
					'text': text || 'New',
					'onClick': onClickFn,
					'isActive': (isActive !== undefined) ? isActive : false,
					'iconClass': iconClass,
					'btnClass': btnClass
				}
			},

			create: function(left, middle, right, enabled) {
				if(left) {
					left.btnClass = (left.btnClass) ? left.btnClass : 'btn-success';
					left.iconClass = (left.iconClass) ? left.iconClass : 'fa-plus';
				}

				if(middle) {
					middle.btnClass = (middle.btnClass) ? middle.btnClass : 'btn-primary';
					middle.iconClass = (middle.iconClass) ? middle.iconClass : 'fa-search';
				}

				if(right) {
					right.btnClass = (right.btnClass) ? right.btnClass : 'btn-danger';
					right.iconClass = (right.iconClass) ? right.iconClass : 'fa-times';
				}

				return {
					leftBtn: left,
					middleBtn: middle,
					rightBtn: right
				}
			},

			propertyName: function() {
				return "subNav";
			},

			show: function(subNavObject) {
				$rootScope.subNav = subNavObject;
				$rootScope.isSubNavEnabled = true;
			},

			hide: function() {
				$rootScope.isSubNavEnabled = false;
			},

			isLeftBtnActive: function() {
				return ($rootScope.subNav && $rootScope.subNav.leftBtn) ? $rootScope.subNav.leftBtn.isActive : false;
			},
			isMiddleBtnActive: function() {
				return ($rootScope.subNav && $rootScope.subNav.middleBtn) ? $rootScope.subNav.middleBtn.isActive : false;
			},
			isRightBtnActive: function() {
				return ($rootScope.subNav && $rootScope.subNav.rightBtn) ? $rootScope.subNav.rightBtn.isActive : false;
			},
			clickLeftBtn: function() {
				if($rootScope.subNav && $rootScope.subNav.leftBtn) {
					$rootScope.subNav.leftBtn.onClick();
				} else {
					console.log("Cannot click an undefined left button.")
				}
			},
			clickMiddleBtn: function() {
				if($rootScope.subNav && $rootScope.subNav.middleBtn) {
					$rootScope.subNav.middleBtn.onClick();
				} else {
					console.log("Cannot click an undefined middle button.")
				}
			},
			clickRightBtn: function() {
				if($rootScope.subNav && $rootScope.subNav.rightBtn) {
					$rootScope.subNav.rightBtn.onClick();
				} else {
					console.log("Cannot click an undefined right button.")
				}
			},

			toggleRightBtn: function() {
				$rootScope.subNav.rightBtn.isActive = ! $rootScope.subNav.rightBtn.isActive;
			}
		}
	});

