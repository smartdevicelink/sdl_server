-- DROP AFFECTED VIEWS --
DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;
-- END DROP OF VIEWS --

ALTER TABLE function_group_info
DROP COLUMN IF EXISTS "is_administrator_group";

ALTER TABLE app_info
DROP COLUMN IF EXISTS cloud_endpoint,
DROP COLUMN IF EXISTS ca_certificate,
DROP COLUMN IF EXISTS cloud_transport_type;


CREATE TABLE app_auto_approval (
    "app_uuid" VARCHAR(36),
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (app_uuid)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_blacklist (
    "app_uuid" VARCHAR(36),
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (app_uuid)
)
WITH ( OIDS = FALSE );

INSERT INTO app_auto_approval (app_uuid, created_ts)
SELECT app_uuid, created_ts
FROM app_oem_enablements
WHERE key = 'auto_approve';

INSERT INTO app_blacklist (app_uuid, created_ts)
SELECT app_uuid, created_ts
FROM app_oem_enablements
WHERE key = 'blacklist';

DROP TABLE IF EXISTS app_oem_enablements;
DROP TABLE IF EXISTS app_hybrid_preference;

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