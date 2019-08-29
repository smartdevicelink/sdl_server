/* db-migrate create read-generic-network-signal-data-0173 -e pg-staging */

ALTER TABLE module_config ADD custom_vehicle_data_mapping_url TEXT NOT NULL DEFAULT 'http://localhost:3000/api/1/vehicleDataMap';
ALTER TABLE module_config ADD custom_vehicle_data_mapping_url_version TEXT NOT NULL DEFAULT '0.0.0';

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

CREATE TABLE vehicle_data
(
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
);


CREATE TABLE vehicle_data_enums
(
    id VARCHAR(255) NOT NULL CONSTRAINT vehicle_data_enums_pk PRIMARY KEY
);

CREATE TABLE vehicle_data_reserved_params
(
    id VARCHAR(255) NOT NULL CONSTRAINT vehicle_data_reserved_params_pk PRIMARY KEY
);

CREATE TABLE vehicle_data_group
(
    id             SERIAL                          NOT NULL CONSTRAINT vehicle_data_group_pk PRIMARY KEY,
    schema_version TEXT      default '0.0.0'::TEXT NOT NULL,
    created_ts     TIMESTAMP DEFAULT now(),
    updated_ts     TIMESTAMP DEFAULT now(),
    is_deleted     BOOLEAN   DEFAULT FALSE,
    status         TEXT
);
