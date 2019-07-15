/*
 https://github.com/smartdevicelink/sdl_evolution/blob/master/proposals/0225-update-published-app-services.md
 Add new RPC call.

 <enum name="FunctionID" internal_scope="base" since="1.0">
    ...

    <element name="UnpublishAppServiceID" value="XX" hexvalue="XX" since="X.X" />
</enum>

<function name="UnpublishAppService" functionID="UnpublishAppServiceID" messagetype="request" since="X.X">
    <description> Unpublish an existing service published by this application. </description>

    <param name="serviceID" type="String" mandatory="true">
        <description> The ID of the service to be unpublished. </description>
    </param>
</function>

<function name="UnpublishAppService" functionID="UnpublishAppServiceID" messagetype="response" since="X.X">
    <description> The response to UnpublishAppService </description>
    <param name="success" type="Boolean" platform="documentation" mandatory="true">
        <description> true, if successful; false, if failed </description>
    </param>

    <param name="resultCode" type="Result" platform="documentation" mandatory="true">
        <description>See Result</description>
        <element name="SUCCESS"/>
        <element name="REJECTED"/>
        <element name="DISALLOWED"/>
        <element name="INVALID_DATA"/>
        <element name="INVALID_ID"/>
        <element name="OUT_OF_MEMORY"/>
        <element name="TOO_MANY_PENDING_REQUESTS"/>
        <element name="APPLICATION_NOT_REGISTERED"/>
        <element name="GENERIC_ERROR"/>
    </param>

    <param name="info" type="String" maxlength="1000" mandatory="false" platform="documentation">
        <description>Provides additional human readable info regarding the result.</description>
    </param>
</function>
 */


--  If redis caching is enabled this will break until the cache is cleared.


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



INSERT INTO permissions(name,type,function_id,display_name)
VALUES ('UnpublishAppService','RPC',56,'Unpublish App Service')
ON CONFLICT
    DO NOTHING;
