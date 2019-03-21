-- APP SERVICES DOWN MIGRATION --
DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;

ALTER TABLE public.permissions
DROP COLUMN IF EXISTS function_id,
DROP COLUMN IF EXISTS display_name;

ALTER TABLE function_group_info
DROP COLUMN IF EXISTS "is_app_provider_group";

DROP TABLE IF EXISTS public.app_service_type_permissions;
DROP TABLE IF EXISTS public.app_service_type_names;
DROP TABLE IF EXISTS public.app_service_types;
DROP TABLE IF EXISTS public.service_type_permissions;
DROP TABLE IF EXISTS public.service_types;

CREATE OR REPLACE VIEW view_function_group_info AS
SELECT function_group_info.*
FROM (
SELECT property_name, status, max(id) AS id
    FROM function_group_info
    GROUP BY property_name, status
) AS vfgi
INNER JOIN function_group_info ON vfgi.id = function_group_info.id;

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
