create table if not exists policy_table_update_request
(
    id serial not null
        constraint policy_table_update_request_pk
            primary key,
    trigger_event varchar(255),
    created_ts    timestamp not null,
    updated_ts    timestamp not null
);

create table if not exists device
(
    id char(64)
    constraint device_pk
    primary key,
    carrier varchar,
    connection_type varchar,
    hardware varchar,
    os varchar,
    os_version varchar,
    created_ts timestamp,
    updated_ts timestamp
);

create table if not exists app_usage
(
    id serial not null
        constraint app_usage_pk
            primary key,
    app_id integer,
    count_of_user_selections integer,
    count_of_rejected_rpc_calls integer,
    minutes_in_hmi_background integer,
    minutes_in_hmi_full integer,
    minutes_in_hmi_limited integer,
    minutes_in_hmi_none integer,
    created_ts timestamp,
    updated_ts timestamp
);

