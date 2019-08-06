CREATE TABLE IF NOT EXISTS policy_table_update_request
(
    id SERIAL NOT NULL
        CONSTRAINT policy_table_update_request_pk
            PRIMARY KEY,
    trigger_event VARCHAR(255),
    created_ts    TIMESTAMP,
    updated_ts    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device
(
    id CHAR(64)
    CONSTRAINT device_pk
    PRIMARY KEY,
    carrier VARCHAR(255),
    connection_type VARCHAR(255),
    hardware VARCHAR(255),
    os VARCHAR(255),
    os_version VARCHAR(255),
    created_ts TIMESTAMP,
    updated_ts TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_usage
(
    id SERIAL NOT NULL
        CONSTRAINT app_usage_pk
            PRIMARY KEY,
    app_id INTEGER,
    count_of_user_selections INTEGER,
    count_of_rejected_rpc_calls INTEGER,
    minutes_in_hmi_background INTEGER,
    minutes_in_hmi_full INTEGER,
    minutes_in_hmi_limited INTEGER,
    minutes_in_hmi_none INTEGER,
    created_ts TIMESTAMP,
    updated_ts TIMESTAMP
);

