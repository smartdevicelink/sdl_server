# Application Launching v1.0

## Query Available Applications
Get a list of all available SDL applications for use with a specific head unit and phone.  By default applications that are in development mode, disabled, black listed, or with unsupported SDL versions will not be included in the list.  You can alter the defaults by adding optional query parameters in the request.

### Request

    GET /applications/available/:moduleId

#### Parameters
Required values that are required in the request URL to perform the requested operation.

| Parameter | Description | Acceptable Input |
| --------- | ----------- | ---------------- |
| **moduleId** |  An Object ID uniquely identifying the vehicle's hardware module in the database. | A 12-byte Object ID string. |

#### Query Parameters
Optional key/value pairs that can be included in the request URL to override the default parameter values.  


| Parameter | Description | Acceptable Input |
| --------- | ----------- | ---------------- |
| **development** | Include development applications in the response.  Default is false. | _true_ or _false_ |
| **os** | Include only applications for a specific operating system.  Default is to list applications for every operating system. | _ios_ or _android_ |
| **sdlMaxVersion** | Exclude applications with SDL versions outside the max range specified.  | Any positive decimal or integer values that are also valid SDL version numbers. |
| **sdlMinVersion** | Exclude applications with SDL versions outside the min range specified.  | Any positive decimal or integer values that are also valid SDL version numbers. |
| **sdlVersion** | Exclude applications that do not support a specific SDL version. | Any positive decimal or integer values that are also valid SDL version numbers. |


### Response

The successful response will contain a JSON object that contains a property named _response_.  The response property value will always be an array of Application JSON objects.  

    {
        "status": "200 ok",
        "responseType": "array",
        "response": [ {}, {}, {} ]
    }

#### Application Object Properties

The following is a list of all the possible properties contained in each Application response object.  Not every Application object will contain every property.

| Property | Type | Description |
| -------- | ---- | ----------- |
| **_id** | String | An Object ID uniquely identifying the application in the database. |
| **__v** | Number | The versionKey is a property set on each document when first created by Mongoose. This keys value contains the internal revision of the document.  This property may or may not be included in the response. |
| **android** | Object | An object containing information about the android version of the application. |
| **android.appHmiType** | String | Determines how the application will be displayed in the HMI or categorized by the SDL system. Allowable <a href="https://github.com/smartdevicelink/sdl_server/wiki/Policies#applicationPoliciesApplicationHmiTypes" target="blank">HMI types</a> |
| **android.category** | String | Play Store category for the application. |
| **android.isMediaApplication** | Boolean | When enabled an application has access to the playback controls in the HMI which are **back**, **play/pause**, **forward**, and possibly a **slider** |
| **android.packageName** | String | Android package name for the application. |
| **android.playStoreUrl** | String | Play Store URL to the application. |
| **android.sdlMaxVersion** | String | Maximum version of SDL supported by the application. |
| **android.sdlMinVersion** | String | Minimum version of SDL supported by the application. |
| **appId** | String | A unique identifier for the application for the SDL enviorment. |
| **development** | Boolean | Indicates whether or not the application is in development mode. |
| **iconUrl** | String | A link to a valid application icon URL or an empty string. |
| **ios** | Object | An object containing information about the iOS version of the application. |
| **ios.appHmiType** | String | Determines how the application will be displayed in the HMI or categorized by the SDL system. Allowable <a href="https://github.com/smartdevicelink/sdl_server/wiki/Policies#applicationPoliciesApplicationHmiTypes" target="blank">HMI types</a> |
| **ios.category** | String | App Store category for the application. |
| **ios.isMediaApplication** | Boolean | When enabled an application has access to the playback controls in the HMI which are **back**, **play/pause**, **forward**, and possibly a **slider** |
| **ios.itunesUrl** | String | App Store URL to the application. |
| **ios.sdlMaxVersion** | String | Maximum version of SDL supported by the application. |
| **ios.sdlMinVersion** | String | Minimum version of SDL supported by the application. |
| **ios.urlScheme** | String | URL scheme for the iOS application. |
| **ios.languages** | Array | An array of language objects|
| **ios.language** | Object | An object which denotes the strings that voice recognition should use to launch the application. The default is required.
| **ios.language.ttsName** | String | The primary name of the application used for voice recognition|
| **ios.language.vrSynonyms** | Array | An array of strings which are also valid to launch the application via voice recognition|
| **name** | String | Name of the application. |


### Example
The following example requests will demonstrate common use-cases for the endpoint.

#### Example Android Request

The following request will return all applications that are available for the module with the ID _55f75cfb891ab712302d3588_ that are also _android_ applications and support SDL version _2.0_

        GET /applications/available/55f75cfb891ab712302d3588?os=android&sdlVersion=2.0

#### Example Android Response

    {
      "status": "200 ok",
      "responseType": "array",
      "response": [{
        "_id": "53f75cfb891ec700002d3592",
        "__v": 0,
        "appId": "853426",
        "development": false,
        "iconUrl": "http://i.imgur.com/S0FAk3.png",
        "android": {
          "appHmiType": "MEDIA",
          "category": "MusicAndAudio",
          "isMediaApplication": true,
          "packageName": "com.awesome.fake",
          "playStoreUrl": "http://play.google.com/store/apps/details?id=com.awesome.fake",
          "sdlMaxVersion": "3.0",
          "sdlMinVersion": "1.0"
        },
        "name": "Awesome Music App"
      }, {
        "_id": "45275cfb891ec700002d3845",
        "__v": 0,
        "android": {
          "appHmiType": "MEDIA",
          "category": "MusicAndAudio",
          "isMediaApplication": true,
          "packageName": "com.crappy.fake",
          "playStoreUrl": "http://play.google.com/store/apps/details?id=com.crappy.fake",
          "sdlMaxVersion": "2.0",
          "sdlMinVersion": "1.0"
        },
        "appId": "553426",
        "development": false,
        "iconUrl": "http://i.imgur.com/R3a11YFAk3.png",
        "name": "Crappy Music App"
      }]
    }

#### Example iOS Request

The following request will return all applications that are available for the module with the ID _55f75cfb891ab712302d3588_ that are also _iOS_ applications and support SDL version _1.0_

    GET /applications/available/55f75cfb891ab712302d3588?os=ios&sdlVersion=1.0

#### Example iOS Response

    {
      "status": "200 ok",
      "responseType": "array",
      "response": [{
        "_id": "53f75cfb891ec700002d3592",
        "__v": 0,
        "appId": "853426",
        "development": false,
        "iconUrl": "http://i.imgur.com/S0FAk3.png",
        "ios": {
          "appHmiType": "MEDIA",
          "category": "Music",
          "isMediaApplication": true,
          "itunesUrl": "http://itunes.apple.com/app/awesome-music-app/id324384482?mt=8",
          "sdlMaxVersion": "3.0",
          "sdlMinVersion": "1.0",
          "urlScheme": "awesomemusicapp://",
          "languages": [
            "default": {
                "ttsName": "Awesome Music",
                "vrSynonyms": ["Awesome App", "Music Awesomeness"]
            },
            "EN-US": {
                "ttsName": "Awesome Music",
                "vrSynonyms": ["Awesome App", "Music Awesomeness"]
            }
            "ES-ES": {
                "ttsName": "música impresionante",
                "vrSynonyms": ["aplicación impresionante", "buena música"]
            }
          ]
        },
        "name": "Awesome Music App"
      }]
    }
