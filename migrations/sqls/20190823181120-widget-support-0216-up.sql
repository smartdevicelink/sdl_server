/* db-migrate create widget-support-0216 -e pg-staging */


INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'WidgetSupport' AS property_name, null AS user_consent_prompt, false AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
        SELECT * FROM function_group_info fgi
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
