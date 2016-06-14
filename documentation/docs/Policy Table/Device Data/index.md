## Device Data
Information about each device that connects to SDL core is recorded in the policy table.  This information is used to persist configurations for the head unit based on the device connected.

  * [Device Specific Information](#deviceDataDeviceSpecificInformation)
  * [Example](#deviceDataExample)
  * [User Consents](#deviceDataUserConsents)

## Device Specific Information
Devices are identified in the policy table using a unique identifier.  Device unique identifier(s) are either a bluetooth mac address or USB serial address irreversibly encrypted/hashed using SHA-256.  Information about a specific device is stored using its unique identifier as a key.  The following properties describe the information stored.

| Property | Type | Description |
| -------- | ---- | ----------- |
| hardware | String | Type and/or name of the hardware. (e.g. iPhone 4S) |
| max_number_rfcom_ports | Number | Number of RFCOM ports supported by the device. |

| firmware_rev | String | Device's firmware version |
| os | String | Operating system. (e.g. iOS or Android) |
| os_version | String | Device's operating system version. |
| carrier | String | The mobile phone's carrier. (e.g. Verizon or AT&T) |


### User Consents
SDL user's can consent to the permit SDL features for each device and/or application connected to a vehicle's head unit.  For example, a user may consent to allowing SDL to use their phone's cellar data to download policy table updates.  These consent records are stored in the **user_consent_records** property.

Device specific settings are stored in a property named **device** in **user_consent_records**.  User consents can also be saved per application on a device under a property named after its application ID.  The application ID and device properties contain the flowing configurable properties.

_// TODO: Input and timestamp need a descriptions and clarification._

| Property | Type | Description |
| -------- | ---- | ----------- |
| consent_groups | Object | A listing of SDL features that are accepted or declined. |
| input | String | Accepted values are "GUI" or "VUI" |
| time_stamp | String | A timestamp in [ISO 8601](http://en.wikipedia.org/wiki/ISO_8601) format. |

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