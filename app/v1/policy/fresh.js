const app = require('../app');
const sql = require('sql-bricks');

//TODO: make 3 separate queries to all of the tables in func groups, joining them together in javascript
//make sure that only the RELEVENT IDs in the function_group_info are used to get more data in the other tables
//this will depend on what environment to run the query in (staging vs production)
module.exports = {
	//pieces together the module_config, functional_groupings, and consumer_friendly_messages JSON together
	constructStaticTable: function (next) {

	},
	makeCoolTables: function (next) {
		app.locals.db.sqlCommand(app.locals.sql.funcGroup.info, function (err, res) {
			next(err, res.rows);
		});
	}
}

aggregator();

function aggregator () {
	const getFunctionGroupInfo = [
		setupSqlCommand(app.locals.sql.funcGroup.info),
		setupSqlCommand(app.locals.sql.funcGroup.hmiLevels),
		setupSqlCommand(app.locals.sql.funcGroup.parameters)
	];

	const funcGroupGetFlow = app.locals.flow(getFunctionGroupInfo, {method: 'parallel'});
	const funcGroupMakeFlow = app.locals.flow([funcGroupGetFlow, constructFunctionGroupObj(true)], {method: 'waterfall', pass: 'one'});

	funcGroupMakeFlow(function (err, res) {
		console.log(res);
	});
}

//set the environment up first, then execute the returned function later
function constructFunctionGroupObj (isProduction) {
	return function (groupDataArray, next) {
		const info = groupDataArray[0];
		const hmiLevels = groupDataArray[1];
		const parameters = groupDataArray[2];

		//transform the arrays into hashes with lookups by id for fast referencing
		function transHmiLevels (element) {
			return [
				element['function_group_id'],
				element['permission_name'],
				'hmi_levels',
				element['hmi_level']
			];
		}
		function transParameters (element) {
			return [
				element['function_group_id'],
				element['rpc_name'],
				'parameters',
				element['parameter']
			];
		}
		let finalHash = hashify({}, hmiLevels, transHmiLevels);
		finalHash = hashify(finalHash, parameters, transParameters);

		next(null, JSON.stringify(finalHash, null, 4));
	}
}

//given an existing hash, an array of homogenous objects and a function that transforms those objects in
//an array of ordered properties, convert all the objects into one nested accumulated hash in
//order to change how the data is constructed
function hashify (hash, array, transformFunc) {
	for (let i = 0; i < array.length; i++) {
		//get the order of values to nest into each other
		const order = transformFunc(array[i]);
		let nestedHash = hash; //the current nested level of the hash
		for (let j = 0; j < order.length; j++) {
			if (!nestedHash[order[j]]) {
				if (j < order.length - 1) {
					nestedHash[order[j]] = {};
				}
				else {
					nestedHash[order[j]] = null;
				}
			}
			nestedHash = nestedHash[order[j]];
		}
	}
	return hash;
}

function setupSqlCommand (sqlString) {
	return function (next) {
		app.locals.db.sqlCommand(sqlString, function (err, res) {
			next(err, res.rows);
		});		
	}
}