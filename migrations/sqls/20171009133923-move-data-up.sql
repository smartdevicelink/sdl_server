CREATE TABLE function_group_hmi_levels (
    "function_group_id" INTEGER NOT NULL REFERENCES function_group_info(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "permission_name" VARCHAR(64) NOT NULL REFERENCES permissions(name) ON UPDATE CASCADE ON DELETE CASCADE,
    "hmi_level" hmi_level NOT NULL,
    PRIMARY KEY (function_group_id, permission_name, hmi_level)
)
WITH ( OIDS = FALSE );

CREATE TABLE function_group_parameters (
    "function_group_id" INTEGER NOT NULL REFERENCES function_group_info(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "rpc_name" VARCHAR(64) NOT NULL REFERENCES permissions(name) ON UPDATE CASCADE ON DELETE CASCADE,
    "parameter" VARCHAR(64) NOT NULL REFERENCES permissions(name) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (function_group_id, rpc_name, parameter)
)
WITH ( OIDS = FALSE );

CREATE TABLE user_accounts (
    "id" SERIAL NOT NULL,
    "invited_by_id" INT REFERENCES user_accounts (id) ON UPDATE CASCADE,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "password" TEXT NOT NULL,
    "salt" TEXT,
    "updated_password_ts" TIMESTAMP WITHOUT TIME ZONE,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE forgot_password_hash (
    "nonce_uuid" VARCHAR(36) NOT NULL,
    "user_id" INT NOT NULL REFERENCES user_accounts (id),
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (nonce_uuid)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_auto_approval (
    "app_uuid" VARCHAR(36),
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (app_uuid)
)
WITH ( OIDS = FALSE );

ALTER TABLE app_permissions
ADD "hmi_level" hmi_level;

ALTER TABLE function_group_info
ADD "deleted_ts" TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE app_info
ADD "denial_message" TEXT,
ADD "icon_url" TEXT;

DROP TABLE IF EXISTS function_group_permissions;

UPDATE message_text
SET status = 'PRODUCTION'
WHERE status = 'STAGING';

UPDATE module_config
SET status = 'PRODUCTION'
WHERE status = 'STAGING';

CREATE OR REPLACE VIEW view_module_config AS
SELECT module_config.* 
FROM (
SELECT status, max(id) AS id
    FROM module_config
    GROUP BY status
) AS vmc
INNER JOIN module_config ON vmc.id = module_config.id;


CREATE OR REPLACE VIEW view_message_text AS
SELECT message_text.* 
FROM (
SELECT message_category, language_id, status, max(id) AS id
    FROM message_text
    GROUP BY message_category, language_id, status
) AS vcfm
INNER JOIN message_text ON vcfm.id = message_text.id;


CREATE OR REPLACE VIEW view_function_group_info AS
SELECT function_group_info.* 
FROM (
SELECT property_name, status, max(id) AS id
    FROM function_group_info
    GROUP BY property_name, status
) AS vfgi
INNER JOIN function_group_info ON vfgi.id = function_group_info.id;


INSERT INTO permissions (name, type)
SELECT 'RegisterAppInterface' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'RegisterAppInterface'
);

INSERT INTO permissions (name, type)
SELECT 'UnregisterAppInterface' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'UnregisterAppInterface'
);

INSERT INTO permissions (name, type)
SELECT 'SetGlobalProperties' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SetGlobalProperties'
);

INSERT INTO permissions (name, type)
SELECT 'ResetGlobalProperties' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'ResetGlobalProperties'
);

INSERT INTO permissions (name, type)
SELECT 'AddCommand' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'AddCommand'
);

INSERT INTO permissions (name, type)
SELECT 'DeleteCommand' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'DeleteCommand'
);

INSERT INTO permissions (name, type)
SELECT 'AddSubMenu' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'AddSubMenu'
);

INSERT INTO permissions (name, type)
SELECT 'DeleteSubMenu' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'DeleteSubMenu'
);

INSERT INTO permissions (name, type)
SELECT 'CreateInteractionChoiceSet' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'CreateInteractionChoiceSet'
);

INSERT INTO permissions (name, type)
SELECT 'PerformInteraction' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'PerformInteraction'
);

