'use strict';

/**
 */
angular.module('SDL.cacheService', []).factory('CacheService', ['$cacheFactory', 'Restangular', function($cacheFactory, Restangular) {
	var cache = $cacheFactory('selectOptionsCache');

	// Check if the cahce has any values.
	if(cache.info().size == 0) {
		// Intialize cached values.
		Restangular.all('categories.json').getList().then(function(categories) {
			cache.put('sdlCategories', categories);
		});

		Restangular.all('sdlversions.json').getList().then(function(sdlVersions) {
			cache.put('sdlVersions', sdlVersions);
		});

		// TODO: Save or define somewhere else so they are not so hard coded.
		cache.put('iosAppStoreCategories', [
			'Books',
			'Business',
			'Catalogs',
			'Education',
			'Entertainment',
			'Finance',
			'Food & Drink',
			'Games',
			'Health & Fitness',
			'Lifestyle',
			'Medical',
			'Music',
			'Navigation',
			'News',
			'Photo & Video',
			'Productivity',
			'Reference',
			'Social Networking',
			'Sports',
			'Travel',
			'Utilities',
			'Weather',
		]);

		cache.put('androidAppStoreCategories', [
			'Books & Reference',
			'Business',
			'Comics',
			'Communication',
			'Education',
			'Entertainment',
			'Finance',
			'Games',
			'Health & Fitness',
			'Libraries & Demo',
			'Lifestyle',
			'Live Wallpaper',
			'Media & Video',
			'Medical',
			'Music & Audio',
			'News & Magazines',
			'Personalization',
			'Photography',
			'Productivity',
			'Shopping',
			'Social',
			'Sports',
			'Tools',
			'Transportation',
			'Travel & Local',
			'Weather',
			'Widgets'
		]);
	}

	return cache;
}]);