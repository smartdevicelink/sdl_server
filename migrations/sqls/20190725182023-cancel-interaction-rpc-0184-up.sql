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


-- Check that the 6.0.0 version has the new rpc before approving to merge into develop.
-- https://github.com/smartdevicelink/rpc_spec/blob/version/6_0_0/MOBILE_API.xml#L2654
-- https://github.com/smartdevicelink/rpc_spec/pull/178/files
-- https://github.com/smartdevicelink/sdl_core/pull/2963/files#diff-cfd2a12866985b9fdcfdbc6ee134baf1R2655
INSERT INTO permissions(name,type,function_id,display_name)
VALUES ('CancelInteraction','RPC',57,'Cancel Interaction');
