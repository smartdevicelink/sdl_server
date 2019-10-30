--Create a new RPC and add this to the default provider group AppServiceProviderGroup.

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnpublishAppService' AS permission_name, v.hmi_level::hmi_level AS hmi_level
FROM function_group_info
CROSS JOIN (
    VALUES ('FULL'), ('LIMITED'), ('BACKGROUND'), ('NONE')
) AS v(hmi_level)
WHERE property_name = 'AppServiceProviderGroup'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'AppServiceProviderGroup'
            AND permission_name = 'UnpublishAppService'
    );
