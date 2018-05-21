## About
The SDL Policy Server helps manage functional groups for the user. Using the UI, groups of permissions can be easily created and tested. Each functional group represents a collection of permissions that should be granted together when incoming application requests sets of permissions. How these apps get the correct functional groups is another part of the problem, and the SDL Policy Server automatically handles that for the user.

## Factors
An application must be granted its permissions in order for functional groups to be assigned to it. An application is granted permissions if that application version's approval state is in STAGING or in ACCEPTED, and the difference between the states is whether that application's permissions are granted when using only the staging policy table or when using both staging and production policy tables. 

Incoming applications will request specific permissions (ex. Alert, Show, speed, gps) in a certain HMI level. The permission requested and the HMI level requested must both be present in a functional group for that functional group to be eligible for being granted to the user. For every permission that is granted by an application, the server will search through all functional groups to find ones matching that permission and HMI level. If there is a match found, that functional group and all other permissions found in that group will be granted to the user. 

Any functional group that is checked to be granted to all applications by default will automatically be given to all applications that are not blacklisted.

When using the staging policy table, the functional groups that are available for assignment will be the same functional groups seen in the Functional Groups UI menu in STAGING mode. Similarly, the production policy table uses the functional groups seen in PRODUCTION mode.

## Example
An application comes in requesting permissions for the vehicle data `gps` in `HMI_BACKGROUND`. The application's approval state is in ACCEPTED. 

The functional groups in STAGING mode include the following:
1. Contains gps in HMI levels FULL, LIMITED, BACKGROUND. Contains speed in HMI level FULL
2. Contains gps in HMI levels FULL, LIMITED, BACKGROUND. Contains rpm in HMI level FULL

The functional groups in PRODUCTION mode include the following:
1. Contains gps in HMI levels FULL, LIMITED. Contains speed in HMI level FULL
2. Contains gps in HMI levels FULL, LIMITED, BACKGROUND. Contains rpm in HMI level FULL

If the STAGING policy table is requested, the application is allowed permissions because the approval state is ACCEPTED. It will potentially receive functional groups in STAGING mode. It gets functional group #1 and #2 because both contain the requested `gps` permission in `HMI_BACKGROUND`. It also gets `speed` in HMI level FULL and `rpm` in HMI level FULL.

If the PRODUCTION policy table is requested, the application is allowed permissions because the approval state is ACCEPTED. It will potentially receive functional groups in PRODUCTION mode. It gets functional group #2 because only #2 contains the requested `gps` permission in `HMI_BACKGROUND`. It also gets `rpm` in HMI level FULL. If the approval state was STAGING, it would only get the default functional groups, and there are none in this case. 
