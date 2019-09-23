-- DROP AFFECTED VIEWS --

DROP VIEW IF EXISTS view_module_config;
DROP VIEW IF EXISTS view_module_config_staging;
DROP VIEW IF EXISTS view_module_config_production;
DROP VIEW IF EXISTS view_mapped_permissions_production;
DROP VIEW IF EXISTS view_mapped_permissions_staging;
DROP VIEW IF EXISTS view_mapped_permissions;
DROP VIEW IF EXISTS view_function_group_info;

-- END DROP OF VIEWS --


-- ALTER/CREATE TABLES --

ALTER TABLE module_config
    ADD COLUMN IF NOT EXISTS custom_vehicle_data_mapping_url TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS module_config_endpoint_property (
    "module_config_id" INTEGER NOT NULL REFERENCES module_config (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "endpoint_name" TEXT NOT NULL,
    "property_name" TEXT NOT NULL,
    "property_value" TEXT NOT NULL,
    CONSTRAINT module_config_endpoint_property_pk PRIMARY KEY (module_config_id, endpoint_name, property_name)
)
WITH ( OIDS = FALSE );

ALTER TABLE public.function_group_info
    ADD COLUMN IF NOT EXISTS is_proprietary_group BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS app_function_groups (
    "app_id" INTEGER NOT NULL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "property_name" TEXT NOT NULL,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT app_function_groups_pk PRIMARY KEY (app_id, property_name)
)
WITH ( OIDS = FALSE );

/*
CREATE TABLE IF NOT EXISTS vehicle_data (
    id                    SERIAL                  NOT NULL CONSTRAINT vehicle_data_pk PRIMARY KEY,
    parent_id             INTEGER,
    vehicle_data_group_id INTEGER,
    name                  TEXT,
    key                   TEXT,
    type                  TEXT,
    "array"               BOOLEAN,
    since                 VARCHAR(255),
    until                 VARCHAR(255),
    removed               VARCHAR(255),
    deprecated            VARCHAR(255),
    minvalue              VARCHAR(255),
    maxvalue              VARCHAR(255),
    minsize               INTEGER,
    maxsize               INTEGER,
    minlength             INTEGER,
    maxlength             INTEGER,
    created_ts            TIMESTAMP DEFAULT now() NOT NULL,
    updated_ts            TIMESTAMP DEFAULT now() NOT NULL
)
WITH ( OIDS = FALSE );


CREATE TABLE IF NOT EXISTS vehicle_data_enums (
    id VARCHAR(255) NOT NULL CONSTRAINT vehicle_data_enums_pk PRIMARY KEY
)
WITH ( OIDS = FALSE );

CREATE TABLE IF NOT EXISTS vehicle_data_reserved_params (
    id VARCHAR(255) NOT NULL CONSTRAINT vehicle_data_reserved_params_pk PRIMARY KEY
)
WITH ( OIDS = FALSE );

CREATE TABLE IF NOT EXISTS vehicle_data_group (
    id             SERIAL                          NOT NULL CONSTRAINT vehicle_data_group_pk PRIMARY KEY,
    schema_version TEXT      default '0.0.0'::TEXT NOT NULL,
    created_ts     TIMESTAMP DEFAULT now(),
    updated_ts     TIMESTAMP DEFAULT now(),
    is_deleted     BOOLEAN   DEFAULT FALSE,
    status         TEXT
)
WITH ( OIDS = FALSE );
*/

-- END ALTER/CREATE TABLES --


-- RECREATE AFFECTED VIEWS --

CREATE OR REPLACE VIEW view_module_config AS
    SELECT module_config.*
    FROM (
        SELECT status, max(id) AS id
        FROM module_config
        GROUP BY status
    ) AS vmc
    INNER JOIN module_config ON vmc.id = module_config.id;

CREATE OR REPLACE VIEW view_module_config_staging AS
    SELECT module_config.*
    FROM (
        SELECT max(id) AS id
        FROM module_config
    ) mc
    INNER JOIN module_config ON module_config.id = mc.id;

CREATE OR REPLACE VIEW view_module_config_production AS
    SELECT module_config.*
    FROM (
        SELECT max(id) AS id
        FROM module_config
        WHERE status = 'PRODUCTION'
    ) mc
    INNER JOIN module_config ON module_config.id = mc.id;


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

-- END VIEW RECREATION --