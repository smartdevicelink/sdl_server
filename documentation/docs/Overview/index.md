# Overview
This document provides the information for creating and integrating the SmartDeviceLink (SDL) server component with the mobile libraries and vehicle's Head Unit (HU).

The SDL server's main purpose is to curate [policy tables](../policy-table/overview) composed of rules and permissions defined by a vehice's OEM.  Each vehicle will download it's policy table and use it to govern SDL behaviors.  Additionaly, SDL servers can be used to gather usage information and provide additional functionality defined by the OEM.

## Example Instance
An instance of the SDL server is hosted at [policies.smartdevicelink.com](http://policies.smartdevicelink.com/policy).

## Abbreviations and Definitions
Abbreviations used in this document are collected in the table below

| Abbreviation | Meaning     |
| :------------- | :------------- |
|BT|Bluetooth|
|GUI|Graphical User Interface|
|HMI|Human Machine Interface|
|IVI|In Vehicle Infotainment|
|JSON|JavaScript Object Notation|
|OEM|Original Equipment Manufacturer|
|RPC|Remote Procedure Call|
|SDE|Software Development Environment|
|SDL|SmartDeviceLink|
|SEE|Software Engineering Environment|
|TTS|Text To Speech|
|VDOP|Vertical Dilution of Precision|
|VR|Voice Recognition|