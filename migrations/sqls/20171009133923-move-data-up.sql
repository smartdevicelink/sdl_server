CREATE TABLE function_group_hmi_levels (
    "function_group_id" INTEGER NOT NULL REFERENCES function_group_info(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "permission_name" VARCHAR(64) NOT NULL,
    "hmi_level" hmi_level NOT NULL,
    PRIMARY KEY (function_group_id, permission_name, hmi_level)
)
WITH ( OIDS = FALSE );

CREATE TABLE function_group_parameters (
    "function_group_id" INTEGER NOT NULL REFERENCES function_group_info(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "rpc_name" VARCHAR(64) NOT NULL,
    "parameter" VARCHAR(64) NOT NULL,
    PRIMARY KEY (function_group_id, rpc_name, parameter)
)
WITH ( OIDS = FALSE );

CREATE TABLE user_accounts (
    "id" SERIAL NOT NULL,
    "invited_by_id" INT REFERENCES user_accounts (id) ON UPDATE CASCADE ON DELETE SET NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "password" TEXT NOT NULL,
    "salt" TEXT,
    "updated_password_ts" TIMESTAMP WITHOUT TIME ZONE,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

CREATE TABLE forgot_password_hash (
    "nonce_uuid" VARCHAR(36) NOT NULL,
    "user_id" INT NOT NULL REFERENCES user_accounts (id) ON UPDATE CASCADE ON DELETE CASCADE,
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (nonce_uuid)
)
WITH ( OIDS = FALSE );

CREATE TABLE app_auto_approval (
    "app_uuid" VARCHAR(36),
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (app_uuid)
)
WITH ( OIDS = FALSE );

CREATE TABLE hmi_level_conversion (
    "hmi_level_enum" hmi_level NOT NULL,
    "hmi_level_text" TEXT NOT NULL,
    PRIMARY KEY (hmi_level_enum)
)
WITH ( OIDS = FALSE );

CREATE TABLE message_group (
    "id" SERIAL NOT NULL,
    "message_category" TEXT NOT NULL,
    "status" edit_status NOT NULL DEFAULT 'STAGING',
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "updated_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

ALTER TABLE message_text
ADD "message_group_id" INT REFERENCES message_group (id) ON UPDATE CASCADE ON DELETE CASCADE;

INSERT INTO message_group (message_category, status)
SELECT message_category, status
FROM message_text
GROUP BY message_category, status;

UPDATE message_text
SET message_group_id = (
    SELECT id
    FROM message_group mg
    WHERE mg.message_category = message_text.message_category
    AND mg.status = message_text.status
    LIMIT 1
);

ALTER TABLE message_text
ALTER COLUMN "message_group_id" SET NOT NULL,
DROP COLUMN "message_category",
DROP COLUMN "status",
DROP COLUMN "created_ts",
DROP COLUMN "updated_ts";

UPDATE message_group
SET status = 'PRODUCTION'
WHERE status = 'STAGING';

INSERT INTO hmi_level_conversion (hmi_level_enum, hmi_level_text)
VALUES (
    'FULL', 'HMI_FULL'
),
(
    'LIMITED', 'HMI_LIMITED'
),
(
    'BACKGROUND', 'HMI_BACKGROUND'
),
(
    'NONE', 'HMI_NONE'
);

ALTER TABLE app_permissions
ADD "hmi_level" TEXT;

ALTER TABLE function_group_info
ADD "description" TEXT,
ADD "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE app_info
ADD "denial_message" TEXT,
ADD "icon_url" TEXT;

DROP TABLE IF EXISTS function_group_permissions;

UPDATE module_config
SET status = 'PRODUCTION'
WHERE status = 'STAGING';


CREATE OR REPLACE VIEW view_message_group_staging AS
SELECT max(id) AS id, message_category
FROM message_group
GROUP BY message_category;

CREATE OR REPLACE VIEW view_message_group_production AS
SELECT max(id) AS id, message_category
FROM message_group
WHERE status = 'PRODUCTION'
GROUP BY message_category;

CREATE OR REPLACE VIEW view_message_text_staging AS
SELECT message_category, message_text.*
FROM view_message_group_staging
INNER JOIN message_text
ON message_text.message_group_id = view_message_group_staging.id;

CREATE OR REPLACE VIEW view_message_text_production AS
SELECT message_category, message_text.*
FROM view_message_group_production
INNER JOIN message_text
ON message_text.message_group_id = view_message_group_production.id;


CREATE OR REPLACE VIEW view_module_config AS
SELECT module_config.*
FROM (
SELECT status, max(id) AS id
    FROM module_config
    GROUP BY status
) AS vmc
INNER JOIN module_config ON vmc.id = module_config.id;


CREATE OR REPLACE VIEW view_function_group_info AS
SELECT function_group_info.*
FROM (
SELECT property_name, status, max(id) AS id
    FROM function_group_info
    GROUP BY property_name, status
) AS vfgi
INNER JOIN function_group_info ON vfgi.id = function_group_info.id;


CREATE OR REPLACE VIEW view_partial_app_info AS
SELECT app_uuid, approval_status, max(id) AS id
FROM app_info
GROUP BY app_uuid, approval_status;


CREATE OR REPLACE VIEW view_mapped_permissions AS
SELECT function_group_id AS id, permission_name AS name, status, property_name
FROM view_function_group_info
INNER JOIN function_group_hmi_levels
ON view_function_group_info.id = function_group_hmi_levels.function_group_id
UNION
SELECT function_group_id AS id, parameter AS name, status, property_name
FROM view_function_group_info
INNER JOIN function_group_parameters
ON view_function_group_info.id = function_group_parameters.function_group_id;

CREATE OR REPLACE VIEW view_mapped_permissions_staging AS
SELECT mapped.*
FROM (
    SELECT function_group_id AS id, permission_name AS name, status, property_name
    FROM view_function_group_info
    INNER JOIN function_group_hmi_levels
    ON view_function_group_info.id = function_group_hmi_levels.function_group_id
    UNION
    SELECT function_group_id AS id, parameter AS name, status, property_name
    FROM view_function_group_info
    INNER JOIN function_group_parameters
    ON view_function_group_info.id = function_group_parameters.function_group_id
) mapped
INNER JOIN (
    SELECT max(id) AS id, property_name
    FROM view_function_group_info
    GROUP BY property_name
) fgi
ON mapped.id = fgi.id;

CREATE OR REPLACE VIEW view_mapped_permissions_production AS
SELECT function_group_id AS id, permission_name AS name, status, property_name
FROM view_function_group_info
INNER JOIN function_group_hmi_levels
ON view_function_group_info.id = function_group_hmi_levels.function_group_id
UNION
SELECT function_group_id AS id, parameter AS name, status, property_name
FROM view_function_group_info
INNER JOIN function_group_parameters
ON view_function_group_info.id = function_group_parameters.function_group_id
WHERE status = 'PRODUCTION';

INSERT INTO hmi_levels (id)
SELECT 'HMI_FULL' AS id
WHERE NOT EXISTS (
    SELECT * FROM hmi_levels hl
    WHERE hl.id = 'HMI_FULL'
);

INSERT INTO hmi_levels (id)
SELECT 'HMI_LIMITED' AS id
WHERE NOT EXISTS (
    SELECT * FROM hmi_levels hl
    WHERE hl.id = 'HMI_LIMITED'
);

INSERT INTO hmi_levels (id)
SELECT 'HMI_BACKGROUND' AS id
WHERE NOT EXISTS (
    SELECT * FROM hmi_levels hl
    WHERE hl.id = 'HMI_BACKGROUND'
);

INSERT INTO hmi_levels (id)
SELECT 'HMI_NONE' AS id
WHERE NOT EXISTS (
    SELECT * FROM hmi_levels hl
    WHERE hl.id = 'HMI_NONE'
);



INSERT INTO countries (iso, name)
SELECT 'AF' AS iso, 'Afghanistan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AF'
    AND c.name = 'Afghanistan'
);

INSERT INTO countries (iso, name)
SELECT 'AX' AS iso, 'Åland Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AX'
    AND c.name = 'Åland Islands'
);

INSERT INTO countries (iso, name)
SELECT 'AL' AS iso, 'Albania' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AL'
    AND c.name = 'Albania'
);

INSERT INTO countries (iso, name)
SELECT 'DZ' AS iso, 'Algeria' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'DZ'
    AND c.name = 'Algeria'
);

