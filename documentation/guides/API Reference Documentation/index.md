# Policy Tables Overview
Policies are rules enforced by SDL <a href="https://github.com/smartdevicelink/sdl_core" target="_blank">core</a> that configure how the system can and/or will behave.  For example, a policy could prohibit the use of an application (e.g. Flappy Bird) in a specific type of vehicle.  In general, policies are configured by an OEM (e.g. Ford, Toyota, Suzuki) and stored in their SDL <a href="https://github.com/smartdevicelink/sdl_server" target="_blank">Policy Server</a>.  Once configured, all policies for a specific vehicle can be requested in the form a <a href="http://www.json.org/" target="_blank">JSON</a> document called a Policy Table.  Policy Tables are downloaded to a vehicle's head unit where it can be enforced by SDL <a href="https://github.com/smartdevicelink/sdl_core" target="_blank">Core</a>.

## Example Policy Table
An example Policy Table is available in the <a href="https://github.com/smartdevicelink/sdl_core/blob/master/src/appMain/sdl_preloaded_pt.json" target="_blank">SDL Core</a> repository.

# Application Policies
An application's permissions and settings are stored in the **app_policies** property in a Policy Table.  The application policies are used to grant applications access to a specific set of features, such as vehicle data and/or running in the background.  Any other application related data, such as user-consents, can also be stored in application policies as well.

## Application ID
Settings for a specific application are stored in the **app_policies** object as a property named after the application's unique ID (e.g. "663645645" or any string of at most 100 characters).  The value of this property can be either an object containing properties listed below or a reference to another sibling property (e.g. "default" or "device").  In addition, a special value of "null" can be used to indicate that the application has been revoked.

<a name="Application-Property"></a>

| Application Property | Type | Description |
| -------- | ---- | ----------- |
| keep_context | Boolean | When true, allows the application to display messages even if another app enters the foreground (HMI level FULL). |
| steal_focus | Boolean | When true, allows the application to steal the foreground from another application at will. |
| priority | String | Priority level assigned to the application. |
| default_hmi | String | HMI level given to the application following a successful registration with SDL Core. |
| groups | Array of Strings | A list of functional groupings the application has access to. |
| preconsented_groups | Array of Strings | List of [functional groupings](../functional-groupings) that do not require a user consent because the consent has already been given in another place. (e.g. an application EULA) |
| RequestType | Array of Strings | List of Request Types that an app is allowed to use in a SystemRequest RPC. If omitted, all requestTypes are disallowed. If an empty array is provided, all requestTypes are allowed. |
| RequestSubType | Array of Strings | List of Request SubTypes (defined by individual OEMs) that an app is allowed to use in a SystemRequest RPC. If omitted, all requestSubTypes are disallowed. If an empty array is provided, all requestSubTypes are allowed. |
| AppHMIType | Array of Strings | List of HMI Types used to group the application into different containers in an HMI system. If omitted, all appHMITypes are allowed. |
| heart_beat_timeout_ms | String | A streaming/projection app will be automatically disconnected if no app communication occurs over this period of time (in milliseconds). |
| certificate | String | The app's encryption certificate for video streaming/projection (if applicable) |
| nicknames | Array of Strings | A list of names the application goes by. Some OEMs may require the app's name to match a value in this array in order to run. |

### Application HMI Types
An application can be categorized by an HMI type allowing the SDL-enabled head unit to understand how to appropriately handle the application.  There are several HMI types listed below.

<a name="Application-HMI-Types"></a>

| Application HMI Type | Description |
| -------------------- | ----------- |
| BACKGROUND_PROCESS |  |
| COMMUNICATION |  |
| DEFAULT |  |
| INFORMATION |  |
| MEDIA |  |
| MESSAGING |  |
| NAVIGATION |  |
| SOCIAL |  |
| SYSTEM |  |
| TESTING |  |

<a name="Application-HMI-Levels"></a>

### Application HMI Levels
An HMI Level describes the state of an application.  Resources are granted to an application based on its current state.  While some resources are granted automatically to an application in a specific HMI Level, many can be controlled by the Policy Table.

| Level | Value | Short Description |
|-------|-------|-------------------|
| Full | 0 | An application is typically in ```Full``` when it is displayed in the HMI.  In ```Full``` an application has access to the HMI supported resources, e.g. UI, VR, TTS, audio system, and etc. |
| Limited | 1 | An application is typically placed in ```Limited``` when a message or menu is displayed ```Limited``` to restrict its permissions. |
| Background | 2 | An application is typically in ```Background``` when it is not being displayed by the HMI.  When in ```Background``` an application can send RPCs according to the Policy Table rules. |
| None | 3 | When placed in ```None``` an application has no access to HMI supported resources. |

<a name="Request-Types"></a>

### Request Types

