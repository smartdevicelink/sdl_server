The policy table json is taken from https://github.com/smartdevicelink/sdl_core/blob/develop/src/appMain/sdl_preloaded_pt.json
There are custom modifications to this table that exist for this policy server. See below for details.

POLICY TABLE DIFFERENCES (10/11/2017)
removed Notifications-RC group obj
added DialNumberOnlyGroup group obj with a DialNumber RPC given FULL and LIMITED
removed moduleType property in app_policies object

POLICY TABLE DIFFERENCES (10/25/2017)
Notifications functional group now includes FULL and LIMITED hmi levels

POLICY TABLE DIFFERENCES (11/2/2017)
BackgroundAPT functional group now includes FULL and LIMITED hmi levels in all its RPCs

POLICY TABLE DIFFERENCES (11/7/2017)
added OnWayPointChange RPC to WayPoints functional group with hmi levels BACKGROUND, FULL and LIMITED

POLICY TABLE NOTICE (11/29/2017)
vin for OnVehicleData is an allowable state. Currently in VehicleInfo-3

POLICY TABLE DIFFERENCES (3/28/2018)
Updated policy table module config URLs to be generic
Replaced references to "Ford" and "SYNC"