# SmartDeviceLink (SDL)

SmartDeviceLink (SDL) is a way to connect applications on a smart phone to a vehicle so they can be controlled by a vehicle's head unit.  There are three main pieces to SDL - [core](https://github.com/smartdevicelink/sdl_core) (head unit), [mobile libraries](https://github.com/smartdevicelink/sdl_android), and the [server](https://github.com/smartdevicelink/sdl_server).  

## SDL Server

The SmartDeviceLink (SDL) server handles authentication, data collection, and basic configurations for SDL connected vehicles.  In general these tasks are accomplished using JSON documents called [Policy Tables]() that are configured by the server and then downloaded by other SDL components.  The server's backend API (written in node.js) handles these types of requests and can be easily extended to handle more.  Configuration of Policy Tables, or any other data, can be done using the server's front-end GUI (written in Angular.js).  Customization of the front-end with your own look and feel is encourage and worry-free because these changes will not affect the underlying functionality of the server.

**tl;dr**

Javascript backend and front-end used for authentication and data collection for SDL devices.

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