INSERT INTO permissions (name, type)
SELECT 'DeleteInteractionChoiceSet' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'DeleteInteractionChoiceSet'
);

INSERT INTO permissions (name, type)
SELECT 'Alert' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'Alert'
);

INSERT INTO permissions (name, type)
SELECT 'Show' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'Show'
);

INSERT INTO permissions (name, type)
SELECT 'Speak' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'Speak'
);

INSERT INTO permissions (name, type)
SELECT 'SetMediaClockTimer' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SetMediaClockTimer'
);

INSERT INTO permissions (name, type)
SELECT 'PerformAudioPassThru' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'PerformAudioPassThru'
);

INSERT INTO permissions (name, type)
SELECT 'EndAudioPassThru' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'EndAudioPassThru'
);

INSERT INTO permissions (name, type)
SELECT 'SubscribeButton' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SubscribeButton'
);

INSERT INTO permissions (name, type)
SELECT 'UnsubscribeButton' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'UnsubscribeButton'
);

INSERT INTO permissions (name, type)
SELECT 'SubscribeVehicleData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SubscribeVehicleData'
);

INSERT INTO permissions (name, type)
SELECT 'UnsubscribeVehicleData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'UnsubscribeVehicleData'
);

INSERT INTO permissions (name, type)
SELECT 'GetVehicleData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'GetVehicleData'
);

INSERT INTO permissions (name, type)
SELECT 'ReadDID' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'ReadDID'
);

INSERT INTO permissions (name, type)
SELECT 'GetDTCs' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'GetDTCs'
);

INSERT INTO permissions (name, type)
SELECT 'ButtonPress' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'ButtonPress'
);

INSERT INTO permissions (name, type)
SELECT 'GetInteriorVehicleData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'GetInteriorVehicleData'
);

INSERT INTO permissions (name, type)
SELECT 'SetInteriorVehicleData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SetInteriorVehicleData'
);

INSERT INTO permissions (name, type)
SELECT 'OnInteriorVehicleData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnInteriorVehicleData'
);

INSERT INTO permissions (name, type)
SELECT 'ScrollableMessage' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'ScrollableMessage'
);

INSERT INTO permissions (name, type)
SELECT 'Slider' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'Slider'
);

INSERT INTO permissions (name, type)
SELECT 'ShowConstantTBT' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'ShowConstantTBT'
);

INSERT INTO permissions (name, type)
SELECT 'AlertManeuver' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'AlertManeuver'
);

INSERT INTO permissions (name, type)
SELECT 'UpdateTurnList' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'UpdateTurnList'
);

INSERT INTO permissions (name, type)
SELECT 'ChangeRegistration' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'ChangeRegistration'
);

INSERT INTO permissions (name, type)
SELECT 'GenericResponse' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'GenericResponse'
);

INSERT INTO permissions (name, type)
SELECT 'GetSystemCapability' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'GetSystemCapability'
);

INSERT INTO permissions (name, type)
SELECT 'PutFile' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'PutFile'
);

INSERT INTO permissions (name, type)
SELECT 'DeleteFile' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'DeleteFile'
);

INSERT INTO permissions (name, type)
SELECT 'ListFiles' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'ListFiles'
);

INSERT INTO permissions (name, type)
SELECT 'SetAppIcon' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SetAppIcon'
);

INSERT INTO permissions (name, type)
SELECT 'SetDisplayLayout' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SetDisplayLayout'
);

INSERT INTO permissions (name, type)
SELECT 'DiagnosticMessage' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'DiagnosticMessage'
);

INSERT INTO permissions (name, type)
SELECT 'SystemRequest' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SystemRequest'
);

INSERT INTO permissions (name, type)
SELECT 'SendLocation' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SendLocation'
);

INSERT INTO permissions (name, type)
SELECT 'DialNumber' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'DialNumber'
);

INSERT INTO permissions (name, type)
SELECT 'GetWayPoints' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'GetWayPoints'
);

INSERT INTO permissions (name, type)
SELECT 'SubscribeWayPoints' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SubscribeWayPoints'
);

