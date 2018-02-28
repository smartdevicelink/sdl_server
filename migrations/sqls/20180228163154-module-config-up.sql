--Copyright (c) 2018, Livio, Inc.
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

ALTER TABLE module_config_retry_seconds
ADD "order" INT;

UPDATE module_config_retry_seconds 
SET "order" = seconds;

ALTER TABLE module_config_retry_seconds
ALTER COLUMN "order" SET NOT NULL;