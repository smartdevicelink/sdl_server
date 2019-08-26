/*  db-migrate create cancel-interaction-rpc-0184 -e pg-staging */

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CancelInteraction' AS permission_name, v.hmi_level::hmi_level AS hmi_level
FROM function_group_info
CROSS JOIN (
    VALUES ('FULL'), ('LIMITED'), ('BACKGROUND')
) AS v(hmi_level)
WHERE property_name = 'Base-4'
    AND NOT EXISTS(
    SELECT 1
    FROM function_group_hmi_levels
        WHERE property_name = 'Base-4'
            AND permission_name = 'CancelInteraction'
    );
