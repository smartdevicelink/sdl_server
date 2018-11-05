# Module Meta

## Language and Country
The current language and regional settings can be configured using the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| language | String | Current system language.  <a href="http://en.wikipedia.org/wiki/ISO_639-1" target="_blank">ISO 639-1</a> combined with <a href="http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_blank">ISO 3166 alpha-2</a> country code. |


## Module Version
The current version of the vehicle's module should be stored in the following property.

| Property | Type | Description |
| -------- | ---- | ----------- |
| ccpu_version | String | Software version for the module running SDL Core. |


## Policy Table Update
Information about when a Policy Table update has last taken place is stored in the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| pt_exchanged_at_odometer_x | Number | Marks the odometer reading in kilometers at the time of the last successful Policy Table update. |
| pt_exchanged_x_days_after_epoch | Number | Marks the time of the last successful Policy Table update. |
| ignition_cycles_since_last_exchange | Number | Number of ignition cycles since the last Policy Table update. |



## Vehicle Data
Additional vehicle information is stored in the module meta property.

| Property | Type | Description |
| -------- | ---- | ----------- |
| vin | String | The vehicle's unique identification number. |


## Example
An example of how the Module Meta portion of a Policy Table might look.

    "module_meta": {
        "ccpu_version": "4.1.2.B_EB355B",
        "language": "en-us",
        "pt_exchanged_at_odometer_x": 1903,
        "pt_exchanged_x_days_after_epoch": 46684,
        "ignition_cycles_since_last_exchange": 50,
        "vin": "1FAPP4442VH100001"
    }