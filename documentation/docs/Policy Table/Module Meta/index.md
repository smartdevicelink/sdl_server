# Module Meta

## Language and Country
The current language and regional settings can be configured using the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| language | String | Current system language.  <a href="http://en.wikipedia.org/wiki/ISO_639-1" target="_blank">ISO 639-1</a> combined with <a href="http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_blank">ISO 3166 alpha-2</a> country code. |
| wers_country_code | String | Country code from the Ford system WERS (i.e.WAEGB). |


## Module Version
The current version of the vehicle's module should be stored in the following property.

| Property | Type | Description |
| -------- | ---- | ----------- |
| ccpu_version | String | Software version for the module running core. |


## Policy Table Update
Information about when a policy table update has last taken place is stored in the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| pt_exchanged_at_odometer_x | Number | Marks the odometer reading in kilometers at the time of the last successful policy table update. |
| pt_exchanged_x_days_after_epoch | Number | Marks the time of the last successful policy table update. |
| ignition_cycles_since_last_exchange | Number | Number of ignition cycles since the last policy table update. |



## Vehicle Data
Additional vehicle information is stored in the module meta property.

| Property | Type | Description |
| -------- | ---- | ----------- |
| vin | String | The vehicle's unique identification number. |


## Example
An example of how the Module Meta portion of a policy table might look.

    "module_meta": {
        "ccpu_version": "4.1.2.B_EB355B",
        "language": "en-us",
        "wers_country_code": "WAEGB",
        "pt_exchanged_at_odometer_x": 1903,
        "pt_exchanged_x_days_after_epoch": 46684,
        "ignition_cycles_since_last_exchange": 50,
        "vin": "1FAPP4442VH100001"
    }