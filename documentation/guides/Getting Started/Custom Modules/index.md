The Policy Server allows for some extra configuration through the use of custom modules. The Policy Server relies on these modules for logging and querying tasks, and so the ability to write a new module allows for great flexibility in how these tasks are handled. 

## Loggers
Only two named functions need to be exported in an object for a valid implementation: `info` and `error`. `info` accepts a string as its first parameter and is used to log non-error messages using the string. `error` accepts a string and is used for logging error messages using the string. Check the default `winston` module for an example.

## Databases
Currently only PostgreSQL has been tested enough to be considered a usable type of database for the Policy Server. See the default `postgres` module for an example.  