| Request Type | Description |
| ------------ | ----------- |
| HTTP |  |
| FILE_RESUME |  |
| AUTH_REQUEST |  |
| AUTH_CHALLENGE |  |
| AUTH_ACK |  |
| PROPRIETARY |  |
| QUERY_APPS |  |
| LAUNCH_APP |  |
| LOCK_SCREEN_ICON_URL |  |
| TRAFFIC_MESSAGE_CHANNEL |  |
| DRIVER_PROFILE |  |
| VOICE_SEARCH |  |
| NAVIGATION |  |
| PHONE |  |
| CLIMATE |  |
| SETTINGS |  |
| VEHICLE_DIAGNOSTICS |  |
| EMERGENCY |  |
| MEDIA |  |
| FOTA |  |
| OEM_SPECIFIC | Used for OEM defined requests, requestSubType should be used to determine how to handle this type of request. |

## Default
A default application configuration can be stored in the **app_policies** object as a property named **default**.  This property's value is an object containing any valid [application property](#Application-Property) excluding **certificate** and **nicknames**.

## Device
Permissions granted to the user's device post-DataConsent.

## Example
An example of how the Application Policy portion of a Policy Table might look.

    "app_policies": {
        "default": {
            "keep_context": true,
            "steal_focus": true,
            "priority": "NONE",
            "default_hmi": "NONE",
            "groups": [ "Base-1" ],
            "preconsented_groups": [],
            "RequestType": [],
            "memory_kb": 5,
            "watchdog_timer_ms": 55
        },
        "device": {
            "keep_context": true,
            "steal_focus": true,
            "priority": "NONE",
            "default_hmi": "NONE",
            "groups": [ "Base-2" ],
            "preconsented_groups": []
        },
        "pre_DataConsent": {
            "keep_context": true,
            "steal_focus": true,
            "priority": "NONE",
            "default_hmi": "NONE",
            "groups": [ "BaseBeforeDataConsent" ],
            "preconsented_groups": [],
            "memory_kb": 5,
            "watchdog_timer_ms": 55
        },
        "[App ID 1]": "null",
        "[App ID 2]": "default",
        "[App ID 3]": {
            "nicknames": [ "Awesome Music App" ],
            "keep_context": true,
            "steal_focus": true,
            "priority": "NONE",
            "default_hmi": "NONE",
            "groups": [ "Base-1", "VehicleInfo-1" ],
            "preconsented_groups": [],
            "RequestType": [],
            "RequestSubType": [ "Sub Type" ],
            "AppHMIType": [ "MEDIA" ],
            "memory_kb": 5,
            "watchdog_timer_ms": 55,
            "certificate": "[Your Certificate]"
        }
    }


# Consumer Friendly Messages
There are certain scenarios when SDL Core needs to display a message to the user.  Some examples are when an error occurs or an application is unauthorized.  These messages can include spoken text and text displayed to a user in multiple languages.  All of this information is stored in the **consumer_friendly_messages** property.

## Messages
All messages are given a unique name (e.g. "AppUnauthorized" or "DataConsent") and stored as an object in the **consumer_friendly_messages** object's **messages** property.

### Language
Since each message should support multiple languages, each message object will contain a property named **languages**. Language properties are named by combining the <a href="http://en.wikipedia.org/wiki/ISO_639-1" target="_blank">ISO 639-1</a> language code and the <a href="http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_blank">ISO 3166 alpha-2</a> country code.  For example, messages for **English** speaking citizens of the **United States** would be under the key **en-us**.

### Message Text
Inside each language object is the data to be displayed or spoken by the module.  The data is organized in the following properties.

| Message Text Property | Type | Description |
| -------- | ---- | ----------- |
| tts | String | Text that can be read aloud by the vehicle module. |
| line1 | String | First line of text to be displayed on the head unit. |
| line2 | String | Second line of text to be displayed on the head unit. |
| text-body | String | Body of text to be displayed on the head unit. |
| label | String |  |

## Version
The version property in the **consumer_friendly_messages** object defines the current version of all the messages.  It is used during a [Policy Table update](../../policy-table-update) to determine whether or not the consumer friendly messages need to be updated.  The version must be in the format `###.###.###`.

## Example
An example of how the Consumer Friendly Messages portion of a Policy Table might look.

    "consumer_friendly_messages": {
        "version": "001.001.015",
        "messages": {
            "AppUnauthorized": {
                "languages": {
                    "de-de": {
                        "tts": "Diese Version von %appName% ist nicht autorisiert und wird nicht mit SDL funktionieren.",
                        "line1": "nicht autorisiert"
                    },
                    "en-ie": {
                        "tts": "This version of %appName% is not authorized and will not work with SDL.",
                        "line1": "not authorized"
                    },
                    "en-us": {
                        "tts": "This version of %appName% is not authorized and will not work with SDL.",
                        "line1": "Not Authorized"
                    }
                }
            },
            "DataConsent": {
                "languages": {
                    "en-us": {
                        "tts": "To use mobile apps with SDL, SDL may use your mobile device's data plan....",
                        "line1": "Enable Mobile Apps",
                        "line2": "on SDL? (Uses Data)"
                    }
                }
            }
        }
    }


# Device Data
Information about each device that connects to SDL Core is recorded in the Policy Table.  This information is used to persist configurations for the head unit based on the device connected.

