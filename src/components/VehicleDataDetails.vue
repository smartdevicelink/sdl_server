<!-- Copyright (c) 2019, Livio, Inc. -->
<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <!-- delete modals -->
                <div class="pull-right">
                    <template v-if="environment == 'STAGING' && id != null">
                        <b-btn v-if="vehicle_data.is_deleted == false" v-on:click="showDeleteModal()" class="btn btn-danger btn-sm align-middle">Delete</b-btn>
                        <b-btn v-else v-on:click="showUndeleteModal()" class="btn btn-success btn-sm align-middle">Restore</b-btn>
                    </template>
                </div>

                <div class="functional-content" v-if="vehicle_data">

                    <h4>Custom Vehicle Data Item</h4>

                    <div>
                        Define custom vehicle data params supported by the HMI.
                    </div>

                    <!-- vehicle data loaded here --> 
                    <div class="form-row">
                        <div>
                            <vehicle-data-item
                                :item="vehicle_data"
                                :fieldsDisabled="fieldsDisabled"
                                :vehicleParams="vehicleParams"
                                :topLevelVehicleNames="topLevelVehicleNames"
                                :pardonedName="vehicleNameCopy"
                                :vehicleDataTypes="vehicleDataTypes"
                                :level="1"
                            ></vehicle-data-item>
                        </div>
                    </div>

                    <!-- save button -->
                    <div>
                        <div v-if="namingConflictWithNativeParams(vehicle_data) ">
                            <br>
                            <p class="alert color-bg-red color-white d-table" role="alert">
                                Each name cannot be the same as any parameter name in the RPC spec.
                            </p>
                        </div>

                        <div v-if="!isNameTypeAndKeyDefined(vehicle_data)">
                            <br>
                            <p class="alert color-bg-red color-white d-table" role="alert">
                                All name, type, and key fields must be defined.
                            </p>
                        </div>

                        <div v-if="!noDuplicatesInSameArray(vehicle_data)">
                            <br>
                            <p class="alert color-bg-red color-white d-table" role="alert">
                                Two custom vehicle items cannot have the same name within the same array.
                            </p>
                        </div>
                        
                        <vue-ladda
                            type="submit"
                            class="btn btn-card btn-style-green"
                            data-style="zoom-in"
                            v-if="!fieldsDisabled
                                && !namingConflictWithNativeParams(vehicle_data) 
                                && isNameTypeAndKeyDefined(vehicle_data)
                                && noDuplicatesInSameArray(vehicle_data)"
                            v-on:click="saveVehicleData()"
                            v-bind:loading="save_button_loading">
                            Save custom vehicle data item
                        </vue-ladda>
                    </div>
                </div>

                <!-- DELETE VEHICLE DATA MODAL -->
                <b-modal ref="deleteModal" title="Delete Vehicle Data" hide-footer id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        Are you sure you want to delete this Vehicle Data? By doing so, the Vehicle Data will be immediately removed from the staging policy table, and will be removed from the production policy table upon the next promotion to production.
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-danger"
                        data-style="zoom-in"
                        v-on:click="deleteVehicleData()"
                        v-bind:loading="delete_button_loading">
                        Yes, delete this vehicle data
                    </vue-ladda>
                </b-modal>

                <!-- UNDELETE GROUP MODAL -->
                <b-modal ref="undeleteModal" title="Restore Vehicle Data" hide-footer id="undeleteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        Are you sure you want to restore this Vehicle Data? By doing so, the Vehicle Data will be immediately restored on the staging policy table, and will be restored on the production policy table upon the next promotion to production.
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-success"
                        data-style="zoom-in"
                        v-on:click="undeleteVehicleData()"
                        v-bind:loading="undelete_button_loading">
                        Yes, restore this vehicle data
                    </vue-ladda>
                </b-modal>

            </main>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['id','environment'],
        data() {
            return {
                'showLine': false,
                'showLength': true,
                'deep': 0,
                'integerInput': {
                    'regExp': /^[\D]*|\D*/g, // Match any character that doesn't belong to the positive integer
                    'replacement': ''
                },
                'save_button_loading': false,
                "delete_button_loading": false,
                "undelete_button_loading": false,
                'vehicle_data': {},
                'vehicleNameCopy': '',
                'vehicleParams': [],
                'topLevelVehicleNames': [],
                'vehicleDataTypes': [],
            };
        },
        computed: {
            fieldsDisabled: function () {
                return this.environment !== 'STAGING';
            }
        },
        methods: {
            toTop: function () {
                this.$scrollTo('body', 500);
            },
            environmentClick: function (cb) {
                let queryInfo = "vehicle-data";
                if (!this.id) {
                    queryInfo += "?template=true";
                } else {
                    queryInfo += "?id=" + this.id;
                }
                queryInfo += "&environment=" + this.environment.toLowerCase();

                this.httpRequest("get", queryInfo, {}, (err, response) => {
                    if (response) {
                        response.json().then(parsed => {
                            if (parsed.data.custom_vehicle_data && parsed.data.custom_vehicle_data[0]) {
                                this.vehicle_data = parsed.data.custom_vehicle_data[0];
                                this.vehicleNameCopy = this.vehicle_data.name;
                            } else {
                                console.log("No vehicle data returned");
                            }
                            if (cb) {
                                cb(); //done
                            }
                        });
                    }
                });
            },
            saveVehicleData: function () {
                this.handleModalClick('save_button_loading', null, 'saveData');
            },
            saveData: function (cb) {
                this.httpRequest('post', 'vehicle-data', { 'body': this.vehicle_data }, (err) => {
                    this.toTop();
                    cb();
                });
            },
            getFunctionalGroupTemplate: function (cb) {
                this.httpRequest("get", "groups?template=true&environment=staging", {}, (err, response) => {
                    if (response) {
                        response.json().then(parsed => {
                            if (parsed.data.groups && parsed.data.groups[0]) {
                                //expect the template functional group to return, having an rpc named GetVehicleData
                                //which should return all possible parameters
                                this.vehicleParams = parsed.data.groups[0].rpcs.find(rpc => rpc.name === "GetVehicleData").parameters;
                            } else {
                                console.log("No functional group data returned");
                            }
                            if (cb) {
                                cb(); //done
                            }
                        });
                    }
                });
            },
            getTopLevelVehicleNames: function () {
                this.httpRequest("get", "vehicle-data", {
                    "params": {
                        "environment": 'STAGING'
                    }
                }, (err, response) => {
                    if (err) {
                        console.log("Error fetching custom vehicle data: ");
                        console.log(err);
                    } else {
                        response.json().then(parsed => {
                            if (parsed.data.custom_vehicle_data && parsed.data.custom_vehicle_data.length) {
                                this.topLevelVehicleNames = parsed.data.custom_vehicle_data.map(cvd => cvd.name);
                            } else {
                                console.log("No custom vehicle data returned");
                            }
                        });
                    }
                });
            },
            getVehicleDataTypes: function () {
                this.httpRequest("get", "vehicle-data/type", {}, 
                    (err, response) => {
                    if (err) {
                        console.log("Error fetching custom vehicle data: ");
                        console.log(err); 
                    } else {
                        response.json().then(parsed => {
                            if (parsed.data.type && parsed.data.type.length) {
                                this.vehicleDataTypes = parsed.data.type;
                            } else {
                                console.log("No custom vehicle data returned");
                            }
                        });
                    }
                });
            },
            namingConflictWithNativeParams: function (obj) {
                //check that none of the nested names match any of the native vehicle parameters found in functional group info
                let foundName = this.vehicleParams.find(vp => vp.name === obj.name);

                if (foundName // found a name match
                    && !foundName.is_custom //it's a native parameter 
                    && (foundName.name !== this.vehicleNameCopy)
                ) { //it's not the same name as the one we're looking at
                    return true; //found a match. stop now
                }
                //check all the sub parameters if they exist
                if (obj.params && obj.params.length > 0) {
                    for (let i = 0; i < obj.params.length; i++) {
                        if (this.namingConflictWithNativeParams(obj.params[i])) {
                            return true; //found a match. stop now
                        }
                    }
                }

                return false; //no issues
            },
            isNameTypeAndKeyDefined: function (obj) {
                if (!obj.name || !obj.type || !obj.key) {
                    return false; //no name, type, or key defined
                }

                //check all the sub parameters if they exist
                if (obj.params && obj.params.length > 0) {
                    for (let i = 0; i < obj.params.length; i++) {
                        if (!this.isNameTypeAndKeyDefined(obj.params[i])) {
                            return false; //no name, type, or key defined in a sub param
                        }
                    }
                }

                return true; //no issues
            },
            noDuplicatesInSameArray: function (obj) {
                if (!obj.params) {
                    return true;
                }
                //check for duplicate names
                const hash = {};
                for (let i = 0; i < obj.params.length; i++) {
                    if (hash[obj.params[i].name]) {
                        return false;
                    }
                    hash[obj.params[i].name] = true;
                    //check all the sub parameters if they exist
                    if (!this.noDuplicatesInSameArray(obj.params[i])) {
                        return false;
                    }
                }
                return true;
            },
            //modal-related methods
            handleModalClick: function (loadingProp, modalName, methodName) {
                //show a loading icon for the modal, and call the methodName passed in
                //when finished, turn off the loading icon, hide the modal, and push the
                //user back to the functional groups page
                this[loadingProp] = true;
                this[methodName](() => {
                    this[loadingProp] = false;
                    if (modalName) {
                        this.$refs[modalName].hide();
                    }
                    this.$router.push("/vehicledata");
                });
            },
            deleteVehicleData: function () {
                this.handleModalClick("delete_button_loading", "deleteModal", "deleteVehicleDataItem");
            },
            undeleteVehicleData: function() {
                this.handleModalClick("undelete_button_loading", "undeleteModal", "undeleteVehicleDataItem");
            },
            showDeleteModal: function() {
                this.$refs.deleteModal.show();
            },
            showUndeleteModal: function() {
                this.$refs.undeleteModal.show();
            },
            deleteVehicleDataItem: function (cb) {
                this.vehicle_data.is_deleted = true;
                this.httpRequest("post", "vehicle-data", { "body": this.vehicle_data }, cb);
            },
            undeleteVehicleDataItem: function (cb) {
                this.vehicle_data.is_deleted = false;
                this.httpRequest("post", "vehicle-data", { "body": this.vehicle_data }, cb);
            }
        },
        mounted: function () {
            this.environmentClick();
            this.getFunctionalGroupTemplate();
            this.getTopLevelVehicleNames();
            this.getVehicleDataTypes();
        },
        beforeDestroy() {
            // ensure closing of all modals
            this.$refs.deleteModal.onAfterLeave();
            this.$refs.undeleteModal.onAfterLeave();
        }
    };
</script>
