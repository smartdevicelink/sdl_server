/*  db-migrate create cancel-interaction-rpc-0184 -e pg-staging */

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
(SELECT id AS function_group_id, 'CancelInteraction' AS permission_name, 'FULL'::hmi_level AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
AND NOT EXISTS(SELECT 1 from function_group_hmi_levels where property_name = 'Base-4' AND permission_name = 'CancelInteraction'))
UNION
(SELECT id AS function_group_id, 'CancelInteraction' AS permission_name, 'LIMITED'::hmi_level AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
AND NOT EXISTS(SELECT 1 from function_group_hmi_levels where property_name = 'Base-4' AND permission_name = 'CancelInteraction'))
UNION
(SELECT id AS function_group_id, 'CancelInteraction' AS permission_name, 'BACKGROUND'::hmi_level AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
AND NOT EXISTS(SELECT 1 from function_group_hmi_levels where property_name = 'Base-4' AND permission_name = 'CancelInteraction'))
;
