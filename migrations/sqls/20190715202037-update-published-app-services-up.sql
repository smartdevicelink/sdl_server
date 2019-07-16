--Create a new RPC and add this to the default provider group AppServiceProviderGroup.


INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnpublishAppService' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup'
AND NOT EXISTS(SELECT 1 FROM function_group_hmi_levels where permission_name='UnpublishAppService' and hmi_level='BACKGROUND');

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnpublishAppService' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup'
  AND NOT EXISTS(SELECT 1 FROM function_group_hmi_levels where permission_name='UnpublishAppService' and hmi_level='FULL');

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnpublishAppService' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup'
  AND NOT EXISTS(SELECT 1 FROM function_group_hmi_levels where permission_name='UnpublishAppService' and hmi_level='LIMITED');

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnpublishAppService' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup'
  AND NOT EXISTS(SELECT 1 FROM function_group_hmi_levels where permission_name='UnpublishAppService' and hmi_level='NONE')
;



--At the time of creating this 5.2 is the next release for the rpc_spec and 56 is the next available function_id.
-- https://github.com/russjohnson09/rpc_spec/blob/version/5_2_0/MOBILE_API.xml#L2647
INSERT INTO permissions(name,type,function_id,display_name)
VALUES ('UnpublishAppService','RPC',56,'Unpublish App Service')
ON CONFLICT
    DO NOTHING;
