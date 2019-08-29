/* Replace with your SQL commands */

DROP VIEW view_module_config;
DROP VIEW view_module_config_staging;
DROP VIEW view_module_config_production;

ALTER TABLE module_config DROP COLUMN custom_vehicle_data_mapping_url;
ALTER TABLE module_config  DROP COLUMN custom_vehicle_data_mapping_url_version;

DROP TABLE vehicle_data;
DROP TABLE vehicle_data_enums;
DROP TABLE vehicle_data_reserved_params;
DROP TABLE vehicle_data_group;

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
