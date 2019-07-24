/* db-migrate create passenger-mode -e pg-staging */

ALTER TABLE module_config ADD lock_screen_dismissal_enabled BOOLEAN DEFAULT FALSE NOT NULL;


INSERT INTO message_group (message_category, status)
VALUES ('LockScreenDismissalWarning', 'PRODUCTION');

INSERT INTO message_text (language_id,text_body,
                          message_group_id)
VALUES ('en-us',
        'Swipe down to dismiss, acknowledging that you are not the driver',
        (select max(id) from message_group where message_category = 'LockScreenDismissalWarning'));


--Recreate view after adding new columns. This exact statement is in two migrations already
--it is required as long as this view is still in use.
DROP VIEW IF EXISTS view_module_config;
DROP VIEW IF EXISTS view_module_config_staging;
DROP VIEW IF EXISTS view_module_config_production;

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

