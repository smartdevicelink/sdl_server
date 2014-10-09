module.exports = function(app, db, config) {

	// Import modules.
	var request = require("request"),
			cheerio = require("cheerio"),
			path = require("path"),
			fs = require("fs");

	/**
	 * Get the  data from the specified url.
	 * @param url is the location to download html from.
	 * @param next is the callback method.
	 */
	var getDataFromUrl = function(url, next) {
		console.log("Requesting data from " + url);
		request.get(url, function(err, res, body) {
			if(err) {
				return next(err);
			}

			if( ! body || ! res || ! res.statusCode == 200) {
				return next(new Error("Could not retrieve data from " + languageUrl));
			}

			next(undefined, body);
		});
	};

	var formatCountryData = function(data, next) {
		if( ! data) {
			return next(new Error("Can not format invalid country data."));
		}

		//var countries = [];
		var countries = CSVToArray(data);
		countries.splice(0,1);
		for(var i = countries.length-1; i >= 0; --i) {
			if(countries[i] !== undefined && countries[i].length > 1 && countries[i][0] !== undefined && countries[i][0] != "" && countries[i][1] !== undefined && countries[i][1] != "") {
				countries[i] = {
					"country": countries[i][0],
					"code": countries[i][1].toLowerCase()
				};
			} else {
				countries.splice(i, 1);
			}
		}

		next(undefined, countries);
	};

	/**
	 * Parse the html language data and format it in a json array for consumption.
	 * @param data is the language data in html.
	 * @param next is the callback method.
	 */
	var formatLanguageData = function(data, next) {
		if( ! data) {
			return next(new Error("Can not format invalid language data."));
		}

		var languages = [];

		// html for an empty table cell.
		var blank = "&#xA0;";

		// Load the html into cheerio parser.
		$ = cheerio.load(data);

		// Find the language data and iterate over it, formatting it in to the json array.
		$('table').children().first().children().children('table').children('tr').next().each(function(i, elem) {
			var language = $(this).children().next().html(),
					iso6932 = $(this).children().next().next().next().html(),
					iso6931 = $(this).children().next().next().next().next().html();

			languages[i] = {
				"language": (language !== undefined && language != blank) ? language.replace(/;/g, ",") : "",
				"iso6391": (iso6931 !== undefined && iso6931 != blank) ? iso6931 : "",
				"iso6392": (iso6932 !== undefined && iso6932 != blank) ? iso6932 : ""
			};
		});

		next(undefined, languages);
	};

	/**
	 * Write data to a file.
	 * @param data is the json data to be written
	 * @param file is the location to be write the data to.
	 * @param next is a callback method.
	 */
	var saveData = function(data, file, next) {
		if( ! data) {
			return next(new Error("Cannot write invalid data to file " + file));
		}

		if( ! file) {
			return next(new Error("Cannot write data to invalid file " + file));
		}

		console.log("Writing to file " + file);
		fs.writeFile(file, JSON.stringify(data, null, 2), function(err) {
			if(err) {
				return next(err);
			}

			next(undefined, data);
		});
	};


	// ref: http://stackoverflow.com/a/1293163/2343
	// This will parse a delimited string into an array of
	// arrays. The default delimiter is the comma, but this
	// can be overriden in the second argument.
	function CSVToArray( strData, strDelimiter ){
		// Check to see if the delimiter is defined. If not,
		// then default to comma.
		strDelimiter = (strDelimiter || ",");

		// Create a regular expression to parse the CSV values.
		var objPattern = new RegExp(
			(
				// Delimiters.
				"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

				// Standard fields.
				"([^\"\\" + strDelimiter + "\\r\\n]*))"
				),
			"gi"
		);


		// Create an array to hold our data. Give the array
		// a default empty first row.
		var arrData = [[]];

		// Create an array to hold our individual pattern
		// matching groups.
		var arrMatches = null;


		// Keep looping over the regular expression matches
		// until we can no longer find a match.
		while (arrMatches = objPattern.exec( strData )){

			// Get the delimiter that was found.
			var strMatchedDelimiter = arrMatches[ 1 ];

			// Check to see if the given delimiter has a length
			// (is not the start of string) and if it matches
			// field delimiter. If id does not, then we know
			// that this delimiter is a row delimiter.
			if (
				strMatchedDelimiter.length &&
				strMatchedDelimiter !== strDelimiter
				){

				// Since we have reached a new row of data,
				// add an empty row to our data array.
				arrData.push( [] );

			}

			var strMatchedValue;

			// Now that we have our delimiter out of the way,
			// let's check to see which kind of value we
			// captured (quoted or unquoted).
			if (arrMatches[ 2 ]){

				// We found a quoted value. When we capture
				// this value, unescape any double quotes.
				strMatchedValue = arrMatches[ 2 ].replace(
					new RegExp( "\"\"", "g" ),
					"\""
				);

			} else {

				// We found a non-quoted value.
				strMatchedValue = arrMatches[ 3 ];

			}


			// Now that we have our value string, let's add
			// it to the data array.
			arrData[ arrData.length - 1 ].push( strMatchedValue );
		}

		// Return the parsed data.
		return( arrData );
	}


	return {
		"updateLanguageCache": function(next) {
			getDataFromUrl("http://140.147.249.7/standards/iso639-2/php/English_list.php", function(err, data) {
				if(err) {
					return next(err);
				}
				formatLanguageData(data, function(err, data) {
					if(err) {
						return next(err);
					}
					saveData(data, path.normalize(config.paths.serverDataFolder + "languages.js"), next);
				});
			});
		},

		"updateCountryCache": function(next) {
			getDataFromUrl("https://raw.githubusercontent.com/datasets/country-list/master/data.csv", function(err, data) {
				if(err) {
					return next(err);
				}
				//console.log(data);
				formatCountryData(data, function(err, data) {
					if(err) {
						return next(err);
					}
					saveData(data, path.normalize(config.paths.serverDataFolder + "countries.js"), next);
				});
			});
		}
	};
};