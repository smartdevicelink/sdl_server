# Module Config
The module configuration property contains information used to configure core for use on the current vehicle.

## Notifications
There is a limit for the number of notifications that can be displayed per priority level.  The limit is based on notifications per minute.  You can configure these in the **notifications_per_minute_by_priority** property.  The following are the available priority levels.

| Property | Type | Description |
| -------- | ---- | ----------- |
| EMERGENCY          | Number | Number of emergency notifications that can be displayed per minute. |
| COMMUNICATION      | Number | Number of communication notifications that can be displayed per minute. |
| NAVIGATION         | Number | Number of navigation notifications that can be displayed per minute. |
| NONE               | Number | Number of notifications without a priority that can be displayed per minute. |
| NORMAL             | Number | Number of notifications with a normal prioritythat can be displayed per minute. |
| voiceCommunication | Number | Number of voice communication notifications that can be displayed per minute. |


## Policy Table Update Configurations
Periodically changes will be made to a policy table, either by the server or core.  This means core should periodically perform a policy table update, which synchronizes the two tables.  You can configure when core will check using the following configurations.

| Property | Type | Description |
| -------- | ---- | ----------- |
| exchange_after_x_ignition_cycles | Number | Update policies after a number of ignitions. |
| exchange_after_x_kilometers | Number | Update policies after a number of kilometers traveled. |
| exchange_after_x_days | Number | Update policies after a number of days.  |


## Preloaded Policy Tables
SDL core can use a predefined policy table located locally on the vehicle's head unit.  This is present to initially configure core as well as to enable the storage of vehicle data before a policy update has occurred.

_// TODO:  Is this correct? _

| Property | Type | Description |
| -------- | ---- | ----------- |
| preloaded_pt | Boolean | When true, core will use the local copy of the policy table. |


## Server Requests
All requests made directly by core or by proxy can be configured using the following attributes.

| Property | Type | Description |
| -------- | ---- | ----------- |
| timeout_after_x_seconds | Number | Elapsed seconds until a policy update request will timeout. |
| endpoints | Object | Contains a list of [service types](Service Types) that may contain a default or app-specific array of server endpoints. |
| seconds_between_retries | Array | A list of seconds to wait before each retry. |


## Vehicle Information
Vehicle identification information is currently stored in the module configuration portion of the policy table.

| Property | Type | Description |
| -------- | ---- | ----------- |
| vehicle_make  | String | Manufacturer of the vehicle. |
| vehicle_model | String | Model of a vehicle. |
| vehicle_year  | String | Year the vehicle was made. |


## Example
An example of how the Module Config portion of a policy table might look.

    "module_config": {
        "endpoints": {
            "0x07": {
            "default": [ "http://policies.telematics.ford.com/api/policies" ],
          }
        },
        "exchange_after_x_ignition_cycles": 100,
        "exchange_after_x_kilometers": 1800,
        "exchange_after_x_days": 30,
        "notifications_per_minute_by_priority": {
            "EMERGENCY": 60,
            "NAVIGATION": 15,
            "voiceCommunication": 10,
            "COMMUNICATION": 6,
            "NORMAL": 4,
            "NONE": 0
        },
        "seconds_between_retries": [ 1, 5, 25, 125, 625 ],
        "timeout_after_x_seconds": 60,
        "vehicle_make": "Ford",
        "vehicle_model": "F-150",
        "vehicle_year": "2015",
    }

