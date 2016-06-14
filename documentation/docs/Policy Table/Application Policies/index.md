## Application Policies
An application's permissions and settings are stored in the **app_policies** property.  The application policies are used to grant only approved applications access to special features such as vehicle data and/or running in the background.  Additionally application information such as default settings and/or user consents are stored in the policies as well.

  * [Application ID](#Application-ID)
  * [Default](#applicationPoliciesDefault)
  * [Device](#applicationPoliciesDevice)
  * [Example](#applicationPoliciesExample)

<a name="Application-ID" />
### Application ID
Settings for a specific application are stored as a property named after the application's unique ID (e.g. "663645645" or any string of at most 100 characters).  The value of this property can be either an object containing [properties listed below](#applicationPoliciesApplicationProperties) or a reference to another sibling property (e.g. "default" or "device").  In addition, a special value of "null" can be used to indicate that the application has been revoked.

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


#### Default
A default application configuration can be specified in the **default** property.  This property's value is an object containing any valid [application property](applicationPoliciesApplicationProperties) excluding the following:

  * certificate
  * nicknames


### Device
// TODO:  What is this used for?

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