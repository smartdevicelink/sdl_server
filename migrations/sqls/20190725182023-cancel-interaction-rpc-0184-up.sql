/*  db-migrate create cancel-interaction-rpc-0184 -e pg-staging */

--https://github.com/smartdevicelink/sdl_evolution/blob/master/proposals/0184-cancel-interaction.md


--The defaults are based on https://github.com/smartdevicelink/sdl_core/blob/develop/src/appMain/sdl_preloaded_pt.json
--https://github.com/smartdevicelink/sdl_core/pull/2963/files

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CancelInteraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';


INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CancelInteraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CancelInteraction' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';
