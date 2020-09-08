-- DROP AFFECTED VIEWS --
DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;
-- END DROP OF VIEWS --

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubtleAlert' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'Base-4'
            AND permission_name = 'SubtleAlert'
            AND hmi_level = 'FULL'
    );

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubtleAlert' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'Base-4'
            AND permission_name = 'SubtleAlert'
            AND hmi_level = 'LIMITED'
    );

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubtleAlert' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'Base-4'
            AND permission_name = 'SubtleAlert'
            AND hmi_level = 'BACKGROUND'
    );

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSubtleAlertPressed' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'Base-4'
            AND permission_name = 'OnSubtleAlertPressed'
            AND hmi_level = 'FULL'
    );

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSubtleAlertPressed' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'Base-4'
            AND permission_name = 'OnSubtleAlertPressed'
            AND hmi_level = 'LIMITED'
    );


INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSubtleAlertPressed' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'Base-4'
            AND permission_name = 'OnSubtleAlertPressed'
            AND hmi_level = 'BACKGROUND'
    );

ALTER TABLE module_config
    ADD COLUMN IF NOT EXISTS projection_notifications INT NOT NULL DEFAULT 15,
    ADD COLUMN IF NOT EXISTS subtle_emergency_notifications INT NOT NULL DEFAULT 60,
    ADD COLUMN IF NOT EXISTS subtle_navigation_notifications INT NOT NULL DEFAULT 20,
    ADD COLUMN IF NOT EXISTS subtle_projection_notifications INT NOT NULL DEFAULT 20,
    ADD COLUMN IF NOT EXISTS subtle_voicecom_notifications INT NOT NULL DEFAULT 30,
    ADD COLUMN IF NOT EXISTS subtle_communication_notifications INT NOT NULL DEFAULT 15,
    ADD COLUMN IF NOT EXISTS subtle_normal_notifications INT NOT NULL DEFAULT 10,
    ADD COLUMN IF NOT EXISTS subtle_none_notifications INT NOT NULL DEFAULT 0;

-- RECREATE AFFECTED VIEWS --
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