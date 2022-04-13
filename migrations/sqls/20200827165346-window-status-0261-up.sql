-- DROP AFFECTED VIEWS --
DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;
-- END DROP OF VIEWS --

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'windowStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_parameters
        WHERE property_name = 'VehicleInfo-3'
            AND parameter = 'windowStatus'
            AND rpc_name = 'GetVehicleData'
    );

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'windowStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_parameters
        WHERE property_name = 'VehicleInfo-3'
            AND parameter = 'windowStatus'
            AND rpc_name = 'OnVehicleData'
    );

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'windowStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_parameters
        WHERE property_name = 'VehicleInfo-3'
            AND parameter = 'windowStatus'
            AND rpc_name = 'SubscribeVehicleData'
    );

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'windowStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_parameters
        WHERE property_name = 'VehicleInfo-3'
            AND parameter = 'windowStatus'
            AND rpc_name = 'UnsubscribeVehicleData'
    );

-- RECREATE AFFECTED VIEWS --
CREATE OR REPLACE VIEW view_function_group_info AS
SELECT function_group_info.*
FROM (
SELECT property_name, status, max(id) AS id
    FROM function_group_info
    GROUP BY property_name, status
) AS vfgi
INNER JOIN function_group_info ON vfgi.id = function_group_info.id;

CREATE OR REPLACE VIEW view_mapped_permissions AS
SELECT function_group_id AS id, permission_name AS name, status, property_name, is_deleted
FROM view_function_group_info
INNER JOIN function_group_hmi_levels
ON view_function_group_info.id = function_group_hmi_levels.function_group_id
WHERE is_deleted=false
UNION
SELECT function_group_id AS id, parameter AS name, status, property_name, is_deleted
FROM view_function_group_info
INNER JOIN function_group_parameters
ON view_function_group_info.id = function_group_parameters.function_group_id
WHERE is_deleted=false;

CREATE OR REPLACE VIEW view_mapped_permissions_staging AS
SELECT view_mapped_permissions.*
FROM view_mapped_permissions
INNER JOIN (
    SELECT max(id) AS id, property_name
    FROM view_function_group_info
    GROUP BY property_name
) fgi
ON view_mapped_permissions.id = fgi.id;

CREATE OR REPLACE VIEW view_mapped_permissions_production AS
SELECT view_mapped_permissions.* FROM view_mapped_permissions
WHERE status = 'PRODUCTION';
-- END VIEW RECREATION --