INSERT INTO countries (iso, name)
SELECT 'AS' AS iso, 'American Samoa' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AS'
    AND c.name = 'American Samoa'
);

INSERT INTO countries (iso, name)
SELECT 'AD' AS iso, 'Andorra' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AD'
    AND c.name = 'Andorra'
);

INSERT INTO countries (iso, name)
SELECT 'AO' AS iso, 'Angola' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AO'
    AND c.name = 'Angola'
);

INSERT INTO countries (iso, name)
SELECT 'AI' AS iso, 'Anguilla' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AI'
    AND c.name = 'Anguilla'
);

INSERT INTO countries (iso, name)
SELECT 'AQ' AS iso, 'Antarctica' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AQ'
    AND c.name = 'Antarctica'
);

INSERT INTO countries (iso, name)
SELECT 'AG' AS iso, 'Antigua and Barbuda' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AG'
    AND c.name = 'Antigua and Barbuda'
);

INSERT INTO countries (iso, name)
SELECT 'AR' AS iso, 'Argentina' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AR'
    AND c.name = 'Argentina'
);

INSERT INTO countries (iso, name)
SELECT 'AM' AS iso, 'Armenia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AM'
    AND c.name = 'Armenia'
);

INSERT INTO countries (iso, name)
SELECT 'AW' AS iso, 'Aruba' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AW'
    AND c.name = 'Aruba'
);

INSERT INTO countries (iso, name)
SELECT 'AU' AS iso, 'Australia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AU'
    AND c.name = 'Australia'
);

INSERT INTO countries (iso, name)
SELECT 'AT' AS iso, 'Austria' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AT'
    AND c.name = 'Austria'
);

INSERT INTO countries (iso, name)
SELECT 'AZ' AS iso, 'Azerbaijan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AZ'
    AND c.name = 'Azerbaijan'
);

INSERT INTO countries (iso, name)
SELECT 'BS' AS iso, 'Bahamas' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BS'
    AND c.name = 'Bahamas'
);

INSERT INTO countries (iso, name)
SELECT 'BH' AS iso, 'Bahrain' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BH'
    AND c.name = 'Bahrain'
);

INSERT INTO countries (iso, name)
SELECT 'BD' AS iso, 'Bangladesh' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BD'
    AND c.name = 'Bangladesh'
);

INSERT INTO countries (iso, name)
SELECT 'BB' AS iso, 'Barbados' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BB'
    AND c.name = 'Barbados'
);

INSERT INTO countries (iso, name)
SELECT 'BY' AS iso, 'Belarus' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BY'
    AND c.name = 'Belarus'
);

INSERT INTO countries (iso, name)
SELECT 'BE' AS iso, 'Belgium' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BE'
    AND c.name = 'Belgium'
);

INSERT INTO countries (iso, name)
SELECT 'BZ' AS iso, 'Belize' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BZ'
    AND c.name = 'Belize'
);

INSERT INTO countries (iso, name)
SELECT 'BJ' AS iso, 'Benin' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BJ'
    AND c.name = 'Benin'
);

INSERT INTO countries (iso, name)
SELECT 'BM' AS iso, 'Bermuda' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BM'
    AND c.name = 'Bermuda'
);

INSERT INTO countries (iso, name)
SELECT 'BT' AS iso, 'Bhutan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BT'
    AND c.name = 'Bhutan'
);

INSERT INTO countries (iso, name)
SELECT 'BO' AS iso, 'Bolivia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BO'
    AND c.name = 'Bolivia'
);

INSERT INTO countries (iso, name)
SELECT 'BA' AS iso, 'Bosnia and Herzegovina' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BA'
    AND c.name = 'Bosnia and Herzegovina'
);

INSERT INTO countries (iso, name)
SELECT 'BW' AS iso, 'Botswana' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BW'
    AND c.name = 'Botswana'
);

INSERT INTO countries (iso, name)
SELECT 'BV' AS iso, 'Bouvet Island' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BV'
    AND c.name = 'Bouvet Island'
);

INSERT INTO countries (iso, name)
SELECT 'BR' AS iso, 'Brazil' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BR'
    AND c.name = 'Brazil'
);

INSERT INTO countries (iso, name)
SELECT 'IO' AS iso, 'British Indian Ocean Territory' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IO'
    AND c.name = 'British Indian Ocean Territory'
);

INSERT INTO countries (iso, name)
SELECT 'BN' AS iso, 'Brunei Darussalam' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BN'
    AND c.name = 'Brunei Darussalam'
);

INSERT INTO countries (iso, name)
SELECT 'BG' AS iso, 'Bulgaria' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BG'
    AND c.name = 'Bulgaria'
);

INSERT INTO countries (iso, name)
SELECT 'BF' AS iso, 'Burkina Faso' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BF'
    AND c.name = 'Burkina Faso'
);

INSERT INTO countries (iso, name)
SELECT 'BI' AS iso, 'Burundi' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BI'
    AND c.name = 'Burundi'
);

INSERT INTO countries (iso, name)
SELECT 'KH' AS iso, 'Cambodia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KH'
    AND c.name = 'Cambodia'
);

INSERT INTO countries (iso, name)
SELECT 'CM' AS iso, 'Cameroon' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CM'
    AND c.name = 'Cameroon'
);

INSERT INTO countries (iso, name)
SELECT 'CA' AS iso, 'Canada' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CA'
    AND c.name = 'Canada'
);

INSERT INTO countries (iso, name)
SELECT 'CV' AS iso, 'Cape Verde' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CV'
    AND c.name = 'Cape Verde'
);

INSERT INTO countries (iso, name)
SELECT 'BQ' AS iso, 'Caribbean Netherlands ' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BQ'
    AND c.name = 'Caribbean Netherlands '
);

