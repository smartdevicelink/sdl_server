<!-- Copyright (c) 2019, Livio, Inc. -->
<template>

    <div class="rpc-container white-box left-border"
        v-bind:class="{ 'alt-bg-color': level % 2 === 0 }"> <!-- alternate background colors on every level deeper -->
        <h5>
            {{ item.name || '&nbsp;' }}
            <!-- delete this item -->
            <i
                v-if="!fieldsDisabled && index !== undefined"
                class="pointer pull-right fa fa-times hover-color-red"
                aria-hidden="true"
                v-on:click="removeFromParent(index)">
            </i>
        </h5>

        <!-- Iterate over every property in item and render it depending on its content -->
        <div v-for="(param, propName) in item" v-bind:key="propName">
            <!-- Vehicle String type. Vehicle Strings cant or shouldn't have names matching vehicle parameters -->
            <template v-if="getPropType(propName) === 'VehicleString'">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">{{ propsDisplay[propName].display.toUpperCase() }}</label>
                    <div class="col-sm-10">
                        <input v-model="item[propName]" :disabled="fieldsDisabled || (level === 1 && item.id)" class="form-control"
                            @input="updateNameOrKey(propName, $event.target.value)">
                    </div>
                    <p v-if="findCommonParams(item[propName]) === 'CUSTOM'">
                        <br>A parent or top level vehicle data item with this name already exists! By saving, you will overwrite the previously existing vehicle data.
                    </p>
                    <div v-if="findCommonParams(item[propName]) === 'NATIVE'">
                        <br>
                        <p class="alert color-bg-red color-white d-table" role="alert">
                            A parameter in the RPC spec with this name already exists!
                        </p>
                    </div>
                </div>
            </template>

            <!-- Vehicle Type type. They must have specific values which are passed into this component -->
            <template v-if="getPropType(propName) === 'VehicleType'">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">{{ propsDisplay[propName].display.toUpperCase() }}</label>
                    <div class="col-sm-10">
                        <b-form-select
                            v-model="item[propName]"
                            :options="vehicleDataTypeOptions"
                            :disabled="fieldsDisabled"
                            class="custom-select">
                        </b-form-select>
                    </div>
                </div>
            </template>

            <!-- String type -->
            <template v-if="getPropType(propName) === 'String'">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">{{ propsDisplay[propName].display.toUpperCase() }}</label>
                    <div class="col-sm-10">
                        <input v-model="item[propName]" :disabled="fieldsDisabled" class="form-control"
                            @input="updateNameOrKey(propName, $event.target.value)">
                    </div>
                </div>
            </template>

            <!-- Boolean type -->
            <template v-if="getPropType(propName) === 'Boolean'">
                <div class="form-group row center-element">
                    <b-form-checkbox
                        class="color-primary"
                        v-model="item[propName]"
                        v-bind:disabled="fieldsDisabled || isTopLevelMandatory(propName)">
                        {{ propsDisplay[propName].display.toUpperCase() }}
                    </b-form-checkbox>
                    <p v-if="isTopLevelMandatory(propName)"
                        class="form-group">
                        Must be false for the root level
                    </p>
                </div>
            </template>

            <!-- Natural + Zero Number type, or Integer type -->
            <template v-if="getPropType(propName) === 'ZeroNatural'
                || getPropType(propName) === 'Integer'">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">{{ propsDisplay[propName].display.toUpperCase() }}</label>
                    <div class="col-sm-4">
                        <input class="form-control text-truncate"
                           :disabled="fieldsDisabled"
                           @input="getPropType(propName) === 'ZeroNatural' ?
                                updateZeroNaturalNumber(propName, $event.target.value)
                                : updateIntegerNumber(propName, $event.target.value)"
                           v-model="item[propName]">
                    </div>
                </div>
            </template>

        </div>

        <!-- Nested Schema Item component render -->
        <div v-for="(param, paramIndex) in item.params" v-bind:key="paramIndex">
            <vehicle-data-item
                v-bind:item="param"
                :fieldsDisabled="fieldsDisabled"
                :index="paramIndex"
                :items="item.params"
                :removeFromParent="removeItem"
                :vehicleParams="vehicleParams"
                :topLevelVehicleNames="topLevelVehicleNames"
                :vehicleDataTypes="vehicleDataTypes"
                :level="level + 1"
            ></vehicle-data-item>
        </div>

        <!-- Allows adding nested parameters under certain conditions -->
        <template v-if="!fieldsDisabled && allowNestedParams">
            <!-- divider line -->
            <div class="rpc-container"></div>
            <div class="another-rpc pointer" v-on:click="addParam()">
                <i class="fa fa-plus middle-middle"></i>
            </div>
        </template>

    </div>
