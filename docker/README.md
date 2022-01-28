### Docker Compose Installation

[Docker Engine is required to be installed.](https://docs.docker.com/engine/install/) This folder contains all the files needed to set up the policy server through docker images. The `docker-compose.yml` file will spin up the server, the Postgres database, and the Redis database and automatically connect them all (if redis is enabled). The policy server is made available on `http://localhost:3000`.

### Environment Variables
An `.env` file is expected in this directory, and the Dockerfile will pull in all environment variables from that file, just like how the policy server uses the `.env` file in the root directory. The Dockerfile uses the remote sdl_server repository instead of the local installation. The branch can be changed by changing the `docker-compose.yml` file's arg VERSION value: its default is the master branch.

The following are notable `.env` variables to the docker environment. They are not a comprehensive list. The usual variables such as `SHAID_PUBLIC_KEY` and `SHAID_SECRET_KEY` are still required for usage.

| Name               | Type   | Usage          | Description                                                               |
|--------------------|--------|------------------|---------------------------------------------------------------------------|
| DB_PASSWORD | String | Postgres      | Required to use the Postgres database container |
| DB_HOST | String | Postgres      | Please set this value to "postgres" in your `.env` file. Only "postgres" will allow the policy server to connect to Postgres.|
| DB_USER | String | Postgres      | Required to use the Postgres database container |
| DB_DATABASE | String | Postgres      | Required to use the Postgres database container |
| CACHE_HOST | String | Redis      | Please set this value to "redis" in your `.env` file. Only "redis" will allow the policy server to connect to Redis.|
| BUCKET_NAME | String | WebEngine app support      | The name of the S3 bucket to store app bundles |
| AWS_REGION | String | WebEngine app support      | The region of the S3 bucket |
| AWS_ACCESS_KEY_ID | String | WebEngine app support      | [AWS credentials to allow S3 usage](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-environment.html). These are exclusive to the docker install of the policy server! |
| AWS_SECRET_ACCESS_KEY | String | WebEngine app support      | [AWS credentials to allow S3 usage](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-environment.html). These are exclusive to the docker install of the policy server! |

Note the nearly empty `keys` subfolder. Insert your own key and pem files meant for the certificate generation feature in there, and the contents will be copied into the docker container policy server's  `customizable/ca` folder. You will still need the necessary environment variables to activate certificate generation.

### Commands
To start a new or existing cluster, remembering to rebuild the policy server image in case of .env changes:
`docker compose up --build`
Use Ctrl+C once to stop all the docker containers. 

To tear down a cluster without removing the volume (this will delete the database contents!):
`docker compose down`

To tear down a cluster and remove the volume (this will delete the database contents!):
`docker compose down -v`

