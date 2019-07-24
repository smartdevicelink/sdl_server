/* db-migrate create passenger-mode -e pg-staging */

--Create a new RPC and add this to the default provider group AppServiceProviderGroup.


-- alter table module_config drop column lock_screen_dismissal_enabled;

alter table module_config add lock_screen_dismissal_enabled boolean default false not null;


--alter table module_config alter column lock_screen_dismissal_enabled set not null;



-- create view view_module_config(id, status, preloaded_pt, exchange_after_x_ignition_cycles, exchange_after_x_kilometers,
--                                exchange_after_x_days, timeout_after_x_seconds, endpoint_0x04, query_apps_url,
--                                lock_screen_default_url, emergency_notifications, navigation_notifications,
--                                voicecom_notifications, communication_notifications, normal_notifications,
--                                none_notifications, created_ts, updated_ts) as
-- SELECT module_config.id,
--        module_config.status,
--        module_config.preloaded_pt,
--        module_config.exchange_after_x_ignition_cycles,
--        module_config.exchange_after_x_kilometers,
--        module_config.exchange_after_x_days,
--        module_config.timeout_after_x_seconds,
--        module_config.endpoint_0x04,
--        module_config.query_apps_url,
--        module_config.lock_screen_default_url,
--        module_config.emergency_notifications,
--        module_config.navigation_notifications,
--        module_config.voicecom_notifications,
--        module_config.communication_notifications,
--        module_config.normal_notifications,
--        module_config.none_notifications,
--        module_config.created_ts,
--        module_config.updated_ts
-- FROM ((SELECT module_config_1.status,
--               max(module_config_1.id) AS id
--        FROM module_config module_config_1
--        GROUP BY module_config_1.status) vmc
--          JOIN module_config ON ((vmc.id = module_config.id)));

--deprecate these views
DROP VIEW view_module_config;
DROP VIEW view_module_config_staging;
DROP VIEW view_module_config_production;

create view view_module_config as
SELECT module_config.*
FROM ((SELECT module_config_1.status,
              max(module_config_1.id) AS id
       FROM module_config module_config_1
       GROUP BY module_config_1.status) vmc
         JOIN module_config ON ((vmc.id = module_config.id)));

create view view_module_config_staging as
SELECT module_config.*
FROM ((SELECT max(module_config_1.id) AS id
       FROM module_config module_config_1) mc
         JOIN module_config ON ((module_config.id = mc.id)));


DROP VIEW view_module_config_production;
create view view_module_config_production as
SELECT module_config.*
FROM ((SELECT max(module_config_1.id) AS id
       FROM module_config module_config_1
       WHERE (module_config_1.status = 'PRODUCTION'::edit_status)) mc
         JOIN module_config ON ((module_config.id = mc.id)));


