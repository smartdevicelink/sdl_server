//Generates the SQL commands necessary to insert this data into the database. For dev use only.
const path = require('path');
const utils = require('../utils.js');
const permissions = require('./permissions.js');
const functionGroupInfo = require('./functionGroupInfo.js');
const policy = require(path.resolve('../policy.json'));
const sql = require('sql-bricks'); //generates SQL statements to be logged to the console
const funcGroups = policy.policy_table.functional_groupings; //functional groupings object
let outputBuffer = ""; //what will get written to file
const outputFileName = 'output.log'; //the name of the output file

//I'm sorry

//PERMISSION DEFINITION OUTPUT
//DO NOT USE. PERMISSION DEFINITIONS NOW RECEIVED THROUGH SHAID
/*
const permissionStatement = permissions.permissionNames.map(function (permission) {
	return `
INSERT INTO permissions (name, type)
SELECT '${permission.name}' AS name, '${permission.type}' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = '${permission.name}'
);
`;
});
//const permissionStatement = sql.insert('permissions').values(permissionObjs).toString();
//writeToBuffer(utils.formatInsertOutput(permissionStatement));
writeToBuffer(permissionStatement.join(''));
*/
//FUNCTION GROUP INFO OUTPUT
const funcGroupNames = Object.keys(funcGroups);
const funcGroupInfoStatement = funcGroupNames.map(function (funcGroupName) {
	const funcGroupObj = funcGroups[funcGroupName];
	const alwaysAllowed = functionGroupInfo.alwaysAllowedObj[funcGroupName];
	if (funcGroupObj.user_consent_prompt === undefined) {
		funcGroupObj.user_consent_prompt = null;
	}
	else { //manually add quotes around the string
		funcGroupObj.user_consent_prompt = "'" + funcGroupObj.user_consent_prompt + "'";
	}
	return `
INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT '${funcGroupName}' AS property_name, ${funcGroupObj.user_consent_prompt} AS user_consent_prompt, '${alwaysAllowed}' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = '${funcGroupName}'
);
`;
});
//const funcGroupInfoStatement = sql.insert('function_group_info').values(funcGroupObjs).toString();
//writeToBuffer(utils.formatInsertOutput(funcGroupInfoStatement));
writeToBuffer(funcGroupInfoStatement.join(''));

//PERMISSION RELATIONS OUTPUT
//DO NOT USE. PERMISSION RELATIONS NOW RECEIVED THROUGH SHAID
/*
const relationStatement = permissions.permissionRelations.map(function (permRelation) {

	return `
INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT '${permRelation.child_permission_name}' AS child_permission_name, '${permRelation.parent_permission_name}' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = '${permRelation.child_permission_name}'
    AND pr.parent_permission_name = '${permRelation.parent_permission_name}'
);
`;
});
//const relationStatement = sql.insert('permission_relations').values(relationObjs).toString();
//writeToBuffer(utils.formatInsertOutput(relationStatement));
writeToBuffer(relationStatement.join(''));
*/

//FUNCTION GROUP PERMISSIONS OUTPUT
//Get the permission IDs via join statements
let funcGroupPermissions = [];
let functionGroupHmiLevels = [];
let functionGroupParameters = [];

for (let i = 0; i < funcGroupNames.length; i++) {
	const funcGroupObj = funcGroups[funcGroupNames[i]];
	const rpcObjs = funcGroupObj.rpcs;
	let vehicleParameterPermissions = {};

	for (let rpcName in rpcObjs) {
		const hmiLevels = rpcObjs[rpcName].hmi_levels;
		const parameters = rpcObjs[rpcName].parameters;
		funcGroupPermissions.push({
			groupName: funcGroupNames[i],
			permissionName: rpcName
		});
		addHmiLevels(functionGroupHmiLevels, funcGroupNames[i], rpcName, hmiLevels);
		if (parameters && parameters.length) {
			const addParameterPermissions = setupContext(funcGroupNames[i], rpcName);
			addParameterPermissions(vehicleParameterPermissions, parameters);
		}
	}	
	for (let permissionName in vehicleParameterPermissions) {
		funcGroupPermissions.push({
			groupName: funcGroupNames[i],
			permissionName: permissionName
		});
	}
}
/*
const funcGroupPermissionStatement = funcGroupPermissions.map(function (obj) {
	return `
INSERT INTO function_group_permissions(function_group_id, permission_name)
SELECT fgi.id AS function_group_id, ${obj.permissionName} AS permission_name
FROM function_group_info fgi
WHERE fgi.property_name = '${obj.groupName}'
AND NOT EXISTS(
    SELECT fgp.*
    FROM function_group_permissions fgp
    INNER JOIN function_group_info fgi2 ON fgi2.id = fgp.function_group_id
    WHERE fgp.permission_name = ${obj.permissionName}
    AND fgi2.property_name = '${obj.groupName}'
)
ORDER BY id ASC
LIMIT 1;
`;
});
writeToBuffer(funcGroupPermissionStatement.join(''));
*/
//FUNCTION GROUP HMI LEVELS OUTPUT
const functionGroupHmiLevelStatement = functionGroupHmiLevels.map(function (obj) {
	return `
INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, '${obj.permissionName}' AS permission_name, '${obj.hmiLevel}' AS hmi_level
FROM function_group_info
WHERE property_name = '${obj.groupName}';
`;
});
writeToBuffer(functionGroupHmiLevelStatement.join(''));

//FUNCTION GROUP PARAMETERS OUTPUT
const functionGroupParameterStatement = functionGroupParameters.map(function (obj) {
	return `
INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, '${obj.rpcName}' AS rpc_name, '${obj.parameter}' AS parameter
FROM function_group_info
WHERE property_name = '${obj.groupName}';
`;
});
writeToBuffer(functionGroupParameterStatement.join(''));

//returns a function that allows parameter permissions and function group parameters to be added
//functionGroupName and rpcName is necessary for function group parameters
function setupContext (functionGroupName, rpcName) {
	return function (vehicleParameterPermissions, parameters) {
		for (let i = 0; i < parameters.length; i++) {
			vehicleParameterPermissions[parameters[i]] = null;
			functionGroupParameters.push({
				groupName: functionGroupName,
				rpcName: rpcName,
				parameter: parameters[i]
			});
		}
	}
}

function addHmiLevels (functionGroupHmiLevels, groupName, permName, hmiLevels) {
	for (let i = 0; i < hmiLevels.length; i++) {
		functionGroupHmiLevels.push({
			groupName: groupName,
			permissionName: permName,
			hmiLevel: hmiLevels[i]
		});
	}
}

//write to file and finish
utils.writeToFile(outputFileName, outputBuffer);

function writeToBuffer (string) {
    outputBuffer += string;   
}
