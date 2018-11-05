# Usage and Errors
Errors and usage statistics that occur while an application is in use or are related to an application are record. The information does not contain user information and is very small as to use as little mobile data as possible. This data is sent to the Policy Server when performing a [Policy Table update](../../policy-table-update).


## Application Errors
Errors and usage statistic that occur while an application is in use or are related to an application are recorded.  The following properties are tracked in a property named after the application's ID.

| Property | Type | Description |
| -------- | ---- | ----------- |
| app_registration_language_gui | String | Language used to register the application using GUI.  |
| app_registration_language_vui | String | Language used to register the application using VUI. |
| count_of_rejected_rpcs_calls | Number |  Count of RPC calls that were rejected because access was not allowed due to a policy. |
| count_of_rejections_duplicate_name | Number | Number of times an application registration uses a name which is already registered in the current ignition cycle. |
| count_of_rejections_nickname_mismatch | Number | Number of times an app is not allowed to register because its registration does not match one of the app-specific policy nicknames. |
| count_of_removals_for_bad_behavior | Number | The module has criteria for identifying unacceptably bad application behavior. This tracks the number of times that distinction leads the module to unregister an application. |
| count_of_rfcom_limit_reached | Number | Number of times the maximum number of rfcom channels are used on a device by the application. |
| count_of_rpcs_sent_in_hmi_none | Number | Number of times an application tried to use an RPC (not unregisterAppInterface) in the HMI_NONE state. Counts the number of conflicts with the built-in/hardcoded restriction for HMI_STATE=NONE. |
| count_of_run_attempts_while_revoked | Number | Incremented when the user selects a revoked application from the HMI menu.  |
| count_of_user_selections | Number | Number of times a user selected to run the app.  Increment one when app starts via Mobile Apps Menu or VR. Increment one the first time the app leaves its default_hmi for HMI_FULL, as in the resuming app scenario. Do not increment anytime an app comes into HMI_FULL. Do not increment when cycling sources. For all 3 scenarios, both successful and unsuccessful app starts shall be counted.  |
| minutes_in_hmi_background | Number | Number of minutes the application is in the HMI_BACKGROUND state. |
| minutes_in_hmi_full | Number | Number of minutes the application is in the HMI_FULL state. |
| minutes_in_hmi_limited | Number | Number of minutes the application is in the HMI_LIMITED state. |
| minutes_in_hmi_none | Number | Number of minutes the application is in the HMI_NONE state. |



## General Errors
Some basic usage and error counts are stored in the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| count_of_iap_buffer_full | Number | Number of times the iOS accessory protocol buffer is full. |


## Example
An example of how the Usage and Error portion of a Policy Table might look.

    "usage_and_error_counts": {
        "count_of_iap_buffer_full": 1,
        "app_level": {
            "[App ID Here]": {
              "app_registration_language_gui": "en-us",
              "app_registration_language_vui": "en-us",
              "count_of_rejected_rpcs_calls": 9,
              "count_of_rejections_duplicate_name": 2,
              "count_of_rejections_nickname_mismatch": 1,
              "count_of_removals_for_bad_behavior": 6,
              "count_of_rfcom_limit_reached": 1,
              "count_of_rpcs_sent_in_hmi_none": 7,
              "count_of_run_attempts_while_revoked": 0,
              "count_of_user_selections": 7,
              "minutes_in_hmi_background": 123,
              "minutes_in_hmi_full": 123,
              "minutes_in_hmi_limited": 456,
              "minutes_in_hmi_none": 456
            }
        }
    }
