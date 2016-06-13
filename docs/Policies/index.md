# Policies
Policies are rules enforced by SDL [core](https://github.com/smartdevicelink/sdl_core) that configure how the system can and/or will behave.  For example, a policy could prohibit the use of an application (e.g. Flappy Bird) in a specific type of vehicle.  In general, policies are configured by an OEM (e.g. Ford, GM, Tesla, etc.) using the SDL [server's](https://github.com/smartdevicelink/sdl_server) graphical user interface.  Once configured, all policies for a specific vehicle can be requested in the form a [JSON](http://www.json.org/) document called a policy table.  Policy tables are downloaded to a vehicle's head unit where it can be enforced by SDL [core](https://github.com/smartdevicelink/sdl_core).


## Important Notice
The following documentation has not yet been reviewed by the community to ensure its accuracy.  Certain information may be incorrect or missing at this time.  Once this document has been reviewed, this message will be removed.  To contribute to this documentation please submit an issue and/or pull-requests.


## Table of Contents
  * [Application Policies](#applicationPolicies)
    * [Application ID](#applicationPoliciesApplicationId)
    * [Default](#applicationPoliciesDefault)
    * [Device](#applicationPoliciesDevice)
    * [Example](#applicationPoliciesExample)
  * [Consumer Friendly Messages](#consumerFriendlyMessages)
    * [Example](#consumerFriendlyMessagesExample)
    * [General Information](#consumerFriendlyMessagesGeneralInformation)
    * [Messages](#consumerFriendlyMessagesMessages)
      * [Langauge](#consumerFriendlyLanguage)
      * [Message Text](#consumerFriendlyMessageText)
  * [Data Dictionary](#dataDictionary)
  * [Device Data](#deviceData)
    * [Device Specific Information](#deviceDataDeviceSpecificInformation)
    * [Example](#deviceDataExample)
    * [User Consents](#deviceDataUserConsents)
  * [Functional Groupings](#functionalGroupings)
    * [Example](#functionalGroupingsExample)
    * [Functional Group](#functionalGroupingsFunctionalGroup)
    * [RPCS](#functionalGroupingsRpcs)
  * [Module Config](#moduleConfig)
    * [Example](#moduleConfigExample)
    * [Notifications](#moduleConfigNotifications)
    * [Policy Table Update Configurations](#moduleConfigPolicyTableUpdateConfigurations)
    * [Preloaded Policy Tables](#moduleConfigPreloadedPolicyTables)
    * [Server Requests](#moduleConfigServerRequests)
    * [Vehicle Information](#moduleConfigVehicleInformation)
  * [Module Meta](#moduleMeta)
    * [Example](#moduleMetaExample)
    * [Languge and Country](#moduleMetaLanguageAndCountry)
    * [Module Version](#moduleMetaModuleVersion)
    * [Policy Table Update](#moduleMetaPolicyTableUpdate)
    * [Vehicle Data](#moduleMetaVehicleData)
  * [Policy Table Update](#policyTableUpdate)
    * [Sequence Diagram](#policyTableUpdateSequenceDiagram)
    * [Sequence Diagram Steps](#policyTableUpdateSequenceDiagram)
  * [Usage and Errors](#usageAndErrors)
    * [Application Errors](#usageAndErrorsApplicationErrors)
    * [Example](#usageAndErrorsExample)
    * [General Errors](#usageAndErrorsGeneralErrors)


<a name="applicationPolicies" />
## Application Policies
An application's permissions and settings are stored in the **app_policies** property.  The application policies are used to grant only approved applications access to special features such as vehicle data and/or running in the background.  Additionally application information such as default settings and/or user consents are stored in the policies as well.

  * [Application ID](#applicationPoliciesApplicationId)
  * [Default](#applicationPoliciesDefault)
  * [Device](#applicationPoliciesDevice)
  * [Example](#applicationPoliciesExample)


<a name="applicationPoliciesApplicationId" />
### Application ID
Settings for a specific application are stored as a property named after the application's unique ID (e.g. "663645645" or any string of at most 100 characters).  The value of this property can be either an object containing [properties listed below](#applicationPoliciesApplicationProperties) or a reference to another sibling property (e.g. "default" or "device").  In addition, a special value of "null" can be used to indicate that the application has been revoked.

<a name="applicationPoliciesApplicationProperties" />

| Property | Type | Description |
| -------- | ---- | ----------- |
| keep_context | Boolean | When true, allows the application to display messages even if another app enters the foreground (HMI level FULL). |
| steal_focus | Boolean | When true, allows the application to steal the foreground from another application at will. |
| priority | String | Priority level assigned to the application. |
| default_hmi | String | [HMI level](./HMI Level) given to the application following a successful registration with SDL core. |
| groups | Array of Strings | A list of functional groupings the application has access to. |
| preconsented_groups | Array of Strings | List of [functional groupings](#functionalGroupings) that do not require a user consent because the consent has already been given in another place. (e.g. an application EULA) |
| AppHMIType | Array of Strings | List of [HMI Types](#applicationPoliciesApplicationHmiTypes) used to group the application into different containers in an HMI system. |
| memory_kb | String | //TODO: Define this |
| watchdog_timer_ms | String | //TODO: Define this |
| certificate | String | //TODO: Define this |
| nicknames | Array of Strings | A list of names the application goes by. |

<a name="applicationPoliciesApplicationHmiTypes" />
#### Application HMI Types
An application can be categorized by an HMI type allowing the SDL system understand how to appropriately handle the application.  There are several HMI types listed below.

| Application HMI Type | Description |
| -------------------- | ----------- |
| BACKGROUND_PROCESS | //TODO: Add description |
| COMMUNICATION | //TODO: Add description |
| DEFAULT | //TODO: Add description |
| INFORMATION | //TODO: Add description |
| MEDIA | //TODO: Add description |
| MESSAGING | //TODO: Add description |
| NAVIGATION | //TODO: Add description |
| SOCIAL | //TODO: Add description |
| SYSTEM | //TODO: Add description |
| TESTING | //TODO: Add description |


<a name="applicationPoliciesDefault" />
#### Default
A default application configuration can be specified in the **default** property.  This property's value is an object containing any valid [application property](applicationPoliciesApplicationProperties) excluding the following:

  * certificate
  * nicknames


<a name="applicationPoliciesDevice" />
### Device
// TODO:  What is this used for?

<a name="applicationPoliciesExample" />
### Example

    "app_policies": {
        "default": {
            "keep_context": true,
            "steal_focus": true,
            "priority": "NONE",
            "default_hmi": "NONE",
            "groups": [ "Base-1" ],
            "preconsented_groups": [ "" ],
            "AppHMIType": [ "" ],
            "memory_kb": 5,
            "watchdog_timer_ms": 55
        },
        "device": {
            "keep_context": true,
            "steal_focus": true,
            "priority": "NONE",
            "default_hmi": "NONE",
            "groups": [ "Base-2" ],
            "preconsented_groups": [ "" ]
        },
        "pre_DataConsent": {
            "keep_context": true,
            "steal_focus": true,
            "priority": "NONE",
            "default_hmi": "NONE",
            "groups": [ "BaseBeforeDataConsent" ],
            "preconsented_groups": [ "" ],
            "AppHMIType": [ "" ],
            "memory_kb": 5,
            "watchdog_timer_ms": 55
        },
        "663645645": "null",
        "773692255": "default",
        "584421907": {
            "nicknames": [ "Awesome Music App" ],
            "keep_context": true,
            "steal_focus": true,
            "priority": "NONE",
            "default_hmi": "NONE",
            "groups": [ "VehicleInfo-1" ],
            "preconsented_groups": [ "" ],
            "AppHMIType": [ "" ],
            "memory_kb": 5,
            "watchdog_timer_ms": 55,
            "certificate": ""
        }
    }


<a name="consumerFriendlyMessages" />
## Consumer Friendly Messages
There are certain scenarios when the SDL system needs to display a message to the user.  Some examples are when an error occurs or an application is unauthorized.  These messages can include spoken text and text displayed to a user in multiple languages.  All of this information is stored in the **consumer_friendly_messages** property.

  * [Example](#consumerFriendlyMessagesExample)
  * [General Information](#consumerFriendlyMessagesGeneralInformation)
  * [Messages](#consumerFriendlyMessagesMessages)
    * [Langauge](#consumerFriendlyLanguage)
    * [Message Text](#consumerFriendlyMessageText)


<a name="consumerFriendlyMessagesGeneralInformation" />
### General Information

| Property | Type | Description |
| -------- | ---- | ----------- |
| version | String | Supports the ###.###.### format. Version increments when a language is added or an individual message contents change. |


<a name="consumerFriendlyMessagesMessages" />
### Messages
All messages are given a unique name (e.g. "**AppUnauthorized**" or "**DataConsent**") and stored as an object in the policy table's **messages** property.


<a name="consumerFriendlyLanguage" />
#### Language
Since each message should support multiple languages, each message object will contain a property named **languages**. Language properties are name by combining the [ISO 639-1](http://en.wikipedia.org/wiki/ISO_639-1) language code and the [ISO 3166 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country code.  For example, messages for **English** speaking citizens of the **United States** would be under the key **en-us**.


<a name="consumerFriendlyMessageText" />
#### Message Text
Inside each language object is the data to be read or spoken by the SDL system.  The data is organized in the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| tts | String | Text that can be read aloud by the SDL system. |
| line1 | String | First line of text to be displayed on the head unit. |
| line2 | String | Second line of text to be displayed on the head unit. |


<a name="consumerFriendlyMessagesExample" />
### Example
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



<a name="dataDictionary" />
## Data Dictionary
You can checkout the full <a href="http://goo.gl/HY5xLN" target="_blank">Data Dictionary</a>.

<a name="deviceData" />
## Device Data
Information about each device that connects to SDL core is recorded in the policy table.  This information is used to persist configurations for the head unit based on the device connected.

  * [Device Specific Information](#deviceDataDeviceSpecificInformation)
  * [Example](#deviceDataExample)
  * [User Consents](#deviceDataUserConsents)


<a name="deviceDataDeviceSpecificInformation" />
## Device Specific Information
Devices are identified in the policy table using a unique identifier.  Device unique identifier(s) are either a bluetooth mac address or USB serial address irreversibly encrypted/hashed using SHA-256.  Information about a specific device is stored using its unique identifier as a key.  The following properties describe the information stored.

| Property | Type | Description |
| -------- | ---- | ----------- |
| hardware | String | Type and/or name of the hardware. (e.g. iPhone 4S) |
| max_number_rfcom_ports | Number | Number of RFCOM ports supported by the device. |
| firmware_rev | String | Device's firmware version. |
| os | String | Operating system. (e.g. iOS or Android) |
| os_version | String | Device's operating system version. |
| carrier | String | The mobile phone's carrier. (e.g. Verizon or AT&T) |


<a name="deviceDataUserConsents" />
### User Consents
SDL user's can consent to the permit SDL features for each device and/or application connected to a vehicle's head unit.  For example, a user may consent to allowing SDL to use their phone's cellar data to download policy table updates.  These consent records are stored in the **user_consent_records** property.

Device specific settings are stored in a property named **device** in **user_consent_records**.  User consents can also be saved per application on a device under a property named after its application ID.  The application ID and device properties contain the flowing configurable properties.

_// TODO: Input and timestamp need a descriptions and clarification._

| Property | Type | Description |
| -------- | ---- | ----------- |
| consent_groups | Object | A listing of SDL features that are accepted or declined. |
| input | String | Accepted values are "GUI" or "VUI" |
| time_stamp | String | A timestamp in [ISO 8601](http://en.wikipedia.org/wiki/ISO_8601) format. |


<a name="deviceDataExample" />
### Example
    "device_data": {
        "UEI17A73JH32L41K32JH4L1K234H3K4HUU40DAS7F970": {
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
                "584421907": {
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


<a name="functionalGroupings" />
## Functional Groupings
Before an application can use each feature offered by SDL it must first be granted permission to do so in the policy table.  Each feature may require several RPCs with specific HMI level permission, as well allowed parameters and other information.  In order to avoid duplicating this data for each application, SDL instead uses functional groupings.  A functional grouping is simply a group of RPC messages and parameters with specific HMI permissions and allowed parameters.  So for example, if an application named Torque wanted access to vehicle data SDL would simply add the **VehicleData** functional group to Torque's allowed policies.

  * [Example](#functionalGroupingsExample)
  * [Functional Group](#functionalGroupingsFunctionalGroup)
  * [RPCS](#functionalGroupingsRpcs)


<a name="functionalGroupingsFunctionalGroup" />
### Functional Group
Each functional group is given a unique name (e.g. BasicVehicleData) that is used to reference that group from anywhere within the Policy Table.  Each functional group may contain the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| rpcs | Object |  A list of Remote Procedure Calls and their configurations for the current functional grouping. |
| user_consent_prompt | String | References a consumer friendly message prompt that is required to use the RPC.  If this field is not present, then a consumer friendly message prompt is **not** required. |


<a name="functionalGroupingsRpcs" />
### RPCS
Each RPC in the **rpcs** property has a unique name that represents an existing RPC  (e.g. "AddSubMenu").  In each RPC object there may be the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| hmi_levels | Array | An ordered list of [HMI levels](./HMI Levels) that an application is allowed to use a the RPC command in. |
| parameters | Array | A list of allowed parameters that can the application can use with the RPC command. |


<a name="functionalGroupingsExample" />
### Example
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



<a name="moduleConfig" />
## Module Config
The module configuration property contains information used to configure core for use on the current vehicle.

  * [Example](#moduleConfigExample)
  * [Notifications](#moduleConfigNotifications)
  * [Policy Table Update Configurations](#moduleConfigPolicyTableUpdateConfigurations)
  * [Preloaded Policy Tables](#moduleConfigPreloadedPolicyTables)
  * [Server Requests](#moduleConfigServerRequests)
  * [Vehicle Information](#moduleConfigVehicleInformation)


<a name="moduleConfigNotifications" />
### Notifications
There is a limit for the number of notifications that can be displayed per priority level.  The limit is based on notifications per minute.  You can configure these in the **notifications_per_minute_by_priority** property.  The following are the available priority levels.

| Property | Type | Description |
| -------- | ---- | ----------- |
| EMERGENCY          | Number | Number of emergency notifications that can be displayed per minute. |
| COMMUNICATION      | Number | Number of communication notifications that can be displayed per minute. |
| NAVIGATION         | Number | Number of navigation notifications that can be displayed per minute. |
| NONE               | Number | Number of notifications without a priority that can be displayed per minute. |
| NORMAL             | Number | Number of notifications with a normal prioritythat can be displayed per minute. |
| voiceCommunication | Number | Number of voice communication notifications that can be displayed per minute. |


<a name="moduleConfigPolicyTableUpdateConfigurations" />
### Policy Table Update Configurations
Periodically changes will be made to a policy table, either by the server or core.  This means core should periodically perform a policy table update, which synchronizes the two tables.  You can configure when core will check using the following configurations.

| Property | Type | Description |
| -------- | ---- | ----------- |
| exchange_after_x_ignition_cycles | Number | Update policies after a number of ignitions. |
| exchange_after_x_kilometers | Number | Update policies after a number of kilometers traveled. |
| exchange_after_x_days | Number | Update policies after a number of days.  |


<a name="moduleConfigPreloadedPolicyTables" />
### Preloaded Policy Tables
SDL core can use a predefined policy table located locally on the vehicle's head unit.  This is present to initially configure core as well as to enable the storage of vehicle data before a policy update has occurred.

_// TODO:  Is this correct? _

| Property | Type | Description |
| -------- | ---- | ----------- |
| preloaded_pt | Boolean | When true, core will use the local copy of the policy table. |


<a name="moduleConfigServerRequests" />
### Server Requests
All requests made directly by core or by proxy can be configured using the following attributes.

| Property | Type | Description |
| -------- | ---- | ----------- |
| timeout_after_x_seconds | Number | Elapsed seconds until a policy update request will timeout. |
| endpoints | Object | Contains a list of [service types](Service Types) that may contain a default or app-specific array of server endpoints. |
| seconds_between_retries | Array | A list of seconds to wait before each retry. |


<a name="moduleConfigVehicleInformation" />
### Vehicle Information
Vehicle identification information is currently stored in the module configuration portion of the policy table.

| Property | Type | Description |
| -------- | ---- | ----------- |
| vehicle_make  | String | Manufacturer of the vehicle. |
| vehicle_model | String | Model of a vehicle. |
| vehicle_year  | String | Year the vehicle was made. |


<a name="moduleConfigExample" />
### Example

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


<a name="moduleMeta" />
## Module Meta

  * [Example](#moduleMetaExample)
  * [Language and Country](#moduleMetaLanguageAndCountry)
  * [Module Version](#moduleMetaModuleVersion)
  * [Policy Table Update](#moduleMetaPolicyTableUpdate)
  * [Vehicle Data](#moduleMetaVehicleData)


<a name="moduleMetaLanguageAndCountry" />
### Language and Country
The current language and regional settings can be configured using the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| language | String | Current system language.  [ISO 639-1](http://en.wikipedia.org/wiki/ISO_639-1) combined with [ISO 3166 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country code.  A dynamically generated list can be found [here](https://github.com/smartdevicelink/sdl_server/blob/master/server/data/languages.js). |
| wers_country_code | String | A two letter string uniquely representing a country.  A dynamically generated list can be found [here](https://github.com/smartdevicelink/sdl_server/blob/master/server/data/countries.js). |


<a name="moduleMetaModuleVersion" />
### Module Version
The current version of the vehicle's module should be stored in the following property.

| Property | Type | Description |
| -------- | ---- | ----------- |
| ccpu_version | String | Software version for the module running core. |


<a name="moduleMetaPolicyTableUpdate" />
### Policy Table Update
Information about when a policy table update has last taken place is stored in the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| pt_exchanged_at_odometer_x | Number | Marks the odometer reading in kilometers at the time of the last successful policy table update. |
| pt_exchanged_x_days_after_epoch | Number | Marks the time of the last successful policy table update. |
| ignition_cycles_since_last_exchange | Number | Number of ignition cycles since the last policy table update. |



<a name="moduleMetaVehicleData" />
### Vehicle Data
Additional vehicle information is stored in the module meta property.

| Property | Type | Description |
| -------- | ---- | ----------- |
| vin | String | The vehicle's unique identification number. |


<a name="moduleMetaExample" />
### Example
    "module_meta": {
        "ccpu_version": "4.1.2.B_EB355B",
        "language": "en-us",
        "wers_country_code": "WAEGB",
        "pt_exchanged_at_odometer_x": 1903,
        "pt_exchanged_x_days_after_epoch": 46684,
        "ignition_cycles_since_last_exchange": 50,
        "vin": "1FAPP4442VH100001"
    }


<a name="policyTableUpdate" />
## Policy Table Update
Periodically changes will be made to a policy table, either by the server or core.  In order to synchronize the two tables a policy table update must be performed.  An update is [triggered by core](https://github.com/smartdevicelink/sdl_core/wiki/Policies) by either an application connecting for the first time or by one of the [policy table update configurations](#moduleConfigPolicyTableUpdateConfigurations) or by a user's request.  When requesting a policy table update, core sends its current policy table, called a policy table snapshot, to the server.  The server records any aggregate usage data as needed or designed, then responds to the request with a policy table update that contains the latest [module config](), [functional groupings](), [application policies](), and [consumer friendly messages]().  The [application policies]() section will only contain information for the current list of applications in the received policy table snapshot.  In addition, the [consumer friendly messages]() will only be included if an update is required, meaning the received policy table snapshot has an older version than the server.

> Note:  You can read more about how SDL core makes a policy request in the [SDL core wiki](https://github.com/smartdevicelink/sdl_core/wiki/Policies).

<a name="policyTableUpdateSequenceDiagram" />
### Policy Table Update Sequence Diagram
![Policy Table Update Sequence Diagram](https://raw.githubusercontent.com/smartdevicelink/sdl_server/master/docs/sdl_server_policy_request_sequence_diagram.jpg)

<a name="policyTableUpdateSequenceDiagramSteps" />
### Policy Table Update Sequence Diagram Steps
1. A policy table update is triggered by SDL core and a snapshot of the current policy table is created.  The snapshot includes the entire local policy table with one exception.  Only the version number property of the [consumer friendly messages](#consumerFriendlyMessagesExample) section is included in the snapshot.
2. An OnSystemRequest RPC is created with a request type of proprietary.  The RPC contains a policy table snapshot in binary and a URL from one of the endpoints defined in the [module config](#moduleConfigServerRequests).  In addition HTML request headers can be present to be used when making the request.
3. The RPC's data is, optionally, encrypted using a synchronous key known only to SDL core and SDL server.  The URL and headers are not encrypted since they are required by the mobile library to forward the request to the SDL server.
4. The RPC is then sent to the mobile library.
5. The mobile library will ignore the request body containing the policy table snapshot, because it is marked as proprietary, and will forward the request to the URL included in the OnSystemRequest RPC.  If the request fails to send then the mobile library will attempt to retry using the configuration specified in the [module config](#moduleConfig).
6. When the server receives the policy table update request it will first lookup the module in the server's database using a unique identifier.  If the module is not found an error will be retured in the server's response.
7. If the policy table snapshot is encrypted, then the server will use the symmetric key found in the module's database record, the one we just looked up, to decrypt the policy table snapshot.  If the data cannot be decrypted, then the data is not from a trusted source and an error is returned in the server's response.
8. The aggregate usage data and vehicle data in the received policy table snapshot is recorded to the server's database. Typically [Usage and Error Counts](#usageAndErrors), [Device Data](#deviceData), and [Module Meta](#moduleMeta) contain data to be recored.
9. A policy table update is created based on the received policy table snapshot.  Note that only applications listed in the policy snapshot will be included in the update.  In addition, if the [consumer friendly messages version number](#consumerFriendlyMessagesGeneralInformation) is lower than the version available on the server, then the updated consumer friendly messages will also be included in the policy update.
10. Then the policy table update is, optionally, encrypted using a symmetric key from the module record we previously looked up.
11. Finally the policy table update is returned in the response to the policy update request.
12. The mobile library then forwards the server's response to core using a SystemRequest RPC message.
13. After being received by core the response body, if encrypted, is decrypted using a symmetric key.  If the body cannot be decrypted, then the data is not from a trusted source and an error is returned to the mobile library using a SystemRequestResponse RPC.
14. The policy table update is applied by replacing the following fields in the local policy table with the fields from the policy table update:  [module config](#moduleConfig), [functional groupings](#functionalGroupings), and [application policies](#applicationPolicies).  In addition, if the [consumer friendly messages](#consumerFriendlyMessages) section of the policy table update contains a **messages** subsection, then the entire [consumer friendly messages](#consumerFriendlyMessages) portion of the local policy table will be replaced with the values from the policy table update.
15. If the response is valid and everything updates ok, then success is returned to the mobile library using a SystemRequestResponse RPC.



<a name="usageAndErrors" />
## Usage and Errors
Some usage and error statistics are collected to help developers debug problems and improve SDL.  The information does not contain any user information and is very small as to use as little mobile data as possible.  This data is sent to the SDL server when performing a policy table update.


  * [Application Errors](#usageAndErrorsApplicationErrors)
  * [Example](#usageAndErrorsExample)
  * [General Errors](usageAndErrorsGeneralErrors)

<a name="usageAndErrorsApplicationErrors" />
### Application Errors
Errors and usage statistic that occur while an applciation is in use or are related to an application are recorded.  The following properties are tracked in a property named after the application's ID.

| Property | Type | Description |
| -------- | ---- | ----------- |
| app_registration_language_gui | String | Language used to register the application using GUI.  |
| app_registration_language_vui | String | Language used to register the application using VUI. |
| count_of_rejected_rpcs_calls | Number |  Count of RPC calls that were rejected because access was not allowed due to a policy. |
| count_of_rejections_duplicate_name | Number | Number of times an application registration uses a name which is already registered in the current ignition cycle. |
| count_of_rejections_nickname_mismatch | Number | Number of times an app is not allowed to register because it's registration does not match one of the app-specific policy nicknames. |
| count_of_rejections_sync_out_of_memory | Number | Number of times an application is not allowed to register because the vehicle module is out of memory (as defined in count_of_sync_out_of_memory). |
| count_of_removals_for_bad_behavior | Number | The module has criteria for identifying unacceptably bad application behavior. This tracks the number of times that distinction leads the module to unregister an application. |
| count_of_rfcom_limit_reached | Number | Number of times the maximum number of rfcom channels are used on a device by the application. |
| count_of_rpcs_sent_in_hmi_none | Number | Number of times an application tried to use an RPC (not unregisterAppInterface) in the HMI NONE state. Counts the number of conflicts with the built-in/hardcoded restriction for HMI_STATE=NONE. |
| count_of_run_attempts_while_revoked | Number | Incremented when the user selects a revoked application from the SYNC HMI menu.  |
| count_of_user_selections | Number | Number of times a user selected to run the app.  Increment one when app starts via Mobile Apps Menu or VR. Increment one the first time the app leaves it's default_hmi for HMI_FULL, as in the resuming app scenario. Do not increment anytime an app comes into HMI_FULL. Do not increment when cycling sources. For all 3 scenarios, both successful and unsuccessful app starts shall be counted.  |
| minutes_in_hmi_background | Number | Number of minutes the application is in the HMI background state. |
| minutes_in_hmi_full | Number | Number of minutes the application is in the HMI full state. |
| minutes_in_hmi_limited | Number | Number of minutes the application is in the HMI limited state. |
| minutes_in_hmi_none | Number | Number of minutes the application is in the HMI none state. |


<a name="usageAndErrorsGeneralErrors" />
### General Errors
Some basic usage and error counts are stored in the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| count_of_iap_buffer_full | Number | Number of times the iOS accessory protocol buffer is full. |
| count_of_sync_reboots | Number | Number of times the head unit has rebooted. |
| count_sync_out_of_memory | Number | Number of times the CCPU has run out of memory. |


<a name="usageAndErrorsExample" />
### Example
    "usage_and_error_counts": {
        "count_of_iap_buffer_full": 1,
        "count_of_sync_reboots": 123,
        "count_sync_out_of_memory": 3,
        "app_level": {
            "584421907": {
              "app_registration_language_gui": "en-us",
              "app_registration_language_vui": "en-us",
              "count_of_rejected_rpcs_calls": 9,
              "count_of_rejections_duplicate_name": 2,
              "count_of_rejections_nickname_mismatch": 1,
              "count_of_rejections_sync_out_of_memory": 0,
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
