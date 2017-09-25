CREATE TYPE hmi_level AS ENUM ('FULL', 'BACKGROUND', 'LIMITED', 'NONE');
CREATE TYPE permission_type AS ENUM ('RPC', 'MODULE', 'PARAMETER');

CREATE TABLE permissions (
	"name" VARCHAR(64) NOT NULL,
  "type" permission_type NOT NULL,
    PRIMARY KEY (name)
)
WITH ( OIDS = FALSE );

CREATE TABLE function_group_permissions (
    "function_group_id" INTEGER NOT NULL REFERENCES function_group_info(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "permission_name" VARCHAR(64) NOT NULL REFERENCES permissions(name) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (function_group_id, permission_name)
)
WITH ( OIDS = FALSE );

CREATE TABLE permission_relations (
    "child_permission_name" VARCHAR(64) NOT NULL REFERENCES permissions(name) ON UPDATE CASCADE ON DELETE CASCADE,
    "parent_permission_name" VARCHAR(64) NOT NULL REFERENCES permissions(name) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (child_permission_name, parent_permission_name)
)
WITH ( OIDS = FALSE );

CREATE TABLE permission_hmi_levels (
  "permission_name" VARCHAR(64) NOT NULL REFERENCES permissions(name) ON UPDATE CASCADE ON DELETE CASCADE,
  "function_group_id" INTEGER NOT NULL REFERENCES function_group_info(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "hmi_level" hmi_level NOT NULL,
    PRIMARY KEY (permission_name, function_group_id, hmi_level)
)
WITH ( OIDS = FALSE );

INSERT INTO permissions (name, type)
SELECT DISTINCT rpc_name, 'RPC'::permission_type
FROM rpc_names;

INSERT INTO permissions (name, type)
SELECT DISTINCT component_name, 'PARAMETER'::permission_type
FROM vehicle_data;

INSERT INTO function_group_permissions (function_group_id, permission_name)
SELECT function_group_id, rpc_name
FROM rpc_permission
INNER JOIN rpc_names ON rpc_permission.rpc_id = rpc_names.id;

INSERT INTO function_group_permissions (function_group_id, permission_name)
SELECT DISTINCT function_group_id, component_name
FROM rpc_vehicle_parameters
INNER JOIN vehicle_data ON rpc_vehicle_parameters.vehicle_id = vehicle_data.id;
