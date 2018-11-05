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