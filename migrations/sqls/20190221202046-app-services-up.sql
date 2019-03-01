-- APP SERVICES UP MIGRATION --
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