[![Slack Status](http://sdlslack.herokuapp.com/badge.svg)](http://slack.smartdevicelink.org) <a href="https://david-dm.org/smartdevicelink/sdl_server" target="_blank"><img src="https://david-dm.org/smartdevicelink/sdl_server.svg"></a>
# SmartDeviceLink (SDL)

SmartDeviceLink (SDL) is a standard set of protocols and messages that connect applications on a smartphone to a vehicle head unit. This messaging enables a consumer to interact with their application using common in-vehicle interfaces such as a touch screen display, embedded voice recognition, steering wheel controls and various vehicle knobs and buttons. There are three main components that make up the SDL ecosystem.

  * The [Core](https://github.com/smartdevicelink/sdl_core) component is the software which Vehicle Manufacturers (OEMs)  implement in their vehicle head units. Integrating this component into their head unit and HMI based on a set of guidelines and templates enables access to various smartphone applications.
  * The optional [SDL Server](https://github.com/smartdevicelink/sdl_server) can be used by Vehicle OEMs to update application policies and gather usage information for connected applications.
  * The [iOS](https://github.com/smartdevicelink/sdl_ios) and [Android](https://github.com/smartdevicelink/sdl_android) libraries are implemented by app developers into their applications to enable command and control via the connected head unit.

<a href="http://www.youtube.com/watch?feature=player_embedded&v=AzdQdSCS24M" target="_blank"><img src="http://i.imgur.com/nm8UujD.png?1" alt="SmartDeviceLink" border="10" /></a>

## SDL Server

The SmartDeviceLink (SDL) server handles authentication, data collection, and basic configurations for SDL connected vehicles.  In general, these tasks are accomplished using JSON documents called Policy Tables, which the [SDL Core component](https://github.com/smartdevicelink/sdl_core) uses to validate messaging with connected applications. The Policy Tables are configured on the SDL server, downloaded through the SDL Proxy and passed along to [SDL Core](https://github.com/smartdevicelink/sdl_core).

> This implementation of SDL Server is a reference to help developers understand how SDL works.  It is **NOT** meant to be a production server.

> **Encrypted vs Plain Text:** SDL Policy Tables can be downloaded and transferred to SDL [core](https://github.com/smartdevicelink/sdl_core) in a proprietary format or as plain text.  A proprietary format consist of encrypted packets, to which only your SDL server and core hold the key(s).

# Getting Started
A quick guide to setup SDL server can be found at <a href="https://smartdevicelink.com/guides/sdl-server/getting-started/" target="_blank">SmartDeviceLink.com</a>


## Documentation
All documentation can be found at <a href="https://smartdevicelink.com/docs/sdl-server/master/overview/" target="_blank">SmartDeviceLink.com</a>.

## Contribute
If you have a suggestion or bug please submit an <a href="https://github.com/smartdevicelink/sdl_server/issues/new" target="_blank">issue</a>.  You can submit code using a pull request, but please follow the <a href="https://github.com/smartdevicelink/sdl_server/blob/master/CONTRIBUTING.md" target="_blank">contributing guidelines</a>.
