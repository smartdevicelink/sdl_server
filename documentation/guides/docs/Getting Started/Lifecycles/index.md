## On Startup
When the Policy Server starts up, it will try to update its current information by using external sources such as SHAID. It will do the following:

* Update the permission list and permission relationships. These permissions include RPCs, vehicle parameters and module types.
* Generate a functional group template for use in future queries. After the permission information is updated, some templates will be generated that are used for quickly responding to the UI's requests for functional group data.
* Update language information. Language code information is retrieved from the SDL [RPC spec](https://raw.githubusercontent.com/smartdevicelink/rpc_spec/master/MOBILE_API.xml), specified in `settings.js`. This is used for the consumer friendly messages object.
* Query and store SHAID applications. The Policy Server will grab new or updated application information from SHAID and store it in the Policy Server's database.
* After all tasks above have been completed, expose the UI and API routes for the Policy Server. It is important that the Policy Server receives all the information above before allowing requests from Core to happen.
* Set up cron jobs for updating permission information, for generating templates and for updating the languages. The Policy Server does not need a cron job for getting new application information from SHAID because of webhooks.