INSERT INTO countries (iso, name)
SELECT 'KY' AS iso, 'Cayman Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KY'
    AND c.name = 'Cayman Islands'
);

INSERT INTO countries (iso, name)
SELECT 'CF' AS iso, 'Central African Republic' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CF'
    AND c.name = 'Central African Republic'
);

INSERT INTO countries (iso, name)
SELECT 'TD' AS iso, 'Chad' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TD'
    AND c.name = 'Chad'
);

INSERT INTO countries (iso, name)
SELECT 'CL' AS iso, 'Chile' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CL'
    AND c.name = 'Chile'
);

INSERT INTO countries (iso, name)
SELECT 'CN' AS iso, 'China' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CN'
    AND c.name = 'China'
);

INSERT INTO countries (iso, name)
SELECT 'CX' AS iso, 'Christmas Island' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CX'
    AND c.name = 'Christmas Island'
);

INSERT INTO countries (iso, name)
SELECT 'CC' AS iso, 'Cocos (Keeling) Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CC'
    AND c.name = 'Cocos (Keeling) Islands'
);

INSERT INTO countries (iso, name)
SELECT 'CO' AS iso, 'Colombia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CO'
    AND c.name = 'Colombia'
);

INSERT INTO countries (iso, name)
SELECT 'KM' AS iso, 'Comoros' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KM'
    AND c.name = 'Comoros'
);

INSERT INTO countries (iso, name)
SELECT 'CG' AS iso, 'Congo' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CG'
    AND c.name = 'Congo'
);

INSERT INTO countries (iso, name)
SELECT 'CD' AS iso, 'Congo, Democratic Republic of' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CD'
    AND c.name = 'Congo, Democratic Republic of'
);

INSERT INTO countries (iso, name)
SELECT 'CK' AS iso, 'Cook Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CK'
    AND c.name = 'Cook Islands'
);

INSERT INTO countries (iso, name)
SELECT 'CR' AS iso, 'Costa Rica' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CR'
    AND c.name = 'Costa Rica'
);

INSERT INTO countries (iso, name)
SELECT 'CI' AS iso, 'Côte d''Ivoire' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CI'
    AND c.name = 'Côte d''Ivoire'
);

INSERT INTO countries (iso, name)
SELECT 'HR' AS iso, 'Croatia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'HR'
    AND c.name = 'Croatia'
);

INSERT INTO countries (iso, name)
SELECT 'CU' AS iso, 'Cuba' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CU'
    AND c.name = 'Cuba'
);

INSERT INTO countries (iso, name)
SELECT 'CW' AS iso, 'Curaçao' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CW'
    AND c.name = 'Curaçao'
);

INSERT INTO countries (iso, name)
SELECT 'CY' AS iso, 'Cyprus' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CY'
    AND c.name = 'Cyprus'
);

INSERT INTO countries (iso, name)
SELECT 'CZ' AS iso, 'Czech Republic' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CZ'
    AND c.name = 'Czech Republic'
);

INSERT INTO countries (iso, name)
SELECT 'DK' AS iso, 'Denmark' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'DK'
    AND c.name = 'Denmark'
);

INSERT INTO countries (iso, name)
SELECT 'DJ' AS iso, 'Djibouti' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'DJ'
    AND c.name = 'Djibouti'
);

INSERT INTO countries (iso, name)
SELECT 'DM' AS iso, 'Dominica' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'DM'
    AND c.name = 'Dominica'
);

INSERT INTO countries (iso, name)
SELECT 'DO' AS iso, 'Dominican Republic' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'DO'
    AND c.name = 'Dominican Republic'
);

INSERT INTO countries (iso, name)
SELECT 'EC' AS iso, 'Ecuador' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'EC'
    AND c.name = 'Ecuador'
);

INSERT INTO countries (iso, name)
SELECT 'EG' AS iso, 'Egypt' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'EG'
    AND c.name = 'Egypt'
);

INSERT INTO countries (iso, name)
SELECT 'SV' AS iso, 'El Salvador' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SV'
    AND c.name = 'El Salvador'
);

INSERT INTO countries (iso, name)
SELECT 'GQ' AS iso, 'Equatorial Guinea' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GQ'
    AND c.name = 'Equatorial Guinea'
);

INSERT INTO countries (iso, name)
SELECT 'ER' AS iso, 'Eritrea' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ER'
    AND c.name = 'Eritrea'
);

INSERT INTO countries (iso, name)
SELECT 'EE' AS iso, 'Estonia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'EE'
    AND c.name = 'Estonia'
);

INSERT INTO countries (iso, name)
SELECT 'ET' AS iso, 'Ethiopia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ET'
    AND c.name = 'Ethiopia'
);

INSERT INTO countries (iso, name)
SELECT 'FK' AS iso, 'Falkland Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'FK'
    AND c.name = 'Falkland Islands'
);

INSERT INTO countries (iso, name)
SELECT 'FO' AS iso, 'Faroe Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'FO'
    AND c.name = 'Faroe Islands'
);

INSERT INTO countries (iso, name)
SELECT 'FJ' AS iso, 'Fiji' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'FJ'
    AND c.name = 'Fiji'
);

INSERT INTO countries (iso, name)
SELECT 'FI' AS iso, 'Finland' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'FI'
    AND c.name = 'Finland'
);

INSERT INTO countries (iso, name)
SELECT 'FR' AS iso, 'France' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'FR'
    AND c.name = 'France'
);

INSERT INTO countries (iso, name)
SELECT 'GF' AS iso, 'French Guiana' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GF'
    AND c.name = 'French Guiana'
);

INSERT INTO countries (iso, name)
SELECT 'PF' AS iso, 'French Polynesia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PF'
    AND c.name = 'French Polynesia'
);

INSERT INTO countries (iso, name)
SELECT 'TF' AS iso, 'French Southern Territories' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TF'
    AND c.name = 'French Southern Territories'
);

INSERT INTO countries (iso, name)
SELECT 'GA' AS iso, 'Gabon' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GA'
    AND c.name = 'Gabon'
);

INSERT INTO countries (iso, name)
SELECT 'GM' AS iso, 'Gambia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GM'
    AND c.name = 'Gambia'
);

INSERT INTO countries (iso, name)
SELECT 'GE' AS iso, 'Georgia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GE'
    AND c.name = 'Georgia'
);

INSERT INTO countries (iso, name)
SELECT 'DE' AS iso, 'Germany' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'DE'
    AND c.name = 'Germany'
);

INSERT INTO countries (iso, name)
SELECT 'GH' AS iso, 'Ghana' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GH'
    AND c.name = 'Ghana'
);

INSERT INTO countries (iso, name)
SELECT 'GI' AS iso, 'Gibraltar' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GI'
    AND c.name = 'Gibraltar'
);

INSERT INTO countries (iso, name)
SELECT 'GR' AS iso, 'Greece' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GR'
    AND c.name = 'Greece'
);

INSERT INTO countries (iso, name)
SELECT 'GL' AS iso, 'Greenland' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GL'
    AND c.name = 'Greenland'
);