INSERT INTO permissions (name, type)
SELECT 'UnsubscribeWayPoints' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'UnsubscribeWayPoints'
);

INSERT INTO permissions (name, type)
SELECT 'OnHMIStatus' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnHMIStatus'
);

INSERT INTO permissions (name, type)
SELECT 'OnAppInterfaceUnregistered' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnAppInterfaceUnregistered'
);

INSERT INTO permissions (name, type)
SELECT 'OnButtonEvent' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnButtonEvent'
);

INSERT INTO permissions (name, type)
SELECT 'OnButtonPress' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnButtonPress'
);

INSERT INTO permissions (name, type)
SELECT 'OnVehicleData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnVehicleData'
);

INSERT INTO permissions (name, type)
SELECT 'OnCommand' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnCommand'
);

INSERT INTO permissions (name, type)
SELECT 'OnTBTClientState' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnTBTClientState'
);

INSERT INTO permissions (name, type)
SELECT 'OnDriverDistraction' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnDriverDistraction'
);

INSERT INTO permissions (name, type)
SELECT 'OnPermissionsChange' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnPermissionsChange'
);

INSERT INTO permissions (name, type)
SELECT 'OnAudioPassThru' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnAudioPassThru'
);

INSERT INTO permissions (name, type)
SELECT 'OnLanguageChange' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnLanguageChange'
);

INSERT INTO permissions (name, type)
SELECT 'OnKeyboardInput' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnKeyboardInput'
);

INSERT INTO permissions (name, type)
SELECT 'OnTouchEvent' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnTouchEvent'
);

INSERT INTO permissions (name, type)
SELECT 'SendHapticData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SendHapticData'
);

INSERT INTO permissions (name, type)
SELECT 'OnSystemRequest' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnSystemRequest'
);

INSERT INTO permissions (name, type)
SELECT 'OnHashChange' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnHashChange'
);

INSERT INTO permissions (name, type)
SELECT 'OnWayPointChange' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnWayPointChange'
);

INSERT INTO permissions (name, type)
SELECT 'EncodedSyncPData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'EncodedSyncPData'
);

INSERT INTO permissions (name, type)
SELECT 'SyncPData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'SyncPData'
);

INSERT INTO permissions (name, type)
SELECT 'OnEncodedSyncPData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnEncodedSyncPData'
);

INSERT INTO permissions (name, type)
SELECT 'OnSyncPData' AS name, 'RPC' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'OnSyncPData'
);

INSERT INTO permissions (name, type)
SELECT 'gps' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'gps'
);

INSERT INTO permissions (name, type)
SELECT 'speed' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'speed'
);

INSERT INTO permissions (name, type)
SELECT 'rpm' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'rpm'
);

INSERT INTO permissions (name, type)
SELECT 'fuelLevel' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'fuelLevel'
);

INSERT INTO permissions (name, type)
SELECT 'fuelLevel_State' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'fuelLevel_State'
);

INSERT INTO permissions (name, type)
SELECT 'instantFuelConsumption' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'instantFuelConsumption'
);

INSERT INTO permissions (name, type)
SELECT 'externalTemperature' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'externalTemperature'
);

INSERT INTO permissions (name, type)
SELECT 'prndl' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'prndl'
);

INSERT INTO permissions (name, type)
SELECT 'tirePressure' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'tirePressure'
);

INSERT INTO permissions (name, type)
SELECT 'odometer' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'odometer'
);

INSERT INTO permissions (name, type)
SELECT 'beltStatus' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'beltStatus'
);

INSERT INTO permissions (name, type)
SELECT 'bodyInformation' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'bodyInformation'
);

INSERT INTO permissions (name, type)
SELECT 'deviceStatus' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'deviceStatus'
);

INSERT INTO permissions (name, type)
SELECT 'driverBraking' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'driverBraking'
);

INSERT INTO permissions (name, type)
SELECT 'wiperStatus' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'wiperStatus'
);

INSERT INTO permissions (name, type)
SELECT 'headLampStatus' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'headLampStatus'
);

INSERT INTO permissions (name, type)
SELECT 'engineTorque' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'engineTorque'
);

INSERT INTO permissions (name, type)
SELECT 'accPedalPosition' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'accPedalPosition'
);

