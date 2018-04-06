# Functional Groupings
Before an application can use each feature offered by SDL it must first be granted permission to do so in the Policy Table. Each feature may require several RPCs with specific HMI level permission, as well as allowed parameters and other information.  In order to avoid duplicating this data for each application, SDL instead uses functional groupings.  A functional grouping is simply a group of RPC messages and parameters with specific HMI permissions and allowed parameters.  So for example, if an application named Torque wanted access to vehicle data you would simply add the **VehicleData** functional group to Torque's allowed policies.

## Functional Group
Each functional group is given a unique name (e.g. BasicVehicleData) that is used to reference that group from anywhere within the Policy Table.  Each functional group may contain the following properties.

| Functional Group Property | Type | Description |
| -------- | ---- | ----------- |
| rpcs | Object |  A list of Remote Procedure Calls and their configurations for the current functional grouping. |
| user_consent_prompt | String | References a consumer friendly message prompt that is required to use the RPC.  If this field is not present, then a consumer friendly message prompt is **not** required. |

## RPCS
Each RPC in the **rpcs** property has a unique name that represents an existing RPC  (e.g. AddSubMenu).  In each RPC object there may be the following properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| hmi_levels | Array | An ordered list of [HMI levels](../application-policies/#Application-HMI-Levels) that an application is allowed to use a the RPC command in. |
| parameters | Array | A list of allowed parameters that the application can use with the RPC command. |

## Example
An example of how the Functional Groupings portion of a Policy Table might look.

    "functional_groupings": {
        "Base-1": {
            "rpcs": {
                "AddCommand": {
                    "hmi_levels": [
                        "BACKGROUND",
                        "FULL",
                        "LIMITED"
                    ]
                },
                "AddSubMenu": {
                    "hmi_levels": [
                        "BACKGROUND",
                        "FULL",
                        "LIMITED"
                    ]
                },
                "Alert": {
                    "hmi_levels": [
                        "FULL",
                        "LIMITED"
                    ]
                },
            }
        },
        "VehicleInfo-1": {
            "user_consent_prompt": "VehicleInfo",
            "rpcs": {
                "GetVehicleData": {
                    "hmi_levels": [
                        "BACKGROUND",
                        "FULL",
                        "LIMITED"
                    ],
                    "parameters": [
                        "engineTorque",
                        "externalTemperature",
                        "fuelLevel",
                        "fuelLevel_State",
                        "headLampStatus",
                        "instantFuelConsumption",
                        "odometer",
                        "tirePressure",
                        "vin",
                        "wiperStatus"
                    ]
                },
            }
        }
    }