INSERT INTO countries (iso, name)
SELECT 'GD' AS iso, 'Grenada' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GD'
    AND c.name = 'Grenada'
);

INSERT INTO countries (iso, name)
SELECT 'GP' AS iso, 'Guadeloupe' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GP'
    AND c.name = 'Guadeloupe'
);

INSERT INTO countries (iso, name)
SELECT 'GU' AS iso, 'Guam' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GU'
    AND c.name = 'Guam'
);

INSERT INTO countries (iso, name)
SELECT 'GT' AS iso, 'Guatemala' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GT'
    AND c.name = 'Guatemala'
);

INSERT INTO countries (iso, name)
SELECT 'GG' AS iso, 'Guernsey' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GG'
    AND c.name = 'Guernsey'
);

INSERT INTO countries (iso, name)
SELECT 'GN' AS iso, 'Guinea' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GN'
    AND c.name = 'Guinea'
);

INSERT INTO countries (iso, name)
SELECT 'GW' AS iso, 'Guinea-Bissau' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GW'
    AND c.name = 'Guinea-Bissau'
);

INSERT INTO countries (iso, name)
SELECT 'GY' AS iso, 'Guyana' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GY'
    AND c.name = 'Guyana'
);

INSERT INTO countries (iso, name)
SELECT 'HT' AS iso, 'Haiti' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'HT'
    AND c.name = 'Haiti'
);

INSERT INTO countries (iso, name)
SELECT 'HM' AS iso, 'Heard and McDonald Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'HM'
    AND c.name = 'Heard and McDonald Islands'
);

INSERT INTO countries (iso, name)
SELECT 'HN' AS iso, 'Honduras' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'HN'
    AND c.name = 'Honduras'
);

INSERT INTO countries (iso, name)
SELECT 'HK' AS iso, 'Hong Kong' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'HK'
    AND c.name = 'Hong Kong'
);

INSERT INTO countries (iso, name)
SELECT 'HU' AS iso, 'Hungary' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'HU'
    AND c.name = 'Hungary'
);

INSERT INTO countries (iso, name)
SELECT 'IS' AS iso, 'Iceland' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IS'
    AND c.name = 'Iceland'
);

INSERT INTO countries (iso, name)
SELECT 'IN' AS iso, 'India' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IN'
    AND c.name = 'India'
);

INSERT INTO countries (iso, name)
SELECT 'ID' AS iso, 'Indonesia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ID'
    AND c.name = 'Indonesia'
);

INSERT INTO countries (iso, name)
SELECT 'IR' AS iso, 'Iran' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IR'
    AND c.name = 'Iran'
);

INSERT INTO countries (iso, name)
SELECT 'IQ' AS iso, 'Iraq' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IQ'
    AND c.name = 'Iraq'
);

INSERT INTO countries (iso, name)
SELECT 'IE' AS iso, 'Ireland' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IE'
    AND c.name = 'Ireland'
);

INSERT INTO countries (iso, name)
SELECT 'IM' AS iso, 'Isle of Man' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IM'
    AND c.name = 'Isle of Man'
);

INSERT INTO countries (iso, name)
SELECT 'IL' AS iso, 'Israel' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IL'
    AND c.name = 'Israel'
);

INSERT INTO countries (iso, name)
SELECT 'IT' AS iso, 'Italy' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'IT'
    AND c.name = 'Italy'
);

INSERT INTO countries (iso, name)
SELECT 'JM' AS iso, 'Jamaica' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'JM'
    AND c.name = 'Jamaica'
);

INSERT INTO countries (iso, name)
SELECT 'JP' AS iso, 'Japan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'JP'
    AND c.name = 'Japan'
);

INSERT INTO countries (iso, name)
SELECT 'JE' AS iso, 'Jersey' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'JE'
    AND c.name = 'Jersey'
);

INSERT INTO countries (iso, name)
SELECT 'JO' AS iso, 'Jordan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'JO'
    AND c.name = 'Jordan'
);

INSERT INTO countries (iso, name)
SELECT 'KZ' AS iso, 'Kazakhstan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KZ'
    AND c.name = 'Kazakhstan'
);

INSERT INTO countries (iso, name)
SELECT 'KE' AS iso, 'Kenya' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KE'
    AND c.name = 'Kenya'
);

INSERT INTO countries (iso, name)
SELECT 'KI' AS iso, 'Kiribati' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KI'
    AND c.name = 'Kiribati'
);

INSERT INTO countries (iso, name)
SELECT 'KW' AS iso, 'Kuwait' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KW'
    AND c.name = 'Kuwait'
);

INSERT INTO countries (iso, name)
SELECT 'KG' AS iso, 'Kyrgyzstan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KG'
    AND c.name = 'Kyrgyzstan'
);

INSERT INTO countries (iso, name)
SELECT 'LA' AS iso, 'Lao People''s Democratic Republic' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LA'
    AND c.name = 'Lao People''s Democratic Republic'
);

INSERT INTO countries (iso, name)
SELECT 'LV' AS iso, 'Latvia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LV'
    AND c.name = 'Latvia'
);

INSERT INTO countries (iso, name)
SELECT 'LB' AS iso, 'Lebanon' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LB'
    AND c.name = 'Lebanon'
);

INSERT INTO countries (iso, name)
SELECT 'LS' AS iso, 'Lesotho' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LS'
    AND c.name = 'Lesotho'
);

INSERT INTO countries (iso, name)
SELECT 'LR' AS iso, 'Liberia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LR'
    AND c.name = 'Liberia'
);

INSERT INTO countries (iso, name)
SELECT 'LY' AS iso, 'Libya' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LY'
    AND c.name = 'Libya'
);

INSERT INTO countries (iso, name)
SELECT 'LI' AS iso, 'Liechtenstein' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LI'
    AND c.name = 'Liechtenstein'
);

INSERT INTO countries (iso, name)
SELECT 'LT' AS iso, 'Lithuania' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LT'
    AND c.name = 'Lithuania'
);

INSERT INTO countries (iso, name)
SELECT 'LU' AS iso, 'Luxembourg' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LU'
    AND c.name = 'Luxembourg'
);

INSERT INTO countries (iso, name)
SELECT 'MO' AS iso, 'Macau' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MO'
    AND c.name = 'Macau'
);

INSERT INTO countries (iso, name)
SELECT 'MK' AS iso, 'Macedonia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MK'
    AND c.name = 'Macedonia'
);

INSERT INTO countries (iso, name)
SELECT 'MG' AS iso, 'Madagascar' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MG'
    AND c.name = 'Madagascar'
);

INSERT INTO countries (iso, name)
SELECT 'MW' AS iso, 'Malawi' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MW'
    AND c.name = 'Malawi'
);

INSERT INTO countries (iso, name)
SELECT 'MY' AS iso, 'Malaysia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MY'
    AND c.name = 'Malaysia'
);

INSERT INTO countries (iso, name)
SELECT 'MV' AS iso, 'Maldives' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MV'
    AND c.name = 'Maldives'
);