INSERT INTO permissions (name, type)
SELECT 'steeringWheelAngle' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'steeringWheelAngle'
);

INSERT INTO permissions (name, type)
SELECT 'eCallInfo' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'eCallInfo'
);

INSERT INTO permissions (name, type)
SELECT 'airbagStatus' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'airbagStatus'
);

INSERT INTO permissions (name, type)
SELECT 'emergencyEvent' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'emergencyEvent'
);

INSERT INTO permissions (name, type)
SELECT 'clusterModeStatus' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'clusterModeStatus'
);

INSERT INTO permissions (name, type)
SELECT 'myKey' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'myKey'
);

INSERT INTO permissions (name, type)
SELECT 'vin' AS name, 'PARAMETER' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'vin'
);

INSERT INTO permissions (name, type)
SELECT 'RADIO' AS name, 'MODULE' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'RADIO'
);

INSERT INTO permissions (name, type)
SELECT 'CLIMATE' AS name, 'MODULE' AS type
WHERE NOT EXISTS (
    SELECT * FROM permissions perm2
    WHERE perm2.name = 'CLIMATE'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Base-4' AS property_name, 'null' AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Base-4'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Location-1' AS property_name, 'Location' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Location-1'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Notifications' AS property_name, 'Notifications' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Notifications'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'DrivingCharacteristics-3' AS property_name, 'DrivingCharacteristics' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'DrivingCharacteristics-3'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'VehicleInfo-3' AS property_name, 'VehicleInfo' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'VehicleInfo-3'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'PropriataryData-1' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'PropriataryData-1'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'PropriataryData-2' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'PropriataryData-2'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'ProprietaryData-3' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'ProprietaryData-3'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'RemoteControl' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'RemoteControl'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Emergency-1' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Emergency-1'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Navigation-1' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Navigation-1'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Base-6' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Base-6'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'OnKeyboardInputOnlyGroup' AS property_name, 'null' AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'OnKeyboardInputOnlyGroup'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'OnTouchEventOnlyGroup' AS property_name, 'null' AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'OnTouchEventOnlyGroup'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'DiagnosticMessageOnly' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'DiagnosticMessageOnly'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'DataConsent-2' AS property_name, 'DataConsent' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'DataConsent-2'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'BaseBeforeDataConsent' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'BaseBeforeDataConsent'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'SendLocation' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'SendLocation'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'WayPoints' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'WayPoints'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'BackgroundAPT' AS property_name, 'null' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'BackgroundAPT'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'DialNumberOnlyGroup' AS property_name, 'null' AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'DialNumberOnlyGroup'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'HapticGroup' AS property_name, 'null' AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'HapticGroup'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'gps' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'gps'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'gps' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'gps'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'gps' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'gps'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'gps' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'gps'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'speed' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'speed'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'speed' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'speed'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'speed' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'speed'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'speed' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'speed'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'rpm' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'rpm'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'rpm' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'rpm'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'rpm' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'rpm'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'rpm' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'rpm'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'fuelLevel' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'fuelLevel'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'fuelLevel' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'fuelLevel'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'fuelLevel' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'fuelLevel'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'fuelLevel' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'fuelLevel'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'fuelLevel_State' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'fuelLevel_State'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'fuelLevel_State' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'fuelLevel_State'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'fuelLevel_State' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'fuelLevel_State'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'fuelLevel_State' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'fuelLevel_State'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'instantFuelConsumption' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'instantFuelConsumption'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'instantFuelConsumption' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'instantFuelConsumption'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'instantFuelConsumption' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'instantFuelConsumption'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'instantFuelConsumption' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'instantFuelConsumption'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'externalTemperature' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'externalTemperature'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'externalTemperature' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'externalTemperature'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'externalTemperature' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'externalTemperature'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'externalTemperature' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'externalTemperature'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'prndl' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'prndl'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'prndl' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'prndl'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'prndl' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'prndl'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'prndl' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'prndl'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'tirePressure' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'tirePressure'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'tirePressure' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'tirePressure'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'tirePressure' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'tirePressure'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'tirePressure' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'tirePressure'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'odometer' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'odometer'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'odometer' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'odometer'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'odometer' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'odometer'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'odometer' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'odometer'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'beltStatus' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'beltStatus'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'beltStatus' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'beltStatus'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'beltStatus' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'beltStatus'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'beltStatus' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'beltStatus'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'bodyInformation' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'bodyInformation'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'bodyInformation' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'bodyInformation'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'bodyInformation' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'bodyInformation'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'bodyInformation' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'bodyInformation'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'deviceStatus' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'deviceStatus'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'deviceStatus' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'deviceStatus'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'deviceStatus' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'deviceStatus'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'deviceStatus' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'deviceStatus'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'driverBraking' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'driverBraking'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'driverBraking' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'driverBraking'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'driverBraking' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'driverBraking'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'driverBraking' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'driverBraking'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'wiperStatus' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'wiperStatus'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'wiperStatus' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'wiperStatus'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'wiperStatus' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'wiperStatus'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'wiperStatus' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'wiperStatus'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'headLampStatus' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'headLampStatus'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'headLampStatus' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'headLampStatus'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'headLampStatus' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'headLampStatus'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'headLampStatus' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'headLampStatus'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'engineTorque' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'engineTorque'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'engineTorque' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'engineTorque'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'engineTorque' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'engineTorque'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'engineTorque' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'engineTorque'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'accPedalPosition' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'accPedalPosition'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'accPedalPosition' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'accPedalPosition'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'accPedalPosition' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'accPedalPosition'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'accPedalPosition' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'accPedalPosition'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'steeringWheelAngle' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'steeringWheelAngle'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'steeringWheelAngle' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'steeringWheelAngle'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'steeringWheelAngle' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'steeringWheelAngle'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'steeringWheelAngle' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'steeringWheelAngle'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'eCallInfo' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'eCallInfo'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'eCallInfo' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'eCallInfo'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'eCallInfo' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'eCallInfo'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'eCallInfo' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'eCallInfo'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'airbagStatus' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'airbagStatus'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'airbagStatus' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'airbagStatus'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'airbagStatus' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'airbagStatus'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'airbagStatus' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'airbagStatus'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'emergencyEvent' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'emergencyEvent'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'emergencyEvent' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'emergencyEvent'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'emergencyEvent' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'emergencyEvent'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'emergencyEvent' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'emergencyEvent'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'clusterModeStatus' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'clusterModeStatus'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'clusterModeStatus' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'clusterModeStatus'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'clusterModeStatus' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'clusterModeStatus'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'clusterModeStatus' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'clusterModeStatus'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'myKey' AS child_permission_name, 'OnVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'myKey'
    AND pr.parent_permission_name = 'OnVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'myKey' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'myKey'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'myKey' AS child_permission_name, 'SubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'myKey'
    AND pr.parent_permission_name = 'SubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'myKey' AS child_permission_name, 'UnsubscribeVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'myKey'
    AND pr.parent_permission_name = 'UnsubscribeVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'vin' AS child_permission_name, 'GetVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'vin'
    AND pr.parent_permission_name = 'GetVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'RADIO' AS child_permission_name, 'ButtonPress' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'RADIO'
    AND pr.parent_permission_name = 'ButtonPress'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'RADIO' AS child_permission_name, 'GetInteriorVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'RADIO'
    AND pr.parent_permission_name = 'GetInteriorVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'RADIO' AS child_permission_name, 'SetInteriorVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'RADIO'
    AND pr.parent_permission_name = 'SetInteriorVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'RADIO' AS child_permission_name, 'OnInteriorVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'RADIO'
    AND pr.parent_permission_name = 'OnInteriorVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'RADIO' AS child_permission_name, 'SystemRequest' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'RADIO'
    AND pr.parent_permission_name = 'SystemRequest'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'CLIMATE' AS child_permission_name, 'ButtonPress' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'CLIMATE'
    AND pr.parent_permission_name = 'ButtonPress'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'CLIMATE' AS child_permission_name, 'GetInteriorVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'CLIMATE'
    AND pr.parent_permission_name = 'GetInteriorVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'CLIMATE' AS child_permission_name, 'SetInteriorVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'CLIMATE'
    AND pr.parent_permission_name = 'SetInteriorVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'CLIMATE' AS child_permission_name, 'OnInteriorVehicleData' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'CLIMATE'
    AND pr.parent_permission_name = 'OnInteriorVehicleData'
);

