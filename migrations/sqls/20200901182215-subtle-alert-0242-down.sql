DROP VIEW IF EXISTS view_module_config;
DROP VIEW IF EXISTS view_module_config_staging;
DROP VIEW IF EXISTS view_module_config_production;

ALTER TABLE module_config
DROP COLUMN IF EXISTS projection_notifications,
DROP COLUMN IF EXISTS subtle_emergency_notifications,
DROP COLUMN IF EXISTS subtle_navigation_notifications,
DROP COLUMN IF EXISTS subtle_projection_notifications,
DROP COLUMN IF EXISTS subtle_voicecom_notifications,
DROP COLUMN IF EXISTS subtle_communication_notifications,
DROP COLUMN IF EXISTS subtle_normal_notifications,
DROP COLUMN IF EXISTS subtle_none_notifications;

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
INNER JOIN module_config
ON module_config.id = mc.id;

CREATE OR REPLACE VIEW view_module_config_production AS
SELECT module_config.*
FROM (
    SELECT max(id) AS id
    FROM module_config
    WHERE status='PRODUCTION'
) mc
INNER JOIN module_config
ON module_config.id = mc.id;