INSERT INTO countries (iso, name)
SELECT 'ML' AS iso, 'Mali' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ML'
    AND c.name = 'Mali'
);

INSERT INTO countries (iso, name)
SELECT 'MT' AS iso, 'Malta' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MT'
    AND c.name = 'Malta'
);

INSERT INTO countries (iso, name)
SELECT 'MH' AS iso, 'Marshall Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MH'
    AND c.name = 'Marshall Islands'
);

INSERT INTO countries (iso, name)
SELECT 'MQ' AS iso, 'Martinique' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MQ'
    AND c.name = 'Martinique'
);

INSERT INTO countries (iso, name)
SELECT 'MR' AS iso, 'Mauritania' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MR'
    AND c.name = 'Mauritania'
);

INSERT INTO countries (iso, name)
SELECT 'MU' AS iso, 'Mauritius' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MU'
    AND c.name = 'Mauritius'
);

INSERT INTO countries (iso, name)
SELECT 'YT' AS iso, 'Mayotte' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'YT'
    AND c.name = 'Mayotte'
);

INSERT INTO countries (iso, name)
SELECT 'MX' AS iso, 'Mexico' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MX'
    AND c.name = 'Mexico'
);

INSERT INTO countries (iso, name)
SELECT 'FM' AS iso, 'Micronesia, Federated States of' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'FM'
    AND c.name = 'Micronesia, Federated States of'
);

INSERT INTO countries (iso, name)
SELECT 'MD' AS iso, 'Moldova' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MD'
    AND c.name = 'Moldova'
);

INSERT INTO countries (iso, name)
SELECT 'MC' AS iso, 'Monaco' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MC'
    AND c.name = 'Monaco'
);

INSERT INTO countries (iso, name)
SELECT 'MN' AS iso, 'Mongolia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MN'
    AND c.name = 'Mongolia'
);

INSERT INTO countries (iso, name)
SELECT 'ME' AS iso, 'Montenegro' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ME'
    AND c.name = 'Montenegro'
);

INSERT INTO countries (iso, name)
SELECT 'MS' AS iso, 'Montserrat' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MS'
    AND c.name = 'Montserrat'
);

INSERT INTO countries (iso, name)
SELECT 'MA' AS iso, 'Morocco' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MA'
    AND c.name = 'Morocco'
);

INSERT INTO countries (iso, name)
SELECT 'MZ' AS iso, 'Mozambique' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MZ'
    AND c.name = 'Mozambique'
);

INSERT INTO countries (iso, name)
SELECT 'MM' AS iso, 'Myanmar' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MM'
    AND c.name = 'Myanmar'
);

INSERT INTO countries (iso, name)
SELECT 'NA' AS iso, 'Namibia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NA'
    AND c.name = 'Namibia'
);

INSERT INTO countries (iso, name)
SELECT 'NR' AS iso, 'Nauru' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NR'
    AND c.name = 'Nauru'
);

INSERT INTO countries (iso, name)
SELECT 'NP' AS iso, 'Nepal' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NP'
    AND c.name = 'Nepal'
);

INSERT INTO countries (iso, name)
SELECT 'NC' AS iso, 'New Caledonia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NC'
    AND c.name = 'New Caledonia'
);

INSERT INTO countries (iso, name)
SELECT 'NZ' AS iso, 'New Zealand' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NZ'
    AND c.name = 'New Zealand'
);

INSERT INTO countries (iso, name)
SELECT 'NI' AS iso, 'Nicaragua' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NI'
    AND c.name = 'Nicaragua'
);

INSERT INTO countries (iso, name)
SELECT 'NE' AS iso, 'Niger' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NE'
    AND c.name = 'Niger'
);

INSERT INTO countries (iso, name)
SELECT 'NG' AS iso, 'Nigeria' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NG'
    AND c.name = 'Nigeria'
);

INSERT INTO countries (iso, name)
SELECT 'NU' AS iso, 'Niue' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NU'
    AND c.name = 'Niue'
);

INSERT INTO countries (iso, name)
SELECT 'NF' AS iso, 'Norfolk Island' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NF'
    AND c.name = 'Norfolk Island'
);

INSERT INTO countries (iso, name)
SELECT 'MP' AS iso, 'Northern Mariana Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MP'
    AND c.name = 'Northern Mariana Islands'
);

INSERT INTO countries (iso, name)
SELECT 'KP' AS iso, 'North Korea' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KP'
    AND c.name = 'North Korea'
);

INSERT INTO countries (iso, name)
SELECT 'NO' AS iso, 'Norway' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NO'
    AND c.name = 'Norway'
);

INSERT INTO countries (iso, name)
SELECT 'OM' AS iso, 'Oman' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'OM'
    AND c.name = 'Oman'
);

INSERT INTO countries (iso, name)
SELECT 'PK' AS iso, 'Pakistan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PK'
    AND c.name = 'Pakistan'
);

INSERT INTO countries (iso, name)
SELECT 'PW' AS iso, 'Palau' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PW'
    AND c.name = 'Palau'
);

INSERT INTO countries (iso, name)
SELECT 'PS' AS iso, 'Palestine, State of' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PS'
    AND c.name = 'Palestine, State of'
);

INSERT INTO countries (iso, name)
SELECT 'PA' AS iso, 'Panama' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PA'
    AND c.name = 'Panama'
);

INSERT INTO countries (iso, name)
SELECT 'PG' AS iso, 'Papua New Guinea' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PG'
    AND c.name = 'Papua New Guinea'
);

INSERT INTO countries (iso, name)
SELECT 'PY' AS iso, 'Paraguay' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PY'
    AND c.name = 'Paraguay'
);

INSERT INTO countries (iso, name)
SELECT 'PE' AS iso, 'Peru' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PE'
    AND c.name = 'Peru'
);

INSERT INTO countries (iso, name)
SELECT 'PH' AS iso, 'Philippines' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PH'
    AND c.name = 'Philippines'
);

INSERT INTO countries (iso, name)
SELECT 'PN' AS iso, 'Pitcairn' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PN'
    AND c.name = 'Pitcairn'
);

INSERT INTO countries (iso, name)
SELECT 'PL' AS iso, 'Poland' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PL'
    AND c.name = 'Poland'
);

INSERT INTO countries (iso, name)
SELECT 'PT' AS iso, 'Portugal' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PT'
    AND c.name = 'Portugal'
);

INSERT INTO countries (iso, name)
SELECT 'PR' AS iso, 'Puerto Rico' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PR'
    AND c.name = 'Puerto Rico'
);

INSERT INTO countries (iso, name)
SELECT 'QA' AS iso, 'Qatar' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'QA'
    AND c.name = 'Qatar'
);

INSERT INTO countries (iso, name)
SELECT 'RE' AS iso, 'Réunion' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'RE'
    AND c.name = 'Réunion'
);

INSERT INTO countries (iso, name)
SELECT 'RO' AS iso, 'Romania' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'RO'
    AND c.name = 'Romania'
);

INSERT INTO countries (iso, name)
SELECT 'RU' AS iso, 'Russian Federation' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'RU'
    AND c.name = 'Russian Federation'
);

