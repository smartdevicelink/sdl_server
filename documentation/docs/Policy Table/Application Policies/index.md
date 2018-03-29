# Application Policies
An application's permissions and settings are stored in the **app_policies** property in a policy table.  The application policies are used to grant applications access to a specific set of features, such as vehicle data and/or running in the background.  Any other application related data, such as user-consents, can also be stored in application policies as well.

## Application ID
Settings for a specific application are stored in the **app_policies** object as a property named after the application's unique ID (e.g. "663645645" or any string of at most 100 characters).  The value of this property can be either an object containing properties listed below or a reference to another sibling property (e.g. "default" or "device").  In addition, a special value of "null" can be used to indicate that the application has been revoked.

<a name="Application-Property"></a>

| Application Property | Type | Description |
| -------- | ---- | ----------- |
| keep_context | Boolean | When true, allows the application to display messages even if another app enters the foreground (HMI level FULL). |
| steal_focus | Boolean | When true, allows the application to steal the foreground from another application at will. |
| priority | String | Priority level assigned to the application. |
| default_hmi | String | [HMI level](#Application-HMI-Levels) given to the application following a successful registration with SDL core. |
| groups | Array of Strings | A list of functional groupings the application has access to. |
| preconsented_groups | Array of Strings | List of [functional groupings](../functional-groupings) that do not require a user consent because the consent has already been given in another place. (e.g. an application EULA) |
| AppHMIType | Array of Strings | List of [HMI Types](#Application-HMI-Types) used to group the application into different containers in an HMI system. |
| memory_kb | String | The defined max value for the amount of space the application is allocated in the system’s file system for app icons, and other graphics |
| watchdog_timer_ms | String | Governs the HeartBeat timeout.  If set to 0, watchdog_timer_ms should be disabled. |
| certificate | String | The certificate that would be delivered to SDL core through a policy table |
| nicknames | Array of Strings | A list of names the application goes by. |

### Application HMI Types
An application can be categorized by an HMI type allowing the SDL system understand how to appropriately handle the application.  There are several HMI types listed below.

<a name="Application-HMI-Types"></a>

| Application HMI Type | Description |
| -------------------- | ----------- |
| BACKGROUND_PROCESS | An application that truly does not have any user interaction. Used for an application that does not require displaying information |
| COMMUNICATION | The application for communication.  Communication applications are defined with this type|
| DEFAULT | The application of default type. Default applications are defined with this type|
| INFORMATION | The application of information type such as name, ID, and other application information.  This type is currently not actively being used.|
| MEDIA | The media application |
| MESSAGING | Messaging applications are defined with this type.  This type is currently not actively being used.|
| NAVIGATION | The application of navigation type.  Navigation and Mobile Navigation applications are defined with this type.|
| SOCIAL | Social applications are defined by this type.  This type is currently not actively being used|
| SYSTEM | The application of system type.  System applications are defined with this type|
| TESTING | The application of testing type.  Testing applications are defined with this type |

<a name="Application-HMI-Levels"></a>

### Application HMI Levels
An HMI Level describes the state of an application.  Resources are granted to an application based on its current state.  While some resources are granted automatically to an application in a specific HMI Level, many can be controlled by the policy table.

| Level | Value | Short Description |
|-------|-------|-------------------|
| Full | 0 | An application is typically in ```Full``` when it is displayed in the HMI.  In ```Full``` an application has access to the HMI supported resources, e.g. UI, VR, TTS, audio system, and etc. |
| Limited | 1 | An application is typically placed in ```Limited``` when a message or menu is displayed ```Limited``` to restrict it's permissions. |
| Background | 2 | An application is typically in ```Background``` when it is not being displayed by the HMI.  When in ```Background``` an application can send RPCs according to the Policy Table rules. |
| None | 3 | When placed in ```None``` an application has no access to HMI supported resources. |


## Default
A default application configuration can be stored in the **app_policies** object as a property named **default**.  This property's value is an object containing any valid [application property](#Application-Property) excluding **certificate** and **nicknames**.

## Device
The name of the device where the identified application is running on.

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
        "[App ID 1]": "null",
        "[App ID 2]": "default",
        "[App ID 3]": {
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