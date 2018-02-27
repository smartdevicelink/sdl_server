[![Slack Status](http://sdlslack.herokuapp.com/badge.svg)](http://slack.smartdevicelink.org) <a href="https://david-dm.org/smartdevicelink/sdl_server" target="_blank"><img src="https://david-dm.org/smartdevicelink/sdl_server.svg"></a>
# SmartDeviceLink (SDL)

SmartDeviceLink (SDL) is a standard set of protocols and messages that connect applications on a smartphone to a vehicle head unit. This messaging enables a consumer to interact with their application using common in-vehicle interfaces such as a touch screen display, embedded voice recognition, steering wheel controls and various vehicle knobs and buttons. There are three main components that make up the SDL ecosystem.

  * The [Core](https://github.com/smartdevicelink/sdl_core) component is the software which Vehicle Manufacturers (OEMs)  implement in their vehicle head units. Integrating this component into their head unit and HMI based on a set of guidelines and templates enables access to various smartphone applications.
  * The optional [SDL Server](https://github.com/smartdevicelink/sdl_server) can be used by Vehicle OEMs to update application policies and gather usage information for connected applications.
  * The [iOS](https://github.com/smartdevicelink/sdl_ios) and [Android](https://github.com/smartdevicelink/sdl_android) libraries are implemented by app developers into their applications to enable command and control via the connected head unit.

<a href="http://www.youtube.com/watch?feature=player_embedded&v=AzdQdSCS24M" target="_blank"><img src="http://i.imgur.com/nm8UujD.png?1" alt="SmartDeviceLink" border="10" /></a>

## SDL Server
The SmartDeviceLink (SDL) server allows the automated construction of policy tables, which the [SDL Core component](https://github.com/smartdevicelink/sdl_core) uses to validate messaging with connected applications. The server communicates with SHAID to maintain updated information about application information and uses that information to help build appropriate policy table responses.

Depending on your needs, you may not require the use of the SDL Server. If you only want to permit all your apps using an sdl_core instance that you control, then you can edit the preloaded policy table to allow this. Edit the default permissions located in this line of the preloaded policy table: https://github.com/smartdevicelink/sdl_core/blob/master/src/appMain/sdl_preloaded_pt.json#L2273

Change the contents of that array to include this instead: 
`
[“Base-4”, “Location-1", “Notifications”, “DrivingCharacteristics-3", “VehicleInfo-3”, “PropriataryData-1", “PropriataryData-2”, “ProprietaryData-3", “Emergency-1”, “Navigation-1", “Base-6”, “OnKeyboardInputOnlyGroup”, “OnTouchEventOnlyGroup”, “DiagnosticMessageOnly”, “DataConsent-2”, “BaseBeforeDataConsent”, “SendLocation”, “WayPoints”, “BackgroundAPT”]
`

# Getting Started
A quick guide to setup the SDL server can be found at <a href="https://smartdevicelink.com/en/guides/sdl-server/getting-started/installation/" target="_blank">SmartDeviceLink.com</a>

## Documentation
All documentation can be found at <a href="https://smartdevicelink.com/en/guides/sdl-server/overview/" target="_blank">SmartDeviceLink.com</a>.

## Contribute
If you have a suggestion or bug please submit an <a href="https://github.com/smartdevicelink/sdl_server/issues/new" target="_blank">issue</a>.  You can submit code using a pull request, but please follow the <a href="https://github.com/smartdevicelink/sdl_server/blob/master/CONTRIBUTING.md" target="_blank">contributing guidelines</a>.