## Device Specific Information
Devices are identified in the Policy Table using a unique identifier.  Device unique identifier(s) are either a bluetooth mac address or USB serial address irreversibly encrypted/hashed using SHA-256.  Information about a specific device is stored using its unique identifier as a key.  The following properties describe the information stored.

| Property | Type | Description |
| -------- | ---- | ----------- |
| hardware | String | Type and/or name of the hardware. (e.g. iPhone 7) |
| max_number_rfcom_ports | Number | Number of RFCOM ports supported by the device. |
| firmware_rev | String | Device's firmware version |
| os | String | Operating system. (e.g. iOS or Android) |
| os_version | String | Device's operating system version. |
| carrier | String | The mobile phone's carrier. (e.g. Verizon or AT&T) |


## User Consents
Whether or not an SDL user has given permission for a feature can be stored for each device and application connected to a vehicle's head unit.  For example, a user may consent to allowing SDL to use their phone's cellular data to download Policy Table updates.  These consent records are stored in the **user_consent_records** property.

### Device
User consent(s) for a device are stored in a property named **device** in the **user_consent_records** object.  The value of this property is an object with the following properies:

<a name="User-Consent-Record-Properties"></a>

| User Consent Record Property | Type | Description |
| -------- | ---- | ----------- |
| consent_groups | Object | A listing of SDL features that are accepted or declined. |
| input | String | Accepted values are "GUI" or "VUI" |
| time_stamp | String | A timestamp in <a href="http://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO 8601</a> format. |

### Application
User consent(s) can also be saved per application on a device under a property named after its Application ID.  The value of this property is an object with the same [user consent record properties](#User-Consent-Record-Properties) as device above.

### Example
An example of how the Device Data portion of a Policy Table might look.

    "device_data": {
        "[ID VALUE HERE]": {
            "hardware": "iPhone 4S",
            "max_number_rfcom_ports": 25,
            "firmware_rev": null,
            "os": "iOS",
            "os_version": "5",
            "carrier": "AT&T",
            "user_consent_records": {
                "device": {
                    "consent_groups": {
                        "DataConsent-1": true
                    },
                    "input": "VUI",
                    "time_stamp": "4/24/2012 12:30:00 PM"
                },
                "[APP ID HERE]": {
                    "consent_groups": {
                        "Location-1": true,
                        "DrivingData-1": false
                    },
                    "input": "VUI",
                    "time_stamp": "3/26/2012 10:41:00 AM "
                }
            }
        }
    }


# Functional Groupings
Before an application can use each feature offered by SDL it must first be granted permission to do so in the Policy Table. Each feature may require several RPCs with specific HMI level permission, as well as allowed parameters and other information.  In order to avoid duplicating this data for each application, SDL instead uses functional groupings.  A functional grouping is simply a group of RPC messages and parameters with specific HMI permissions and allowed parameters.  So for example, if an application named Torque wanted access to vehicle data you would simply add the **VehicleData** functional group to Torque's allowed policies.

## Functional Group
Each functional group is given a unique name (e.g. BasicVehicleData) that is used to reference that group from anywhere within the Policy Table.  Each functional group may contain the following properties.

| Functional Group Property | Type | Description |
| -------- | ---- | ----------- |
| rpcs | Object |  A list of Remote Procedure Calls and their configurations for the current functional grouping. |
| user_consent_prompt | String | References a consumer friendly message prompt that is required to use the RPC.  If this field is not present, then a consumer friendly message prompt is **not** required. |

## RPCS
Each RPC in the **rpcs** property has a unique name that represents an existing RPC  (e.g. AddSubMenu).  In each RPC object there may be the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| hmi_levels | Array | An ordered list of [HMI levels](../application-policies/#Application-HMI-Levels) that an application is allowed to use a the RPC command in. |
| parameters | Array | A list of allowed parameters that the application can use with the RPC command. |

## Example
An example of how the Functional Groupings portion of a Policy Table might look.

    "functional_groupings": {
        "Base-1": {
            "rpcs": {
                "AddCommand": {
                    "hmi_levels": [
                        "BACKGROUND",
                        "FULL",
                        "LIMITED"
                    ]
                },
                "AddSubMenu": {
                    "hmi_levels": [
                        "BACKGROUND",
                        "FULL",
                        "LIMITED"
                    ]
                },
                "Alert": {
                    "hmi_levels": [
                        "FULL",
                        "LIMITED"
                    ]
                },
            }
        },
        "VehicleInfo-1": {
            "user_consent_prompt": "VehicleInfo",
            "rpcs": {
                "GetVehicleData": {
                    "hmi_levels": [
                        "BACKGROUND",
                        "FULL",
                        "LIMITED"
                    ],
                    "parameters": [
                        "engineTorque",
                        "externalTemperature",
                        "fuelLevel",
                        "fuelLevel_State",
                        "headLampStatus",
                        "instantFuelConsumption",
                        "odometer",
                        "tirePressure",
                        "vin",
                        "wiperStatus"
                    ]
                },
            }
        }
    }


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