INSERT INTO countries (iso, name)
SELECT 'RW' AS iso, 'Rwanda' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'RW'
    AND c.name = 'Rwanda'
);

INSERT INTO countries (iso, name)
SELECT 'BL' AS iso, 'Saint Barthélemy' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'BL'
    AND c.name = 'Saint Barthélemy'
);

INSERT INTO countries (iso, name)
SELECT 'SH' AS iso, 'Saint Helena' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SH'
    AND c.name = 'Saint Helena'
);

INSERT INTO countries (iso, name)
SELECT 'KN' AS iso, 'Saint Kitts and Nevis' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KN'
    AND c.name = 'Saint Kitts and Nevis'
);

INSERT INTO countries (iso, name)
SELECT 'LC' AS iso, 'Saint Lucia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LC'
    AND c.name = 'Saint Lucia'
);

INSERT INTO countries (iso, name)
SELECT 'MF' AS iso, 'Saint-Martin (France)' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'MF'
    AND c.name = 'Saint-Martin (France)'
);

INSERT INTO countries (iso, name)
SELECT 'VC' AS iso, 'Saint Vincent and the Grenadines' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'VC'
    AND c.name = 'Saint Vincent and the Grenadines'
);

INSERT INTO countries (iso, name)
SELECT 'WS' AS iso, 'Samoa' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'WS'
    AND c.name = 'Samoa'
);

INSERT INTO countries (iso, name)
SELECT 'SM' AS iso, 'San Marino' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SM'
    AND c.name = 'San Marino'
);

INSERT INTO countries (iso, name)
SELECT 'ST' AS iso, 'Sao Tome and Principe' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ST'
    AND c.name = 'Sao Tome and Principe'
);

INSERT INTO countries (iso, name)
SELECT 'SA' AS iso, 'Saudi Arabia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SA'
    AND c.name = 'Saudi Arabia'
);

INSERT INTO countries (iso, name)
SELECT 'SN' AS iso, 'Senegal' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SN'
    AND c.name = 'Senegal'
);

INSERT INTO countries (iso, name)
SELECT 'RS' AS iso, 'Serbia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'RS'
    AND c.name = 'Serbia'
);

INSERT INTO countries (iso, name)
SELECT 'SC' AS iso, 'Seychelles' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SC'
    AND c.name = 'Seychelles'
);

INSERT INTO countries (iso, name)
SELECT 'SL' AS iso, 'Sierra Leone' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SL'
    AND c.name = 'Sierra Leone'
);

INSERT INTO countries (iso, name)
SELECT 'SG' AS iso, 'Singapore' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SG'
    AND c.name = 'Singapore'
);

INSERT INTO countries (iso, name)
SELECT 'SX' AS iso, 'Sint Maarten (Dutch part)' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SX'
    AND c.name = 'Sint Maarten (Dutch part)'
);

INSERT INTO countries (iso, name)
SELECT 'SK' AS iso, 'Slovakia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SK'
    AND c.name = 'Slovakia'
);

INSERT INTO countries (iso, name)
SELECT 'SI' AS iso, 'Slovenia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SI'
    AND c.name = 'Slovenia'
);

INSERT INTO countries (iso, name)
SELECT 'SB' AS iso, 'Solomon Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SB'
    AND c.name = 'Solomon Islands'
);

INSERT INTO countries (iso, name)
SELECT 'SO' AS iso, 'Somalia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SO'
    AND c.name = 'Somalia'
);

INSERT INTO countries (iso, name)
SELECT 'ZA' AS iso, 'South Africa' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ZA'
    AND c.name = 'South Africa'
);

INSERT INTO countries (iso, name)
SELECT 'GS' AS iso, 'South Georgia and the South Sandwich Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GS'
    AND c.name = 'South Georgia and the South Sandwich Islands'
);

INSERT INTO countries (iso, name)
SELECT 'KR' AS iso, 'South Korea' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'KR'
    AND c.name = 'South Korea'
);

INSERT INTO countries (iso, name)
SELECT 'SS' AS iso, 'South Sudan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SS'
    AND c.name = 'South Sudan'
);

INSERT INTO countries (iso, name)
SELECT 'ES' AS iso, 'Spain' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ES'
    AND c.name = 'Spain'
);

INSERT INTO countries (iso, name)
SELECT 'LK' AS iso, 'Sri Lanka' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'LK'
    AND c.name = 'Sri Lanka'
);

INSERT INTO countries (iso, name)
SELECT 'PM' AS iso, 'St. Pierre and Miquelon' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'PM'
    AND c.name = 'St. Pierre and Miquelon'
);

INSERT INTO countries (iso, name)
SELECT 'SD' AS iso, 'Sudan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SD'
    AND c.name = 'Sudan'
);

INSERT INTO countries (iso, name)
SELECT 'SR' AS iso, 'Suriname' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SR'
    AND c.name = 'Suriname'
);

INSERT INTO countries (iso, name)
SELECT 'SJ' AS iso, 'Svalbard and Jan Mayen Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SJ'
    AND c.name = 'Svalbard and Jan Mayen Islands'
);

INSERT INTO countries (iso, name)
SELECT 'SZ' AS iso, 'Swaziland' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SZ'
    AND c.name = 'Swaziland'
);

INSERT INTO countries (iso, name)
SELECT 'SE' AS iso, 'Sweden' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SE'
    AND c.name = 'Sweden'
);

INSERT INTO countries (iso, name)
SELECT 'CH' AS iso, 'Switzerland' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'CH'
    AND c.name = 'Switzerland'
);

INSERT INTO countries (iso, name)
SELECT 'SY' AS iso, 'Syria' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'SY'
    AND c.name = 'Syria'
);

INSERT INTO countries (iso, name)
SELECT 'TW' AS iso, 'Taiwan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TW'
    AND c.name = 'Taiwan'
);

INSERT INTO countries (iso, name)
SELECT 'TJ' AS iso, 'Tajikistan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TJ'
    AND c.name = 'Tajikistan'
);

INSERT INTO countries (iso, name)
SELECT 'TZ' AS iso, 'Tanzania' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TZ'
    AND c.name = 'Tanzania'
);

INSERT INTO countries (iso, name)
SELECT 'TH' AS iso, 'Thailand' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TH'
    AND c.name = 'Thailand'
);

INSERT INTO countries (iso, name)
SELECT 'NL' AS iso, 'The Netherlands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'NL'
    AND c.name = 'The Netherlands'
);

INSERT INTO countries (iso, name)
SELECT 'TL' AS iso, 'Timor-Leste' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TL'
    AND c.name = 'Timor-Leste'
);

INSERT INTO countries (iso, name)
SELECT 'TG' AS iso, 'Togo' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TG'
    AND c.name = 'Togo'
);

INSERT INTO countries (iso, name)
SELECT 'TK' AS iso, 'Tokelau' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TK'
    AND c.name = 'Tokelau'
);

INSERT INTO countries (iso, name)
SELECT 'TO' AS iso, 'Tonga' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TO'
    AND c.name = 'Tonga'
);

