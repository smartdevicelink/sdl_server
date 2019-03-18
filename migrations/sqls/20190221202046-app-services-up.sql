-- APP SERVICES UP MIGRATION --
DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;

ALTER TABLE public.permissions
ADD COLUMN IF NOT EXISTS function_id INTEGER,
ADD COLUMN IF NOT EXISTS display_name TEXT;


CREATE TABLE service_types (
	"name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    CONSTRAINT service_type_pk PRIMARY KEY (name)
)
WITH ( OIDS = FALSE );


CREATE TABLE service_type_permissions (
	"service_type_name" TEXT NOT NULL,
	"permission_name" VARCHAR(64) NOT NULL,
    CONSTRAINT service_type_permission_pk PRIMARY KEY (service_type_name, permission_name)
)
WITH ( OIDS = FALSE );


CREATE TABLE app_service_types (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"service_type_name" TEXT REFERENCES service_types (name) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT app_service_types_pk PRIMARY KEY (app_id, service_type_name)
)
WITH ( OIDS = FALSE );


CREATE TABLE app_service_type_names (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"service_type_name" TEXT REFERENCES service_types (name) ON UPDATE CASCADE ON DELETE CASCADE,
    "service_name" VARCHAR(255),
    CONSTRAINT app_service_type_names_pk PRIMARY KEY (app_id, service_type_name, service_name)
)
WITH ( OIDS = FALSE );


CREATE TABLE app_service_type_permissions (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"service_type_name" TEXT REFERENCES service_types (name) ON UPDATE CASCADE ON DELETE CASCADE,
    "permission_name" VARCHAR(64) REFERENCES permissions (name) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT app_service_type_permissions_pk PRIMARY KEY (app_id, service_type_name, permission_name)
)
WITH ( OIDS = FALSE );



ALTER TABLE function_group_info
ADD COLUMN IF NOT EXISTS "is_app_provider_group" BOOLEAN NOT NULL DEFAULT false;



CREATE OR REPLACE VIEW view_function_group_info AS
SELECT function_group_info.*
FROM (
SELECT property_name, status, max(id) AS id
    FROM function_group_info
    GROUP BY property_name, status
) AS vfgi
INNER JOIN function_group_info ON vfgi.id = function_group_info.id;

CREATE OR REPLACE VIEW view_mapped_permissions AS
SELECT function_group_id AS id, permission_name AS name, status, property_name, is_deleted
FROM view_function_group_info
INNER JOIN function_group_hmi_levels
ON view_function_group_info.id = function_group_hmi_levels.function_group_id
WHERE is_deleted=false
UNION
SELECT function_group_id AS id, parameter AS name, status, property_name, is_deleted
FROM view_function_group_info
INNER JOIN function_group_parameters
ON view_function_group_info.id = function_group_parameters.function_group_id
WHERE is_deleted=false;

CREATE OR REPLACE VIEW view_mapped_permissions_staging AS
SELECT view_mapped_permissions.*
FROM view_mapped_permissions
INNER JOIN (
    SELECT max(id) AS id, property_name
    FROM view_function_group_info
    GROUP BY property_name
) fgi
ON view_mapped_permissions.id = fgi.id;

CREATE OR REPLACE VIEW view_mapped_permissions_production AS
SELECT view_mapped_permissions.* FROM view_mapped_permissions
WHERE status = 'PRODUCTION';



INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, is_app_provider_group, status)
SELECT 'AppServiceProviderGroup' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'true' AS is_app_provider_group, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'AppServiceProviderGroup'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'AppServiceConsumerGroup' AS property_name, null AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'AppServiceConsumerGroup'
);



INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetAppServiceData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetAppServiceData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetAppServiceData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetAppServiceData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppServiceData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppServiceData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppServiceData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppServiceData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAppServiceInteraction' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAppServiceInteraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAppServiceInteraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAppServiceInteraction' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PublishAppService' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PublishAppService' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PublishAppService' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PublishAppService' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceProviderGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetAppServiceData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetAppServiceData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetAppServiceData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetAppServiceData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppServiceData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppServiceData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppServiceData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppServiceData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemCapabilityUpdated' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAppServiceInteraction' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAppServiceInteraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAppServiceInteraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAppServiceInteraction' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'AppServiceConsumerGroup';
