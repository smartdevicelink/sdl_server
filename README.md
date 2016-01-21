[![Slack Status](http://sdlslack.herokuapp.com/badge.svg)](http://slack.smartdevicelink.org)
# SmartDeviceLink (SDL)

SmartDeviceLink (SDL) is a standard set of protocols and messages that connect applications on a smartphone to a vehicle head unit. This messaging enables a consumer to interact with their application using common in-vehicle interfaces such as a touch screen display, embedded voice recognition, steering wheel controls and various vehicle knobs and buttons. There are three main components that make up the SDL ecosystem.

  * The [Core](https://github.com/smartdevicelink/sdl_core) component is the software which Vehicle Manufacturers (OEMs)  implement in their vehicle head units. Integrating this component into their head unit and HMI based on a set of guidelines and templates enables access to various smartphone applications.
  * The optional [SDL Server](https://github.com/smartdevicelink/sdl_server) can be used by Vehicle OEMs to update application policies and gather usage information for connected applications.
  * The [iOS](https://github.com/smartdevicelink/sdl_ios) and [Android](https://github.com/smartdevicelink/sdl_android) libraries are implemented by app developers into their applications to enable command and control via the connected head unit.


## SDL Server

The SmartDeviceLink (SDL) server handles authentication, data collection, and basic configurations for SDL connected vehicles.  In general, these tasks are accomplished using JSON documents called Policy Tables, which the [SDL Core component](https://github.com/smartdevicelink/sdl_core) uses to validate messaging with connected applications. The Policy Tables are configured on the SDL server, downloaded through the SDL Proxy and passed along to [SDL Core](https://github.com/smartdevicelink/sdl_core).

## Current Status

**Development:**  SDL server is currently in development and not yet ready for production use.  Please help us develop it by submitting your ideas and/or pull-requests.

## Important Notices
**Policy Table Format:** SDL Policy Tables have a very specific format that must be followed.  The current code has not yet been tested with SDL [core](https://github.com/smartdevicelink/sdl_core) and therefore may have bugs related to the Policy Table format and/or data.  Do **not** rely on the current Policy Table endpoint response values at this time.

**Encrypted vs Plain Text:** SDL Policy Tables can be downloaded and transferred to SDL [core](https://github.com/smartdevicelink/sdl_core) in a proprietary format or as plain text.  A proprietary format consist of symmetrically encrypted packets, to which only your SDL server and core hold the key.

# Getting Started
A quick guide to installing, configuring, and running an instance of the SDL server.

  1. Install [Node.js](http://nodejs.org/) and [NPM](https://www.npmjs.org/), you can use this [guide](https://github.com/smartdevicelink/sdl_server/wiki/Install-Node.js).
  2. Install or setup a [MongoDB](http://docs.mongodb.org/manual/installation/) Database.
  4. Install the dependancies:  `git`, `make`, and `g++`
  
       For Ubuntu: `sudo apt-get install git make g++` 
 
  3. Install Fox.js, a framework used to run the SDL server.

        npm -g install foxjs
 
  4. Download and install a new instance of the SDL server.
    
        fox new MyServerName sdl_server -- -i

      The server is now started and you can view it by going to [localhost:3000](http://localhost:3000) in your browser.  If the fox command does not work, checkout the [help](https://github.com/smartdevicelink/sdl_server/wiki/Help#fox_is_not_installed_error_message_in_Linux) page for more info.

  5. Configure the server using the `/server/configs/config.js` file.  As you save changes to the server's files it will automatically restart applying the changes.


## Start Server
A server can be started by issuing the start command from anywhere within the project folder.

    fox start

By default the server will start in production mode.  You can specify different node environments using CLI switches.

* `-l`:  **Local** mode starts the server using nodemon at the IP address "localhost" using the local database.  Debug mode is also enabled.
* `-d`:  **Development** mode starts the server using pm2 in a production like mode using a development database.  Debug mode is also enabled.
* `-p`:  **Production** mode starts the server using pm2 in a production mode using the production database.  Debug mode is disabled.

So for example we can start the server in local mode:

    fox start -l