INSERT INTO countries (iso, name)
SELECT 'TT' AS iso, 'Trinidad and Tobago' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TT'
    AND c.name = 'Trinidad and Tobago'
);

INSERT INTO countries (iso, name)
SELECT 'TN' AS iso, 'Tunisia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TN'
    AND c.name = 'Tunisia'
);

INSERT INTO countries (iso, name)
SELECT 'TR' AS iso, 'Turkey' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TR'
    AND c.name = 'Turkey'
);

INSERT INTO countries (iso, name)
SELECT 'TM' AS iso, 'Turkmenistan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TM'
    AND c.name = 'Turkmenistan'
);

INSERT INTO countries (iso, name)
SELECT 'TC' AS iso, 'Turks and Caicos Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TC'
    AND c.name = 'Turks and Caicos Islands'
);

INSERT INTO countries (iso, name)
SELECT 'TV' AS iso, 'Tuvalu' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'TV'
    AND c.name = 'Tuvalu'
);

INSERT INTO countries (iso, name)
SELECT 'UG' AS iso, 'Uganda' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'UG'
    AND c.name = 'Uganda'
);

INSERT INTO countries (iso, name)
SELECT 'UA' AS iso, 'Ukraine' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'UA'
    AND c.name = 'Ukraine'
);

INSERT INTO countries (iso, name)
SELECT 'AE' AS iso, 'United Arab Emirates' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'AE'
    AND c.name = 'United Arab Emirates'
);

INSERT INTO countries (iso, name)
SELECT 'GB' AS iso, 'United Kingdom' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'GB'
    AND c.name = 'United Kingdom'
);

INSERT INTO countries (iso, name)
SELECT 'US' AS iso, 'United States' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'US'
    AND c.name = 'United States'
);

INSERT INTO countries (iso, name)
SELECT 'UM' AS iso, 'United States Minor Outlying Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'UM'
    AND c.name = 'United States Minor Outlying Islands'
);

INSERT INTO countries (iso, name)
SELECT 'UY' AS iso, 'Uruguay' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'UY'
    AND c.name = 'Uruguay'
);

INSERT INTO countries (iso, name)
SELECT 'UZ' AS iso, 'Uzbekistan' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'UZ'
    AND c.name = 'Uzbekistan'
);

INSERT INTO countries (iso, name)
SELECT 'VU' AS iso, 'Vanuatu' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'VU'
    AND c.name = 'Vanuatu'
);

INSERT INTO countries (iso, name)
SELECT 'VA' AS iso, 'Vatican' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'VA'
    AND c.name = 'Vatican'
);

INSERT INTO countries (iso, name)
SELECT 'VE' AS iso, 'Venezuela' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'VE'
    AND c.name = 'Venezuela'
);

INSERT INTO countries (iso, name)
SELECT 'VN' AS iso, 'Vietnam' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'VN'
    AND c.name = 'Vietnam'
);

INSERT INTO countries (iso, name)
SELECT 'VG' AS iso, 'Virgin Islands (British)' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'VG'
    AND c.name = 'Virgin Islands (British)'
);

INSERT INTO countries (iso, name)
SELECT 'VI' AS iso, 'Virgin Islands (U.S.)' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'VI'
    AND c.name = 'Virgin Islands (U.S.)'
);

INSERT INTO countries (iso, name)
SELECT 'WF' AS iso, 'Wallis and Futuna Islands' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'WF'
    AND c.name = 'Wallis and Futuna Islands'
);

INSERT INTO countries (iso, name)
SELECT 'EH' AS iso, 'Western Sahara' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'EH'
    AND c.name = 'Western Sahara'
);

INSERT INTO countries (iso, name)
SELECT 'YE' AS iso, 'Yemen' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'YE'
    AND c.name = 'Yemen'
);

INSERT INTO countries (iso, name)
SELECT 'ZM' AS iso, 'Zambia' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ZM'
    AND c.name = 'Zambia'
);

INSERT INTO countries (iso, name)
SELECT 'ZW' AS iso, 'Zimbabwe' AS name
WHERE NOT EXISTS (
    SELECT * FROM countries c
    WHERE c.iso = 'ZW'
    AND c.name = 'Zimbabwe'
);



INSERT INTO categories (id, display_name)
SELECT 1 AS id, 'Default' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 1
    AND c.display_name = 'Default'
);

INSERT INTO categories (id, display_name)
SELECT 2 AS id, 'Communication' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 2
    AND c.display_name = 'Communication'
);

INSERT INTO categories (id, display_name)
SELECT 3 AS id, 'Media' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 3
    AND c.display_name = 'Media'
);

INSERT INTO categories (id, display_name)
SELECT 4 AS id, 'Messaging' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 4
    AND c.display_name = 'Messaging'
);

INSERT INTO categories (id, display_name)
SELECT 5 AS id, 'Navigation' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 5
    AND c.display_name = 'Navigation'
);

INSERT INTO categories (id, display_name)
SELECT 6 AS id, 'Information' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 6
    AND c.display_name = 'Information'
);

INSERT INTO categories (id, display_name)
SELECT 7 AS id, 'Social' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 7
    AND c.display_name = 'Social'
);

INSERT INTO categories (id, display_name)
SELECT 8 AS id, 'Background Process' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 8
    AND c.display_name = 'Background Process'
);

INSERT INTO categories (id, display_name)
SELECT 9 AS id, 'Testing' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 9
    AND c.display_name = 'Testing'
);

INSERT INTO categories (id, display_name)
SELECT 10 AS id, 'System' AS display_name
WHERE NOT EXISTS (
    SELECT * FROM categories c
    WHERE c.id = 10
    AND c.display_name = 'System'
);


INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Base-4' AS property_name, null AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Base-4'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Location-1' AS property_name, 'Location' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Location-1'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Notifications' AS property_name, 'Notifications' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Notifications'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'DrivingCharacteristics-3' AS property_name, 'DrivingCharacteristics' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'DrivingCharacteristics-3'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'VehicleInfo-3' AS property_name, 'VehicleInfo' AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'VehicleInfo-3'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'PropriataryData-1' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'PropriataryData-1'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'PropriataryData-2' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'PropriataryData-2'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'ProprietaryData-3' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'ProprietaryData-3'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'RemoteControl' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'RemoteControl'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Emergency-1' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Emergency-1'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Navigation-1' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Navigation-1'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'Base-6' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'Base-6'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'OnKeyboardInputOnlyGroup' AS property_name, null AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'OnKeyboardInputOnlyGroup'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'OnTouchEventOnlyGroup' AS property_name, null AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'OnTouchEventOnlyGroup'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'DiagnosticMessageOnly' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'DiagnosticMessageOnly'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, is_pre_data_consent, is_device, status)
SELECT 'DataConsent-2' AS property_name, 'DataConsent' AS user_consent_prompt, 'false' AS is_default, 'false' AS is_pre_data_consent, 'true' AS is_device, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'DataConsent-2'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, is_pre_data_consent, is_device, status)
SELECT 'BaseBeforeDataConsent' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'true' AS is_pre_data_consent, 'false' AS is_device, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'BaseBeforeDataConsent'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'SendLocation' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'SendLocation'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'WayPoints' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'WayPoints'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'BackgroundAPT' AS property_name, null AS user_consent_prompt, 'false' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'BackgroundAPT'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'DialNumberOnlyGroup' AS property_name, null AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'DialNumberOnlyGroup'
);

