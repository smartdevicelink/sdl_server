CREATE TABLE app_blacklist (
    "app_uuid" VARCHAR(36),
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (app_uuid)
)
WITH ( OIDS = FALSE );

DROP VIEW view_partial_app_info;

ALTER TYPE approval_status RENAME TO approval_status_temp;
CREATE TYPE approval_status AS ENUM ('PENDING', 'STAGING', 'ACCEPTED', 'LIMITED');

ALTER TABLE app_info
	ALTER COLUMN approval_status DROP DEFAULT,
	ALTER COLUMN approval_status TYPE TEXT;

UPDATE app_info 
	SET approval_status = 'LIMITED'
	WHERE approval_status = 'DENIED';
    
ALTER TABLE app_info
	ALTER COLUMN approval_status 
		SET DATA TYPE approval_status
		USING approval_status::text::approval_status,
	ALTER COLUMN approval_status SET DEFAULT 'PENDING';
DROP TYPE approval_status_temp;

CREATE OR REPLACE VIEW view_partial_app_info AS
SELECT app_uuid, approval_status, max(id) AS id
FROM app_info
GROUP BY app_uuid, approval_status;