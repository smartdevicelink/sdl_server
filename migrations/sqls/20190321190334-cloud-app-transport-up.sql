-- DROP AFFECTED VIEWS --
DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;
-- END DROP OF VIEWS --


ALTER TABLE function_group_info
ADD COLUMN IF NOT EXISTS "is_administrator_group" BOOLEAN NOT NULL DEFAULT false;


ALTER TABLE app_info
ADD COLUMN IF NOT EXISTS cloud_endpoint TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ca_certificate TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cloud_transport_type TEXT DEFAULT NULL,
ALTER COLUMN platform TYPE TEXT,
ALTER COLUMN platform SET NOT NULL;


CREATE TABLE IF NOT EXISTS app_hybrid_preference (
    "app_uuid" VARCHAR(36) NOT NULL,
    "hybrid_preference" VARCHAR(12) NOT NULL,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (app_uuid)
)
WITH ( OIDS = FALSE );


-- this new table can replace auto-approval, blacklist, and handle administrative flag
CREATE TABLE IF NOT EXISTS app_oem_enablements (
    "app_uuid" VARCHAR(36) NOT NULL,
    "key" VARCHAR(36) NOT NULL,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (app_uuid, key)
)
WITH ( OIDS = FALSE );

INSERT INTO app_oem_enablements (app_uuid, key, created_ts)
SELECT app_uuid, 'auto_approve' AS key, created_ts
FROM app_auto_approval;

INSERT INTO app_oem_enablements (app_uuid, key, created_ts)
SELECT app_uuid, 'blacklist' AS key, created_ts
FROM app_blacklist;

DROP TABLE IF EXISTS app_auto_approval;
DROP TABLE IF EXISTS app_blacklist;
-- end new app_oem_enablements table migration




INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, is_app_provider_group, is_administrator_group, status)
SELECT 'AdministratorGroup' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'false' AS is_app_provider_group, 'true' AS is_administrator_group, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'AdministratorGroup'
);


-- CREATE AN ADMINISTRATIVE FUNCTIONAL GROUP FOR OEMS TO GRANT TO INTERNAL APPS --
INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetCloudAppProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AdministratorGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetCloudAppProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AdministratorGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AdministratorGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AdministratorGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AdministratorGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AdministratorGroup';



INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'cloudAppVehicleID' AS parameter
FROM function_group_info
WHERE property_name = 'AdministratorGroup';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'cloudAppVehicleID' AS parameter
FROM function_group_info
WHERE property_name = 'AdministratorGroup';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'cloudAppVehicleID' AS parameter
FROM function_group_info
WHERE property_name = 'AdministratorGroup';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'cloudAppVehicleID' AS parameter
FROM function_group_info
WHERE property_name = 'AdministratorGroup';
-- END ADMINISTRATIVE FUNCTIONAL GROUP --



-- BEGIN ASSOCIATION OF NEW PARAMS TO EXISTING DEFAULT FUNCTIONAL GROUPS --
INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'cloudAppVehicleID' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'cloudAppVehicleID' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'cloudAppVehicleID' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'cloudAppVehicleID' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';
-- END ASSOCIATION OF NEW PARAMS --





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