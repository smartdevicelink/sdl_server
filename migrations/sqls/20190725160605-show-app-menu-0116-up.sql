/* db-migrate create show-app-menu-0116 -e pg-staging */

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowAppMenu' AS permission_name, 'FULL'::hmi_level AS hmi_level
FROM function_group_info
WHERE property_name IN ('Base-4', 'Base-6')
    AND NOT EXISTS(
        SELECT 1
            FROM function_group_hmi_levels
            WHERE permission_name = 'ShowAppMenu'
            AND hmi_level = 'FULL'
    );
