### Building SQL Table From Policy Table
This project consists of two SQL tables called message_text and languages. The message_text table consists of columns containing the language_name, message_category, tts, line1, line2, and text_body. They can be created with the script but are not required to be. If the tables already exist, leave the commented code as commented. Otherwise uncomment it.
	The languages table consists of several properties including:

| Property Name   | Definition|
|-----------------|:----------|
| *language_name* | specifies the region and language that the message is in, ex. “en-us”|
| *message_category* | indicates the type of message being delivered, ex. “AppPermissions”|
| *status* | status of the server, ex. “Staging”, “Production”|
| *tts* | text-to-speech message to be read to the user, ex. “This version of %appName% is not authorized and will not work with SDL”|
| *created_ts* | timestamp for when the item was created|
| *updated_ts* | timestamp for when the item was updated|
| *text_body* | the bulk of the message, ex. “This version of %appName% is not authorized and will not work with SDL”|
| *line1* | first line of the message, ex. “Grant requested”|
| *line2* | second line of the message, ex. “Permissions?”|
| *label* | marker signifying the type of message, ex. "Vehicle information"|

The languages table is a single column table and contains a list of valid languages available in the policy table.

|Property Name | Definition |
|--------|:------|
| *name* | 5 character string specifying the language and region, ex. “en-us”|