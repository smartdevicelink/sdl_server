These are the API routes that the policy server exposes.

### `GET /applications` & `GET /groups` & `GET /messages`
Retrieves information regarding applications, functional groups, or consumer friendly messages. An **id** (or additionally **uuid** for applications) can be specified so as to retrieve information for a specific item. Functional groups and consumer messages can be set to return templates containing all necessary information on that item being stored in the database. Applications can be filtered by approval status. If no parameters are specified `/applications` will return the lateset version of each app, `/groups` and `/messages` will return the latest version of all functional groups or consumer messages in either production or staging mode.

### `POST /applications/action`
Updates an application's approval status. In the future this route will also notify the app's developer via email of the change in approval status.

### `POST /applications/auto`
If an application has been set to automatically approve all future updates then this route will validate the app uuid and update the approval status. In the future this route will also notify the app's developer via email of the change in approval status.

### `POST /staging/policy` & `POST /production/policy`
These are the routes sdl_core's default policy table should use when requesting a policy table update with either `/staging` or `/production` specified. 
Given a "shortened" policy table, the policy server will use that information to automatically construct a full policy table response and return it to the requester.

### `GET /policy/preview`
This is the route hit by the policy server UI requesting a preview of the policy table. A variable **environment** indicates whether it is to be staging or production.

### `POST /policy/apps`
The policy server UI makes a request to this route which returns an example policy table segment for a particular app.

### `POST /webhook`
This is the route that should be specified on a company's page on the SDL Developer Portal (in the box titled Webhook URL under Company Info) to be hit by the SHAID server when an app has been updated.

### `POST /permissions/update`
This route queries SHAID for an update to the list of app permissions in the policy server.

### `GET /permissions/unmapped`
This route returns a list of permissions that are currently not attributed to any functional groups.

### `POST /groups` & `POST /messages`
These routes are hit by the policy server UI to update a functional group's/consumer message's information or to change its deleted status.

### `POST /groups/promote` & `POST /messages/promote`
These routes are hit by the policy server UI to promote a functional group or consumer message from staging to production. If the functional group has a user consent prompt associated with it then the consent prompt must be promoted to production before promoting the functional group.

### `POST /messages/update`
This route updates the policy server's list of languages.

## UI endpoints
These are API routes that are accessed by the policy server user interface.

### `/applications`
The [Applications](../UI/Applications/index.md) page.
### `/applications/:id`
The App Details page with information regarding an app specified by the **id**. The Applications page documentation contains more information pertaining to this page.
### `/policytable`
The [View Policy Table](../UI/View%20Policy%20Table/index.md) page.
### `/functionalgroups`
The [Functional Groups](../Messages%20and%20Function%20Groups/index.md) page.
### `/functionalgroups/manage`
The Functional Group Details page with information regarding a functional group that is specified by an **id**. The Functional Groups page documentation contains more information pertaining to this page.
### `/consumermessages`
The [Consumer Friendly Messages](../Messages%20and%20Function%20Groups/index.md) page.
### `/consumermessages/manage`
The Consumer Message Details page with information regarding a consumer message that is specified by an **id**. The Consumer Messages page documentation contains more information pertaining to this page.