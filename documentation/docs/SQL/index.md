## PostgreSQL
The Policy Server uses a <a href="https://www.postgresql.org/about/">PostgreSql</a> database to store, retrieve, and update information. 

## Migrations
All scripts for the intial data migration are located in the migrations folder. The scripts necessary to build or reset the database are found there. As of May 2018, there are 25 tables created by the migration scripts. Ensure that all are accounted for. 

![Tables](./assets/PostgreSQL-Tables.png)

## Database Alterations
Any action that generates newly created or updated data, such as modifying a consumer message, will first generate a SQL statement to execute the desired query. The Policy Server generates these statements with the npm module <a href="https://www.npmjs.com/package/sql-bricks-postgres">sql-bricks-postgres</a>.