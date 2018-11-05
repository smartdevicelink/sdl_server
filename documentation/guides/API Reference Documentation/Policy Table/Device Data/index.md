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