/* db-migrate create show-app-menu-0116 -e pg-staging */


--The defaults are based on https://github.com/smartdevicelink/sdl_core/blob/develop/src/appMain/sdl_preloaded_pt.json
--https://github.com/smartdevicelink/sdl_core/blob/feature/open_menu_rpc/src/appMain/sdl_preloaded_pt.json#L51
--Only allows full by default here. It is a menu related command so that makes sense.
INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowAppMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
  AND NOT EXISTS(SELECT 1 FROM function_group_hmi_levels where permission_name='ShowAppMenu' and hmi_level='FULL');


INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowAppMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6'
  AND NOT EXISTS(SELECT 1 FROM function_group_hmi_levels where permission_name='ShowAppMenu' and hmi_level='FULL');
