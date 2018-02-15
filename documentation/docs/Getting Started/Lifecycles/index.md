It will be helpful to understand what the policy server is doing behind the scenes before modifying the source code. This section will describe what tasks the policy server does under certain conditions.

## On Startup
One of the first things the policy server does is load all the custom modules that are defined in the `config.js` file. There are currently four types of customizable modules that the server loads:

* `custom/loggers`: Logger modules define how messages from the policy server are handled. The default logger is `winston` and logs everything to `server/policy_logs.log` as well as color codes logs in the console with timestamps.
* `custom/databases`: Database modules allow the policy server to connect to a database of the developer's choice, under the constraint that it is a SQL database. The default module is `postgres` which uses environment variables specified in the installation page to forward SQL queries to a pool of clients connected to the database. 

After loading, the policy server will undergo an update cycle. An update cycle synchronizes information between data sources like SHAID and the policy server. Examples include country information, and permissions. 

After the update cycle, functional groups are generated or updated. Functional groups contain permissions that get assigned to application IDs in order to permit apps to using data.

Finally, the function invoked by shaid.queryAndStoreApplications is called which will update application information by querying SHAID for all applications. A Cron job is set up so as to update the application information and the list of languages daily at midnight.

## On Evaluate Application Request
Every application that the policy server receives undergoes an evaluation. If there is information in the application that the policy server doesn't know about (ex. A country code that isn't recorded in the policy server's database) then one attempt will be made to update information. If after the update there still is information unknown about the application it will not be stored. 

Otherwise, the application request will be set to a PENDING approval state and stored in the database if its timestamp is later than the timestamp of the same app uuid stored in the database. 

## On Policy Table Update
If the `/staging/policy` or the `/production/policy` endpoint gets hit then the requester wants a policy table update. First, basic validation happens to make sure the format of the request is correct. Then, the policy table is constructed according to the specified environment and sent back as a response.

The consumer friendly messages, the module config, and the functional groups are already built, so there's no extra computation needed there. The app policies object needs extra logic because that object is where applications are given or denied permissions. 

For now, all applications are given permissions by default only if their uuid is found in the policy server database. The approved uuids are then looked up in the database and the full application is reconstructed. Next, the app policies object is constructed using the information from the applications. When finished, the policy server sends the full policy table as a response.
