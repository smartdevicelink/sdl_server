These are the API routes that the policy server exposes.

### `GET /api/v1/request` 
Queries SHAID for updated application information. This route automatically gets called on server start up.
WebHook integration is planned for future releases so that this updating application process can be automatic.

### `POST /api/v1/staging/policy` 
This is the route sdl_core's default policy table should use when requesting a policy table update. 
Given a "shortened" policy table, the policy server will use that information to automatically construct a full policy table response and return it to the requester. Only a staging route is accessible because there is currently no difference between a staging mode and production mode policy request. Changes are also planned in the future for these routes.