INSERT INTO permission_relations (child_permission_name, parent_permission_name)
SELECT 'CLIMATE' AS child_permission_name, 'SystemRequest' AS parent_permission_name
WHERE NOT EXISTS (
    SELECT * FROM permission_relations pr
    WHERE pr.child_permission_name = 'CLIMATE'
    AND pr.parent_permission_name = 'SystemRequest'
);

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetSystemCapability' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetSystemCapability' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetSystemCapability' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetSystemCapability' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformInteraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformInteraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ScrollableMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetMediaClockTimer' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetMediaClockTimer' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetMediaClockTimer' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Slider' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Speak' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Speak' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Notifications';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ButtonPress' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ButtonPress' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ButtonPress' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetInteriorVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetInteriorVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetInteriorVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetInteriorVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetInteriorVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetInteriorVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnInteriorVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnInteriorVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnInteriorVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AlertManeuver' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AlertManeuver' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AlertManeuver' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowConstantTBT' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowConstantTBT' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowConstantTBT' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UpdateTurnList' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UpdateTurnList' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UpdateTurnList' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTBTClientState' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTBTClientState' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTBTClientState' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformInteraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformInteraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ScrollableMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetMediaClockTimer' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Slider' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Speak' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Speak' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnKeyboardInput' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'OnKeyboardInputOnlyGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTouchEvent' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'OnTouchEventOnlyGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DiagnosticMessageOnly';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DiagnosticMessageOnly';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DiagnosticMessageOnly';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SendLocation' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'SendLocation';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SendLocation' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'SendLocation';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SendLocation' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'SendLocation';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetWayPoints' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetWayPoints' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetWayPoints' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeWayPoints' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeWayPoints' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeWayPoints' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeWayPoints' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeWayPoints' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeWayPoints' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DialNumber' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DialNumberOnlyGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DialNumber' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DialNumberOnlyGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTouchEvent' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'HapticGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SendHapticData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'HapticGroup';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'gps' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'speed' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'gps' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'speed' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'gps' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'speed' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'gps' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'speed' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'accPedalPosition' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'beltStatus' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'driverBraking' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'myKey' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'prndl' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'rpm' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'steeringWheelAngle' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'accPedalPosition' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'beltStatus' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'driverBraking' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'myKey' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'prndl' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'rpm' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'steeringWheelAngle' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'accPedalPosition' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'beltStatus' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'driverBraking' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'myKey' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'prndl' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'rpm' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'steeringWheelAngle' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'accPedalPosition' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'beltStatus' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'driverBraking' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'myKey' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'prndl' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'rpm' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'steeringWheelAngle' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'bodyInformation' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'deviceStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'engineTorque' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'externalTemperature' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'fuelLevel' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'fuelLevel_State' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'headLampStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'instantFuelConsumption' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'odometer' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'tirePressure' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'vin' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'wiperStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'bodyInformation' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'deviceStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'engineTorque' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'externalTemperature' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'fuelLevel' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'fuelLevel_State' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'headLampStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'instantFuelConsumption' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'odometer' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'tirePressure' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'vin' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'wiperStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'bodyInformation' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'deviceStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'engineTorque' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'externalTemperature' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'fuelLevel' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'fuelLevel_State' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'headLampStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'instantFuelConsumption' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'odometer' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'tirePressure' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'wiperStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'bodyInformation' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'deviceStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'engineTorque' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'externalTemperature' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'fuelLevel' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'fuelLevel_State' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'headLampStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'instantFuelConsumption' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'odometer' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'tirePressure' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'wiperStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'airbagStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'clusterModeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'eCallInfo' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'emergencyEvent' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'airbagStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'clusterModeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'eCallInfo' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'emergencyEvent' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'airbagStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'clusterModeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'eCallInfo' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'emergencyEvent' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'airbagStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'clusterModeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'eCallInfo' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'emergencyEvent' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';
