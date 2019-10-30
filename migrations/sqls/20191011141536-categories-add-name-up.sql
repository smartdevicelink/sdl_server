/*  db-migrate create -e pg-staging categories-add-name */

ALTER TABLE categories ADD name TEXT;