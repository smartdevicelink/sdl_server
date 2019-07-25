/* db-migrate create show-app-menu-0116 -e pg-staging */


--https://github.com/smartdevicelink/sdl_core/blob/feature/open_menu_rpc/src/appMain/sdl_preloaded_pt.json#L51
--Only allows full by default here. It is a menu related command so that makes sense.
--Both Base-4 and Base-6 have this RPC. CloseApplication only included this in Base-4
INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowAppMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4'
  AND NOT EXISTS(SELECT 1 FROM function_group_hmi_levels where permission_name='ShowAppMenu' and hmi_level='FULL');


-- Check that the 6.0.0 version has the new rpc before approving to merge into develop.
-- https://github.com/smartdevicelink/rpc_spec/blob/version/6_0_0/MOBILE_API.xml#L2654
-- https://github.com/smartdevicelink/rpc_spec/pull/184/files
INSERT INTO permissions(name,type,function_id,display_name)
VALUES ('ShowAppMenu','RPC',59,'Show App Menu');
