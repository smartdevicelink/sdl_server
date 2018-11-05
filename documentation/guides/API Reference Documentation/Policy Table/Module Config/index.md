# Module Config
The module configuration property contains information used to configure SDL Core for use on the current vehicle.

## Notifications
There is a limit for the number of notifications that can be displayed per priority level.  The limit is instead based on notifications per minute.  You can configure these in the **notifications_per_minute_by_priority** property.  The following are the available priority levels.

| Property | Type | Description |
| -------- | ---- | ----------- |
| EMERGENCY          | Number | Number of emergency notifications that can be displayed per minute. |
| COMMUNICATION      | Number | Number of communication notifications that can be displayed per minute. |
| NAVIGATION         | Number | Number of navigation notifications that can be displayed per minute. |
| NONE               | Number | Number of notifications without a priority that can be displayed per minute. |
| NORMAL             | Number | Number of notifications with a normal priority that can be displayed per minute. |
| voiceCommunication | Number | Number of voice communication notifications that can be displayed per minute. |

<a name="Policy-Table-Update-Configurations"></a>

## Policy Table Update Configurations
Periodically changes will be made to a Policy Table, either by the Policy Server or SDL Core. This means SDL Core should check for and perform a [Policy Table update](/docs/sdl-server/policy-table-update), which synchronizes the local and Policy Server Policy Tables. You can configure when SDL Core will check using the following configurations.

| Property | Type | Description |
| -------- | ---- | ----------- |
| exchange_after_x_ignition_cycles | Number | Update Policy Table after a number of ignitions. |
| exchange_after_x_kilometers | Number | Update Policy Table after a number of kilometers traveled. |
| exchange_after_x_days | Number | Update Policy Table after a number of days.  |


## Preloaded Policy Tables
SDL Core can use a predefined Policy Table located locally on the vehicle's head unit.  This is present to initially configure SDL Core as well as to enable the storage of vehicle data before a Policy Table update has occurred.

| Property | Type | Description |
| -------- | ---- | ----------- |
| preloaded_pt | Boolean | When true, SDL Core will use the local copy of the Policy Table. |

## Policy Table Structure Configurations
The policy table's structure is determined by the following configurations.

| Property | Type | Description |
| -------- | ---- | ----------- |
| full_app_id_supported | Boolean | When true, an app's `fullAppID` will be used in the `app_policies` section as it's key. If false or omitted, the short-form `appID` will be used. |

## Server Requests
All requests made directly by SDL Core or by proxy can be configured using the following attributes.

| Property | Type | Description |
| -------- | ---- | ----------- |
| timeout_after_x_seconds | Number | Elapsed seconds until a Policy Table update request will timeout. |
| endpoints | Object | Contains a list of endpoints (see below) that may contain a default or app-specific array of server endpoints. |
| seconds_between_retries | Array | A list of seconds to wait before each retry. |

<a name="Service-Types"></a>

### Endpoints
This section is a list of URLs that are used throughout the SDL lifecycle, such as Policy Table updates, module software updates, and lock screen imagery.

| Property | Type | Description |
| -------- | ---- | ----------- |
| 0X07 | Array | A list of URLs that can be used for Policy Table updates. |
| 0X04 | Array | A list of URLs that can be used to retrieve module software updates. |
| queryAppsUrl | Array | A list of URLs that can be used to receive valid apps for querying on iOS devices. |
| lock_screen_icon_url | Array | A list of URLs to image files which can be displayed by the application on the driver's device during lockout. |

## Vehicle Information
Vehicle identification information is stored in the module configuration portion of the Policy Table.

| Property | Type | Description |
| -------- | ---- | ----------- |
| vehicle_make  | String | Manufacturer of the vehicle. |
| vehicle_model | String | Model of a vehicle. |
| vehicle_year  | String | Year the vehicle was made. |


## Example
An example of how the Module Config portion of a Policy Table might look.

    "module_config": {
        "endpoints": {
            "0x07": {
            "default": [ "http://localhost:3000/api/1/policies/proprietary" ],
          }
        },
        "exchange_after_x_ignition_cycles": 100,
        "exchange_after_x_kilometers": 1800,
        "exchange_after_x_days": 30,
        "full_app_id_supported": true,
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
        "vehicle_year": "2015"
    }

