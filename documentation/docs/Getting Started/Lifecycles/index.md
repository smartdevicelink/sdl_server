It will be helpful to understand what the policy server is doing behind the scenes before modifying the source code. This section will describe what tasks the policy server does under certain conditions.

## On Startup
One of the first things the policy server does is load all the custom modules that are defined in the `server/config.js` file. There are currently four types of customizable modules that the server loads:

* `server/custom/loggers`: Logger modules define how messages from the policy server are handled. The default logger is `winston` and logs everything to `server/policy_logs.log` as well as color codes logs in the console with timestamps.
* `server/custom/databases`: Database modules allow the policy server to connect to a database of the developer's choice, under the constraint that it is a SQL database. The default module is `postgres` which uses environment variables specified [[here|https://github.com/smartdevicelink/sdl_server/wiki/Installation]] to forward SQL queries to a pool of clients connected to the database. 
* `server/custom/data-collectors`: These modules are a source of information for the policy server, such as country data, permissions, and HMI levels. The default module is `shaid` and is vital for the functional operation of the server, as it talks to SHAID for relevant information. Additional modules can be created and chained together to provide more information than what the `shaid` module currently has.
* `server/custom/policy-builders`: This is the most versatile custom module. These modules are responsible for constructing the policy table. The `default` module implements some required functions that instruct it to create certain pieces of the policy table. The policy server will take care of storing and retrieving that data when necessary.

After loading, the policy server will undergo an update cycle. An update cycle synchronizes information between data sources like SHAID and the policy server. Examples include country information, and permissions. 

After the update cycle, functional groups are generated or updated. Functional groups contain permissions that get assigned to application IDs in order to permit apps to using data. These functional groups are generated with the help of the `policy-builder` modules.

After functional groups are updated, 3 of 4 parts of the policy table are generated and stored in memory: the module config object, the consumer friendly messages object, and the functional groups object. These objects are not expected to change throughout the lifetime of the policy server. If changes are made that would cause any of those three objects to be changed, then the policy server needs to be restarted for those changes to take effect. 

Finally, the function invoked by `/api/v1/request` is hit which will update application information by querying SHAID for all applications. In future releases WebHooks will be used in replacement to put less load on SHAID and the policy server.


## On Evaluate Application Request
Every application that the policy server receives undergoes an evaluation. If there is information in the application that the policy server doesn't know about (ex. A country code that isn't recorded in the policy server's database) then one attempt will be made to update information. If after the update there still is information unknown about the application it will not be stored. 

Otherwise, the application request will be set to a PENDING approval state and stored in the database if its timestamp is later than the timestamp of the same app uuid stored in the database. 

## On Policy Table Update
If the `/api/v1/policy` endpoint gets hit then the requester wants a policy table update. First, basic validation happens to make sure the format of the request is correct. Then, the policy table is constructed and sent back as a response.

The consumer friendly messages, the module config, and the functional groups are already built, so there's no extra computation needed there. The app policies object needs extra logic because that object is where applications are given or denied permissions. 

For now, all applications are given permissions by default only if their uuid is found in the policy server database. The approved uuids are then looked up in the database and the full application is reconstructed. Next, the app policies object is constructed using the information from the applications. The policy server hands off this work to the `policy-builders` module. When finished, the policy server sends the full policy table as a response.
