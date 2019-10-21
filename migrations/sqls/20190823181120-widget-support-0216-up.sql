/* db-migrate create widget-support-0216 -e pg-staging */

-- DROP AFFECTED VIEWS --
DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;
-- END DROP OF VIEWS --

ALTER TABLE app_info ADD COLUMN can_manage_widgets BOOLEAN DEFAULT FALSE;

ALTER TABLE function_group_info ADD COLUMN is_widget_group BOOLEAN DEFAULT FALSE;

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status, is_widget_group)
SELECT 'WidgetSupport' AS property_name,
       null            AS user_consent_prompt,
       false           AS is_default,
       'PRODUCTION'    AS status,
       true            AS is_widget_group
WHERE NOT EXISTS(
    SELECT *
    FROM function_group_info fgi
    WHERE fgi.property_name = 'WidgetSupport'
);

--New group added to support widgets
--https://github.com/smartdevicelink/sdl_core/pull/2980/files#diff-18582417488787e29b47f6f90dc3c468R1205
INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateWindow' AS permission_name, v.hmi_level::hmi_level AS hmi_level
FROM function_group_info
CROSS JOIN (
    VALUES ('FULL'), ('LIMITED'), ('BACKGROUND')
) AS v(hmi_level)
WHERE property_name = 'WidgetSupport'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'WidgetSupport'
            AND permission_name = 'CreateWindow'
    );

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteWindow' AS permission_name, v.hmi_level::hmi_level AS hmi_level
FROM function_group_info
CROSS JOIN (
    VALUES ('FULL'), ('LIMITED'), ('BACKGROUND')
) AS v(hmi_level)
WHERE property_name = 'WidgetSupport'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'WidgetSupport'
            AND permission_name = 'DeleteWindow'
    );

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, v.hmi_level::hmi_level AS hmi_level
FROM function_group_info
CROSS JOIN (
    VALUES ('FULL'), ('LIMITED'), ('BACKGROUND')
) AS v(hmi_level)
WHERE property_name = 'WidgetSupport'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'WidgetSupport'
            AND permission_name = 'Show'
    );

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, v.hmi_level::hmi_level AS hmi_level
FROM function_group_info
CROSS JOIN (
    VALUES ('FULL'), ('LIMITED'), ('BACKGROUND'), ('NONE')
) AS v(hmi_level)
WHERE property_name = 'WidgetSupport'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'WidgetSupport'
            AND permission_name = 'OnSystemCapabilityUpdated'
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
