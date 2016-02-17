[![Slack Status](http://sdlslack.herokuapp.com/badge.svg)](http://slack.smartdevicelink.org)
# SmartDeviceLink (SDL)

SmartDeviceLink (SDL) is a standard set of protocols and messages that connect applications on a smartphone to a vehicle head unit. This messaging enables a consumer to interact with their application using common in-vehicle interfaces such as a touch screen display, embedded voice recognition, steering wheel controls and various vehicle knobs and buttons. There are three main components that make up the SDL ecosystem.

  * The [Core](https://github.com/smartdevicelink/sdl_core) component is the software which Vehicle Manufacturers (OEMs)  implement in their vehicle head units. Integrating this component into their head unit and HMI based on a set of guidelines and templates enables access to various smartphone applications.
  * The optional [SDL Server](https://github.com/smartdevicelink/sdl_server) can be used by Vehicle OEMs to update application policies and gather usage information for connected applications.
  * The [iOS](https://github.com/smartdevicelink/sdl_ios) and [Android](https://github.com/smartdevicelink/sdl_android) libraries are implemented by app developers into their applications to enable command and control via the connected head unit.

<a href="http://www.youtube.com/watch?feature=player_embedded&v=AzdQdSCS24M" target="_blank"><img src="http://i.imgur.com/nm8UujD.png?1" alt="SmartDeviceLink" border="10" /></a>

## SDL Server

The SmartDeviceLink (SDL) server handles authentication, data collection, and basic configurations for SDL connected vehicles.  In general, these tasks are accomplished using JSON documents called Policy Tables, which the [SDL Core component](https://github.com/smartdevicelink/sdl_core) uses to validate messaging with connected applications. The Policy Tables are configured on the SDL server, downloaded through the SDL Proxy and passed along to [SDL Core](https://github.com/smartdevicelink/sdl_core).

## Current Status
SDL Server is a reference server to help developers understand how SDL works.  It is **NOT** meant to be a production server.

## Important Notices
**Policy Table Format:** SDL Policy Tables have a very specific format that must be followed.  The current code has not yet been tested with SDL [core](https://github.com/smartdevicelink/sdl_core) and therefore may have bugs related to the Policy Table format and/or data.  Do **not** rely on the current Policy Table endpoint response values at this time.

**Encrypted vs Plain Text:** SDL Policy Tables can be downloaded and transferred to SDL [core](https://github.com/smartdevicelink/sdl_core) in a proprietary format or as plain text.  A proprietary format consist of symmetrically encrypted packets, to which only your SDL server and core hold the key.

# Getting Started
A quick guide to installing, configuring, and running an instance of the SDL server.

  1. Install [Node.js](http://nodejs.org/) and [Git](https://git-scm.com/).
  2. Clone the sdl server repository.

        git clone https://github.com/smartdevicelink/sdl_server.git
 
  3. Navigate to the repository and install all npm and bower modules.

        cd sdl_server
        npm install

  4. Start the server

        npm start

  5. Go to [localhost:3000](http://localhost:3000) in your browser.  You can make example policy table update requests.