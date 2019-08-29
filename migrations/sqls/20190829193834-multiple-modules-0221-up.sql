/* db-migrate create show-app-menu-0116 -e pg-staging */

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReleaseInteriorVehicleDataModule' AS permission_name, v.hmi_level::hmi_level AS hmi_level
FROM function_group_info
CROSS JOIN (
    VALUES ('FULL'), ('LIMITED'), ('BACKGROUND'), ('NONE')
) AS v(hmi_level)
WHERE property_name = 'RemoteControl'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'RemoteControl'
            AND permission_name = 'ReleaseInteriorVehicleDataModule'
    );

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetInteriorVehicleDataConsent' AS permission_name, v.hmi_level::hmi_level AS hmi_level
FROM function_group_info
CROSS JOIN (
    VALUES ('FULL'), ('LIMITED'), ('BACKGROUND'), ('NONE')
) AS v(hmi_level)
WHERE property_name = 'RemoteControl'
    AND NOT EXISTS(
        SELECT 1
        FROM function_group_hmi_levels
        WHERE property_name = 'RemoteControl'
            AND permission_name = 'GetInteriorVehicleDataConsent'
    );
