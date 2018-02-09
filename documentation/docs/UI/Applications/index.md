# Applications
This page displays a list of applications pulled from the SHAID server. When initially added, apps will be pending approval. Reviewing each app will give the user a detailed page on the important information associated with the app such as the requested permissions, developer contact information, and preview of what its segment in the policy table would look like.
![Applications-List](./assets/Applications-List.png)
### General App Info
| Property | Definition |
|----------|---------|
| Application Name | The String for which to identify the application. |
| Last Update | The timestamp from when the app information was most recently updated. |
| Platform | Android/IOS |
| Category | Specifies the type of application. eg. Media, Information, Social. |

### App Display Names
| Property | Definition |
|----------|---------|
| Name   | Alternate strings to identify the application |

### Requested Permissions
| Property | Definition |
|----------|---------|
| Name        | String to identify the permission |
| Type | RPC  |
| HMI Level Requested | BACKGROUND/FULL/NONE/LIMITED   |

### Developer Contact Info
| Property | Definition |
|----------|---------|
| Vendor | The name of the developer to contact with regards to this application. |
| Email | The contact email for the Vendor. |
| Phone | The contact phone number for the Vendor. |
| Tech Email | The optional contact email for technical issues regarding the app. |
| Tech Phone | The optional contact phone number for technical issues. |


### Policy Table Preview
An example of how the app and its required permissions will appear in the policy table.
```
  {
    nicknames: [
      "App Display Names"
    ],
    keep_context: boolean,
    steal_focus: boolean,
    priority: "NONE",
    default_hmi: "NONE",
    groups: [
      "FunctionalGroup1",
      "FunctionalGroup2",
      "FunctionalGroup3"
    ],
    moduleType: [

    ]
  }
```
## Approved, Denied, & Pending
Select approve in the top right corner if you would like to give this app the permissions it needs, otherwise select deny. If you choose to deny an applicaiton, you will be asked to provide your reasoning for doing so. Denying an application will notify the developer and any feedback will be sent to the developer via email. You can also choose to send the notification without feedback. Each time that an app is updated in the developer portal, the policy server will need approval once again. If this is an app which is from a trusted developer and is frequently updated for which you would always approve, you can choose under "General App Info" to "Automatically approve updates." This setting can be changed later if the need arises.
![App-Details](./assets/App-Details.png)