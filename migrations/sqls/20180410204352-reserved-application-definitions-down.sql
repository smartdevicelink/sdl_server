DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;

ALTER TABLE function_group_info
DROP COLUMN IF EXISTS "is_pre_data_consent",
DROP COLUMN IF EXISTS "is_device";

ALTER TABLE module_config
ADD COLUMN IF NOT EXISTS "endpoint_0x07" TEXT;

CREATE OR REPLACE VIEW view_function_group_info AS
SELECT function_group_info.*
FROM (
SELECT property_name, status, max(id) AS id
    FROM function_group_info
    GROUP BY property_name, status
) AS vfgi
INNER JOIN function_group_info ON vfgi.id = function_group_info.id;

CREATE OR REPLACE VIEW view_module_config AS
SELECT module_config.*
FROM (
SELECT status, max(id) AS id
    FROM module_config
    GROUP BY status
) AS vmc
INNER JOIN module_config ON vmc.id = module_config.id;

CREATE OR REPLACE VIEW view_module_config_staging AS
SELECT module_config.*
FROM (
    SELECT max(id) AS id
    FROM module_config
) mc
INNER JOIN module_config
ON module_config.id = mc.id;

CREATE OR REPLACE VIEW view_module_config_production AS
SELECT module_config.*
FROM (
    SELECT max(id) AS id
    FROM module_config
    WHERE status='PRODUCTION'
) mc
INNER JOIN module_config
ON module_config.id = mc.id;

CREATE OR REPLACE VIEW view_mapped_permissions AS
SELECT function_group_id AS id, permission_name AS name, status, property_name
FROM view_function_group_info
INNER JOIN function_group_hmi_levels
ON view_function_group_info.id = function_group_hmi_levels.function_group_id
UNION
SELECT function_group_id AS id, parameter AS name, status, property_name
FROM view_function_group_info
INNER JOIN function_group_parameters
ON view_function_group_info.id = function_group_parameters.function_group_id;

CREATE OR REPLACE VIEW view_mapped_permissions_staging AS
SELECT mapped.*
FROM (
    SELECT function_group_id AS id, permission_name AS name, status, property_name
    FROM view_function_group_info
    INNER JOIN function_group_hmi_levels
    ON view_function_group_info.id = function_group_hmi_levels.function_group_id
    UNION
    SELECT function_group_id AS id, parameter AS name, status, property_name
    FROM view_function_group_info
    INNER JOIN function_group_parameters
    ON view_function_group_info.id = function_group_parameters.function_group_id
) mapped
INNER JOIN (
    SELECT max(id) AS id, property_name
    FROM view_function_group_info
    GROUP BY property_name
) fgi
ON mapped.id = fgi.id;

CREATE OR REPLACE VIEW view_mapped_permissions_production AS
SELECT function_group_id AS id, permission_name AS name, status, property_name
FROM view_function_group_info
INNER JOIN function_group_hmi_levels
ON view_function_group_info.id = function_group_hmi_levels.function_group_id
UNION
SELECT function_group_id AS id, parameter AS name, status, property_name
FROM view_function_group_info
INNER JOIN function_group_parameters
ON view_function_group_info.id = function_group_parameters.function_group_id
WHERE status = 'PRODUCTION';