INSERT INTO function_group_info (property_name, user_consent_prompt, is_default, status)
SELECT 'HapticGroup' AS property_name, null AS user_consent_prompt, 'true' AS is_default, 'PRODUCTION' AS status
WHERE NOT EXISTS (
    SELECT * FROM function_group_info fgi
    WHERE fgi.property_name = 'HapticGroup'
);

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetSystemCapability' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetSystemCapability' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetSystemCapability' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetSystemCapability' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformInteraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformInteraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ScrollableMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetMediaClockTimer' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetMediaClockTimer' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetMediaClockTimer' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Slider' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Speak' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Speak' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-4';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Notifications';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Notifications';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Notifications';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'PropriataryData-2';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetDTCs' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ReadDID' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'ProprietaryData-3';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ButtonPress' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ButtonPress' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ButtonPress' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetInteriorVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetInteriorVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetInteriorVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetInteriorVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetInteriorVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetInteriorVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnInteriorVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnInteriorVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnInteriorVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

-- START ADD 9/11/2018
INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnRCStatus' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnRCStatus' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnRCStatus' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnRCStatus' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'RemoteControl';
-- END ADD 9/11/2018

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AlertManeuver' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AlertManeuver' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AlertManeuver' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowConstantTBT' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowConstantTBT' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ShowConstantTBT' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UpdateTurnList' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UpdateTurnList' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UpdateTurnList' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Navigation-1';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'AddSubMenu' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Alert' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'CreateInteractionChoiceSet' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteInteractionChoiceSet' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteSubMenu' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GenericResponse' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonEvent' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnButtonPress' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnCommand' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnDriverDistraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTBTClientState' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTBTClientState' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTBTClientState' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformInteraction' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformInteraction' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ScrollableMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetMediaClockTimer' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Show' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Slider' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Speak' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'Speak' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeButton' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeButton' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'Base-6';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnKeyboardInput' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'OnKeyboardInputOnlyGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTouchEvent' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'OnTouchEventOnlyGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'DiagnosticMessageOnly';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DiagnosticMessageOnly';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DiagnosticMessage' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DiagnosticMessageOnly';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ChangeRegistration' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DeleteFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ListFiles' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAppInterfaceUnregistered' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnEncodedSyncPData' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHashChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnHMIStatus' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnLanguageChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnPermissionsChange' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnSystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PutFile' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'RegisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'ResetGlobalProperties' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetGlobalProperties' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetAppIcon' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SetDisplayLayout' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SystemRequest' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnregisterAppInterface' AS permission_name, 'NONE' AS hmi_level
FROM function_group_info
WHERE property_name = 'BaseBeforeDataConsent';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SendLocation' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'SendLocation';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SendLocation' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'SendLocation';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SendLocation' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'SendLocation';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetWayPoints' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetWayPoints' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'GetWayPoints' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeWayPoints' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeWayPoints' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SubscribeWayPoints' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeWayPoints' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeWayPoints' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'UnsubscribeWayPoints' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnWayPointChange' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnWayPointChange' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnWayPointChange' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'WayPoints';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'EndAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'BACKGROUND' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'PerformAudioPassThru' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'BackgroundAPT';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DialNumber' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'DialNumberOnlyGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'DialNumber' AS permission_name, 'LIMITED' AS hmi_level
FROM function_group_info
WHERE property_name = 'DialNumberOnlyGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'OnTouchEvent' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'HapticGroup';

INSERT INTO function_group_hmi_levels(function_group_id, permission_name, hmi_level)
SELECT id AS function_group_id, 'SendHapticData' AS permission_name, 'FULL' AS hmi_level
FROM function_group_info
WHERE property_name = 'HapticGroup';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'gps' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'speed' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'gps' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'speed' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'gps' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'speed' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'gps' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'speed' AS parameter
FROM function_group_info
WHERE property_name = 'Location-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'accPedalPosition' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'beltStatus' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'driverBraking' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'myKey' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'prndl' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'rpm' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'steeringWheelAngle' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'accPedalPosition' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'beltStatus' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'driverBraking' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'myKey' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'prndl' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'rpm' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'steeringWheelAngle' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'accPedalPosition' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'beltStatus' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'driverBraking' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'myKey' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'prndl' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'rpm' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'steeringWheelAngle' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'accPedalPosition' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'beltStatus' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'driverBraking' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'myKey' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'prndl' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'rpm' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'steeringWheelAngle' AS parameter
FROM function_group_info
WHERE property_name = 'DrivingCharacteristics-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'bodyInformation' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'deviceStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'engineTorque' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'externalTemperature' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'fuelLevel' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'fuelLevel_State' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'headLampStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'instantFuelConsumption' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'odometer' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'tirePressure' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'vin' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'wiperStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'bodyInformation' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'deviceStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'engineTorque' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'externalTemperature' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'fuelLevel' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'fuelLevel_State' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'headLampStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'instantFuelConsumption' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'odometer' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'tirePressure' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'vin' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'wiperStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'bodyInformation' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'deviceStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'engineTorque' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'externalTemperature' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'fuelLevel' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'fuelLevel_State' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'headLampStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'instantFuelConsumption' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'odometer' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'tirePressure' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'wiperStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'bodyInformation' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'deviceStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'engineTorque' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'externalTemperature' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'fuelLevel' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'fuelLevel_State' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'headLampStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'instantFuelConsumption' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'odometer' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'tirePressure' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'wiperStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'airbagStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'clusterModeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'eCallInfo' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'emergencyEvent' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'airbagStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'clusterModeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'eCallInfo' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'emergencyEvent' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'airbagStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'clusterModeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'eCallInfo' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'emergencyEvent' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'airbagStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'clusterModeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'eCallInfo' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'emergencyEvent' AS parameter
FROM function_group_info
WHERE property_name = 'Emergency-1';

-- START ADD 9/11/2018
INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'turnSignal' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'turnSignal' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'turnSignal' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'turnSignal' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'electronicParkBrakeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'electronicParkBrakeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'electronicParkBrakeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'electronicParkBrakeStatus' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'engineOilLife' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'engineOilLife' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'engineOilLife' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'engineOilLife' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'UnsubscribeVehicleData' AS rpc_name, 'fuelRange' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'SubscribeVehicleData' AS rpc_name, 'fuelRange' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'GetVehicleData' AS rpc_name, 'fuelRange' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';

INSERT INTO function_group_parameters(function_group_id, rpc_name, parameter)
SELECT id AS function_group_id, 'OnVehicleData' AS rpc_name, 'fuelRange' AS parameter
FROM function_group_info
WHERE property_name = 'VehicleInfo-3';
-- END ADD 9/11/2018
