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
| Name   | Alternate strings to identify the application. The app's name must match one of these in order for it to connect to core. |

### Requested Permissions
| Property | Definition |
|----------|---------|
| Name | Strings to identify the permission. |
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
This is an example of how the app and its required permissions will appear in the policy table. Denied applications will not appear in either the staging or the production policy table and as such they will not have a policy table preview.
```
  {
    nicknames: [
      "App Display Names"
    ],
    keep_context: true,
    steal_focus: true,
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
Pending applications are automatically granted all requested permissions in your staging policy table so you can perform any required internal testing. Select approve in the top right corner if you would like to give this app the permissions it needs in your production policy table, otherwise select deny. Only approved applications will be given access to the RPCs and permissions that they require on your production environment. If you choose to deny an applicaiton, you will be asked to (optionally) provide your reasoning for doing so. Each time that an app is updated on the SDL Developer Portal at smartdevicelink.com, the app's changes will appear in your policy server pending re-approval. If an app is from a trusted developer and you would like to always approve future revisions of it, you can choose to "Automatically approve updates" under "General App Info" of the app's review page. This setting can be changed later if the need arises.
![App-Details](./assets/App-Details.png)
