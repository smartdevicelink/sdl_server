
'use strict';

/**
 * Session stores data related to the languages.
 */
angular.module('SDL.languageService', []).service('LanguageService', ['$q', '$rootScope', '$log', 'Restangular', 'EVENTS', function($q, $rootScope, $log, Restangular, EVENTS) {
	var languagesRestangularUrl = "languages";
	var countriesRestangularUrl = "countries";

	var language = undefined;
	var country = undefined;

	var languages = [];
	var countries = [];

	var update = function(_languages, _countries) {
		var deferred = $q.defer();

		if(_languages && _countries) {
			languages = _languages;
			countries = _countries;
			deferred.resolve(true);
			$rootScope.$broadcast(EVENTS.languagesUpdated);
		} else {
			// Create a new language restangular object if needed.
			if ( ! language) {
				language = Restangular.all(languagesRestangularUrl);
			}

			// Create a new country restangular object if needed.
			if ( ! country) {
				country = Restangular.all(countriesRestangularUrl);
			}

			// Get the list of languages from the backend server.
			language.getList().then(function(_languages) {
				if ( ! _languages) {
					Alert.addSticky("Error: Cannot update languages.", 'danger', "languageService");
					deferred.reject("Error: Cannot update languages.");
					return;
				}

				languages = _languages;

				country.getList().then(function(_countries) {
					if (!countries) {
						Alert.addSticky("Error: Cannot update countries.", 'danger', "countryService");
						deferred.reject("Error: Cannot update countries.");
						return;
					}

					countries = _countries;

					deferred.resolve(true);
					$rootScope.$broadcast(EVENTS.languagesUpdated);

				}, function countriesErrorCallback(res) {
					if (res && res.data && res.data.err) {
						Alert.addSticky(res.data.error, 'danger', "countryService");
						deferred.reject(res.data.error);
					} else {
						$log.error(res);
						deferred.reject("Error: Cannot get countries from server.");
					}
				});

			}, function languagesErrorCallback(res) {
				if (res && res.data && res.data.err) {
					Alert.addSticky(res.data.error, 'danger', "languageService");
					deferred.reject(res.data.error);
				} else {
					$log.error(res);
					deferred.reject("Error: Cannot get languages from server.");
				}
			});
		}

		return deferred.promise;
	};

	var destroy = function() {
		languages = [];
		countries = [];
		language = undefined;
		country = undefined;
		return true;
	};

	var getLanguages = function() {
		return languages;
	};

	var getCountries = function() {
		return countries;
	};

	var getLanguageByCode = function(code) {
		if(code !== undefined) {
			for (var i = languages.length - 1; i >= 0; --i) {
				if (languages[i].iso6391 === code) {
					return languages[i];
				}
			}
		}
		return undefined;
	};

	var getCountryByCode = function(code) {
		if(code !== undefined) {
			for (var i = countries.length - 1; i >= 0; --i) {
				if (countries[i].code === code) {
					return countries[i];
				}
			}
		}
		return undefined;
	};

	var updateIfNotCached = function() {
		if( (countries === undefined || countries.length <= 0) || (languages === undefined || languages.length <= 0) ) {
			return update();
		} else {
			var deferred = $q.defer();
			deferred.resolve(true);
			return deferred.promise;
		}
	};

	return {
		"getLanguages": getLanguages,
		"getCountries": getCountries,
		"update": update,
		"destroy": destroy,
		"getLanguageByCode": getLanguageByCode,
		"getCountryByCode": getCountryByCode,
		"updateIfNotCached": updateIfNotCached
	}

}]);
