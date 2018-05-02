CREATE TABLE app_blacklist (
    "app_uuid" VARCHAR(36),
    "created_ts" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (app_uuid)
)
WITH ( OIDS = FALSE );
