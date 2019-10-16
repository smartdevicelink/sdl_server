/*  db-migrate create -e pg-staging categories-add-name */

/**
//shaid.application_category_lkp
// id,name,display_name
// 1,DEFAULT,Default
// 2,COMMUNICATION,Communication
// 3,MEDIA,Media
// 4,MESSAGING,Messaging
// 5,NAVIGATION,Navigation
// 6,INFORMATION,Information
// 7,SOCIAL,Social
// 8,BACKGROUND_PROCESS,Background Process
// 9,TESTING,Testing
// 10,SYSTEM,System
// 11,PROJECTION,Projection
// 12,REMOTE_CONTROL,Remote Control
 */
/**
//sdl_server.categories
// id,display_name
// 1,Default
// 2,Communication
// 3,Media
// 4,Messaging
// 5,Navigation
// 6,Information
// 7,Social
// 8,Background Process
// 9,Testing
// 10,System
 */


ALTER TABLE categories ADD name TEXT;

UPDATE categories set name = 'DEFAULT' WHERE id = 1;
UPDATE categories set name = 'COMMUNICATION' WHERE id = 2;
UPDATE categories set name = 'MEDIA' WHERE id = 3;
UPDATE categories set name = 'MESSAGING' WHERE id = 4;
UPDATE categories set name = 'NAVIGATION' WHERE id = 5;
UPDATE categories set name = 'INFORMATION' WHERE id = 6;
UPDATE categories set name = 'SOCIAL' WHERE id = 7;
UPDATE categories set name = 'BACKGROUND_PROCESS' WHERE id = 8;
UPDATE categories set name = 'TESTING' WHERE id = 9;
UPDATE categories set name = 'SYSTEM' WHERE id = 10;
/** 11 and 12 will be imported automatically on server startup or as part of a cron job **/

ALTER TABLE categories ALTER COLUMN name SET NOT NULL;
