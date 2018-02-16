It will be helpful to understand what the policy server is doing behind the scenes before modifying the source code. This section will describe what tasks the policy server does under certain conditions.

## On Startup
Upon startup, the policy server will undergo an update cycle. An update cycle synchronizes information between data sources like SHAID and the policy server. Language code information is retrieved from the SDL [RPC spec](https://raw.githubusercontent.com/smartdevicelink/rpc_spec/master/MOBILE_API.xml).

Finally, the function invoked by shaid.queryAndStoreApplications is called which will update application information by querying SHAID for all applications. A Cron job is set up so as to update the application information and the lists of languages and permissions daily at midnight.

## On Policy Table Update
If the `/staging/policy` or the `/production/policy` endpoint gets hit then the requester wants a policy table update. First, basic validation happens to make sure the format of the request is correct. Then, the policy table is constructed according to the specified environment and sent back as a response.

The consumer friendly messages, the module config, and the functional groups are already built, so there's no extra computation needed there. The app policies object needs extra logic because that object is where applications are given or denied permissions. 

For now, all applications are given permissions by default only if their uuid is found in the policy server database. The approved uuids are then looked up in the database and the full application is reconstructed. Next, the app policies object is constructed using the information from the applications. When finished, the policy server sends the full policy table as a response.