</template>

<script>
    export default {
        props: ['item', 'index', 'fieldsDisabled', 'removeFromParent', 'vehicleParams', 'topLevelVehicleNames',
            'pardonedName', 'vehicleDataTypes', 'level'],
        data() {
            return {
                'propsDisplay': {
                    'name': { 'display': '* Name', 'type': 'VehicleString' },
                    'type': { 'display': '* Type', 'type': 'VehicleType' },
                    'key': { 'display': '* Key', 'type': 'String' },
                    'mandatory': { 'display': 'Is Mandatory', 'type': 'Boolean' },
                    'min_length': { 'display': 'Min Length', 'type': 'ZeroNatural' },
                    'max_length': { 'display': 'Max Length', 'type': 'ZeroNatural' },
                    'min_size': { 'display': 'Min Size', 'type': 'ZeroNatural' },
                    'max_size': { 'display': 'Max Size', 'type': 'ZeroNatural' },
                    'min_value': { 'display': 'Min Value', 'type': 'Integer' },
                    'max_value': { 'display': 'Max Value', 'type': 'Integer' },
                    'array': { 'display': 'Is Array', 'type': 'Boolean' },
                    'params': { 'display': 'Parameters', 'type': 'Struct' },
                },
            };
        },
        computed: {
            vehicleDataTypeOptions: function () {
                return this.vehicleDataTypes.map(function (vdt) {
                    return vdt.name;
                });
            },
            allowNestedParams: function () {
                const selectedType = this.item.type;

                const foundType = this.vehicleDataTypes.find(vdt => vdt.name === selectedType);
                if (!foundType) {
                    return false;
                }

                return foundType.allow_params;
            }
        },
        methods: {
            isTopLevelMandatory: function (propName) {
                return propName === "mandatory" && this.level === 1;
            },
            updateZeroNaturalNumber: function (propName, val) {
                if (isNaN(val) || val === "") {
                    return this.item[propName] = null;
                }
                this.item[propName] = Math.max(0, Math.round(val));
            },
            updateNameOrKey: function (propName, val) {
                // Checks for the invalid characters "!@#$%^&*", and whitespace characters that would be rejected by SDL Core
                if (/[!@#$%^&*\s]/g.test(val)) {
                    return this.item[propName] = null;
                }
            },
            updateIntegerNumber: function (propName, val) {
                if (val === "-") {
                    return val;
                }
                if (isNaN(val) || val === "") {
                    return this.item[propName] = null;
                }
                this.item[propName] = Math.round(val);
            },
            removeItem: function (index) {
                this.item.params.splice(index, 1); //remove the specific element from the array
            },
            getPropType: function (prop) {
                if (!this.propsDisplay[prop]) {
                    return null; //prop not found in our list. ignore it
                }
                return this.propsDisplay[prop].type;
            },
            addParam: function() {
                const newItem = {};

                for (let prop in this.propsDisplay) {
                    //make a new object using propsDisplay and its default values
                    switch (this.propsDisplay[prop].type) {
                        case 'Struct':
                            newItem[prop] = []; //make a new array object reference for structs
                            break;
                        case 'Boolean':
                            newItem[prop] = false;
                            break;
                        default:
                            newItem[prop] = null; //just use null for all other cases
                    }
                }

                this.item.params.push(newItem);
            },
            //will check multiple sources for duplicate names
            findCommonParams: function (name) {
                //first phase: check vehicle parameters for native matches, found in functional group info
                let foundName = this.vehicleParams.find(vp => vp.name === name);

                //ignore pardoned name
                if (foundName && (foundName.name !== this.pardonedName)) {
                    if (!foundName.is_custom) {//only care about native params in the vehicleParams list
                        return "NATIVE"; //match found, and its a native vehicle parameter!
                    }
                }

                //second phase: check for the top level vehicle names created in Custom Vehicle Data
                let foundVehicleName = this.topLevelVehicleNames.find(vn => vn === name);

                //ignore pardoned name and if this schema item isn't the top level schema item
                if (foundVehicleName && (foundVehicleName !== this.pardonedName) && this.level === 1) {
                    return "CUSTOM"; //match found, but its a name the user has created
                }

                return "NONE"; //no match!
            }
        },
    };
</script>

<style scoped>
    .center-element {
        align-items: center;
        display: flex;
    }
</style>