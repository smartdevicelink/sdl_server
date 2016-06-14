# Application Policies
An application's permissions and settings are stored in the `app_policies` property.  The application policies are used to grant applications access to a specific set of features, such as vehicle data and/or running in the background.  Any other application related data, such as user-consents, can also be stored in application policies as well.

  * [Application ID](#Application-ID)
  * [Default](#Default)
  * [Device](#Device)
  * [Example](#Example)

<a name="Application-ID"></a>
## Application ID
Settings for a specific application are stored as a property named after the application's unique ID (e.g. "663645645" or any string of at most 100 characters).  The value of this property can be either an object containing properties listed below or a reference to another sibling property (e.g. "default" or "device").  In addition, a special value of "null" can be used to indicate that the application has been revoked.

<a name="Application-Property"></a>
| Property | Type | Description |
| -------- | ---- | ----------- |
| keep_context | Boolean | When true, allows the application to display messages even if another app enters the foreground (HMI level FULL). |
| steal_focus | Boolean | When true, allows the application to steal the foreground from another application at will. |
| priority | String | Priority level assigned to the application. |
| default_hmi | String | [HMI level](#Application-HMI-Levels) given to the application following a successful registration with SDL core. |
| groups | Array of Strings | A list of functional groupings the application has access to. |
| preconsented_groups | Array of Strings | List of [functional groupings](/docs/sdl-server/master/policy-table/functional-groupings) that do not require a user consent because the consent has already been given in another place. (e.g. an application EULA) |
| AppHMIType | Array of Strings | List of [HMI Types](#Application-HMI-Types) used to group the application into different containers in an HMI system. |
| memory_kb | String | //TODO: Define this |
| watchdog_timer_ms | String | //TODO: Define this |
| certificate | String | //TODO: Define this |
| nicknames | Array of Strings | A list of names the application goes by. |

<a name="Application-HMI-Types"></a>
### Application HMI Types
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

<a name="Application-HMI-Levels"></a>
### Application HMI Levels
An HMI Level describes the state of an application.  Resources are granted to an application based on its current state.  While some resources are granted automatically to an application in a specific HMI Level, many can be controlled by the policy table.

| Level | Value | Short Description |
|-------|-------|-------------------|
| Full | 0 | An application is typically in ```Full``` when it is displayed in the HMI.  In ```Full``` an application has access to the HMI supported resources, e.g. UI, VR, TTS, audio system, and etc. |
| Limited | 1 | An application is typically placed in ```Limited``` when a message or menu is displayed ```Limited``` to restrict it's permissions. |
| Background | 2 | An application is typically in ```Background``` when it is not being displayed by the HMI.  When in ```Background``` an application can send RPCs according to the Policy Table rules. |
| None | 3 | When placed in ```None``` an application has no access to HMI supported resources. |


<a name="Default"></a>
## Default
A default application configuration can be specified in the **default** property.  This property's value is an object containing any valid [application property](#Application-Property) excluding `certificate` and `nicknames`.

  * certificate
  * nicknames

<a name="Device"></a>
## Device
// TODO:  What is this used for?

<a name="Example"></a>
## Example
An example of how the Application Policy portion of a policy table might look.

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