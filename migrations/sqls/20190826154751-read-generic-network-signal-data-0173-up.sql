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


-- TABLES FOR RPC SPEC SYNC --

CREATE TABLE IF NOT EXISTS rpc_spec (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "min_version" TEXT,
    "date" TEXT,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT rpc_spec_pk PRIMARY KEY (id),
    CONSTRAINT rpc_spec_version_unique UNIQUE (version)
)
WITH ( OIDS = FALSE );

CREATE TABLE IF NOT EXISTS rpc_spec_type (
    "id" SERIAL NOT NULL,
    "rpc_spec_id" INTEGER NOT NULL REFERENCES rpc_spec (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "element_type" TEXT NOT NULL, -- ENUM, STRUCT, FUNCTION
    "name" TEXT NOT NULL,
    "since" TEXT,
    "until" TEXT,
    "deprecated" TEXT,
    "removed" TEXT,
    "internal_scope" TEXT,
    "platform" TEXT,
    "function_id" TEXT, -- actually functionID
    "message_type" TEXT, -- actually messagetype
    CONSTRAINT rpc_spec_type_pk PRIMARY KEY (id),
    CONSTRAINT rpc_spec_type_unique UNIQUE (rpc_spec_id, element_type, name, message_type)
)
WITH ( OIDS = FALSE );

-- rpc_spec_param table used to store params of functions, params of structs (includes referencing other structs)
-- and available enum values
CREATE TABLE IF NOT EXISTS rpc_spec_param (
    "id" SERIAL NOT NULL,
    "rpc_spec_type_id" INTEGER NULL REFERENCES rpc_spec_type (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "internal_name" TEXT,
    "root_screen" TEXT, -- actually rootscreen
    "mandatory" TEXT,
    "since" TEXT,
    "until" TEXT,
    "deprecated" TEXT,
    "removed" TEXT,
    "value" TEXT,
    "hex_value" TEXT, -- actually hexvalue
    "min_length" TEXT, -- actually minlength
    "max_length" TEXT, -- actually maxlength
    "min_size" TEXT, -- actually minsize
    "max_size" TEXT, -- actually maxsize
    "min_value" TEXT, -- actually minvalue
    "max_value" TEXT, -- actually maxvalue
    "array" TEXT,
    "platform" TEXT,
    "def_value" TEXT, -- actually defvalue
    CONSTRAINT rpc_spec_param_pk PRIMARY KEY (id),
    CONSTRAINT rpc_spec_param_unique UNIQUE (rpc_spec_type_id, name)
)
WITH ( OIDS = FALSE );

-- END TABLES FOR RPC SPEC SYNC --


-- TABLES FOR CUSTOM VEHICLE DATA --

CREATE TABLE IF NOT EXISTS custom_vehicle_data (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER REFERENCES custom_vehicle_data (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "status" edit_status NOT NULL DEFAULT 'STAGING'::edit_status,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "key" TEXT, -- OEM Data Reference string (proprietary)\
    "mandatory" TEXT,
    "min_length" TEXT, -- actually minlength
    "max_length" TEXT, -- actually maxlength
    "min_size" TEXT, -- actually minsize
    "max_size" TEXT, -- actually maxsize
    "min_value" TEXT, -- actually minvalue
    "max_value" TEXT, -- actually maxvalue
    "array" TEXT,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT custom_vehicle_data_pk PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

-- END TABLES FOR CUSTOM VEHICLE DATA --


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
