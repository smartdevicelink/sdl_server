CREATE TYPE edit_status AS ENUM ('STAGING', 'PRODUCTION');
CREATE TYPE approval_status AS ENUM ('PENDING', 'ACCEPTED', 'DENIED');
CREATE TYPE application_platform AS ENUM ('ANDROID', 'IOS');
CREATE TYPE application_status AS ENUM ('DEVELOPMENT', 'REVIEW', 'PRODUCTION');

CREATE TABLE module_config (
    "id" SERIAL NOT NULL,
    "status" edit_status NOT NULL DEFAULT 'STAGING',
    "preloaded_pt" BOOLEAN NOT NULL DEFAULT true,
    "exchange_after_x_ignition_cycles" INT NOT NULL DEFAULT 100,
    "exchange_after_x_kilometers" INT NOT NULL DEFAULT 180,
    "exchange_after_x_days" INT NOT NULL DEFAULT 30,
    "timeout_after_x_seconds" INT NOT NULL DEFAULT 60,
    "endpoint_0x07" TEXT NOT NULL,
    "endpoint_0x04" TEXT NOT NULL,
    "query_apps_url" TEXT NOT NULL,
    "lock_screen_default_url" TEXT NOT NULL,
    "emergency_notifications" INT NOT NULL DEFAULT 60,
    "navigation_notifications" INT NOT NULL DEFAULT 15,
    "voicecom_notifications" INT NOT NULL DEFAULT 20,
    "communication_notifications" INT NOT NULL DEFAULT 6,
    "normal_notifications" INT NOT NULL DEFAULT 4,
    "none_notifications" INT NOT NULL DEFAULT 0,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE module_config_retry_seconds (
    "id" SERIAL REFERENCES module_config (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "seconds" INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id, seconds)
)
WITH ( OIDS = FALSE );

CREATE TABLE languages (
    "id" CHAR(5) NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE message_text (
	"id" SERIAL NOT NULL,
    "language_id" CHAR(5) REFERENCES languages (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "message_category" TEXT NOT NULL,
    "tts" TEXT,
    "line1" TEXT,
    "line2" TEXT,
    "text_body" TEXT,
    "status" edit_status NOT NULL DEFAULT 'STAGING',
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE function_group_info (
	"id" SERIAL NOT NULL,
    "property_name" TEXT NOT NULL,
    "user_consent_prompt" TEXT,
    "status" edit_status NOT NULL DEFAULT 'STAGING',
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE rpc_names (
	"id" SERIAL NOT NULL,
    "rpc_name" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE vehicle_data (
	"id" SERIAL NOT NULL,
    "component_name" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE rpc_permission (
	"function_group_id" SERIAL REFERENCES function_group_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"rpc_id" SERIAL REFERENCES rpc_names (id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (function_group_id, rpc_id)
)
WITH ( OIDS = FALSE );

CREATE TABLE rpc_vehicle_parameters (
	"function_group_id" SERIAL REFERENCES function_group_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"rpc_id" SERIAL REFERENCES rpc_names (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"vehicle_id" SERIAL REFERENCES vehicle_data (id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (function_group_id, rpc_id, vehicle_id)
)
WITH ( OIDS = FALSE );

CREATE TABLE changelog (
	"status" edit_status NOT NULL DEFAULT 'STAGING',
	"timestamp" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (status, timestamp)
)
WITH ( OIDS = FALSE );



CREATE TABLE vendors (
	"id" SERIAL NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "vendor_email" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE categories (
	"id" INT NOT NULL,
    "display_name" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE countries (
	"id" INT NOT NULL,
    "iso" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE hmi_levels (
    "id" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_info (
	"id" SERIAL NOT NULL,
	"app_uuid" VARCHAR(36) NOT NULL,
	"name" TEXT NOT NULL,
	"vendor_id" INT REFERENCES vendors (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"platform" application_platform NOT NULL,
	"platform_app_id" TEXT,
  	"status" application_status NOT NULL,
  	"can_background_alert" BOOLEAN NOT NULL,
  	"can_steal_focus" BOOLEAN NOT NULL,
	"default_hmi_level" TEXT NOT NULL REFERENCES hmi_levels (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"tech_email" TEXT NOT NULL,
	"tech_phone" TEXT NOT NULL,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),	
	"category_id" INT REFERENCES categories (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"approval_status" approval_status NOT NULL DEFAULT 'PENDING',
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_countries (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"country_id" INT REFERENCES countries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (app_id, country_id)
)
WITH ( OIDS = FALSE );

CREATE TABLE display_names (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"display_text" VARCHAR(100) NOT NULL,
    PRIMARY KEY (app_id, display_text)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_permissions (
    "app_id" SERIAL REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
	"vehicle_id" SERIAL REFERENCES vehicle_data (id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (app_id, vehicle_id)
)
WITH ( OIDS = FALSE );



INSERT INTO module_config ("preloaded_pt", "exchange_after_x_ignition_cycles", "exchange_after_x_kilometers", "exchange_after_x_days", "timeout_after_x_seconds", "endpoint_0x07", "endpoint_0x04", "query_apps_url", "lock_screen_default_url", "emergency_notifications", "navigation_notifications", "voicecom_notifications", "communication_notifications", "normal_notifications", "none_notifications") VALUES
(true, 100, 180, 30, 60, 'http://policies.telematics.ford.com/api/policies', 'http://ivsu.software.ford.com/api/getsoftwareupdates', 'http://sdl.shaid.server', 'http://i.imgur.com/QwZ9uKG.png', 60, 15, 20, 6, 4, 0);
