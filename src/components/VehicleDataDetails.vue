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

                    <h4>Custom Vehicle Data Mapping</h4>

                    <div>
                        Define custom vehicle params supported by the manufacturer's HMI.
                    </div>

                    <div class="form-row">
                        <h4 for="name">Mapping</h4>
                    </div>

                    <!-- vehicle data loaded here --> 
                    <div class="form-row">
                        <div>
                            <schema-item
                                :item="vehicle_data"
                                :fieldsDisabled="fieldsDisabled"
                                :vehicleParams="vehicleParams"
                                :topLevelVehicleNames="topLevelVehicleNames"
                                :pardonedName="vehicleNameCopy"
                                :vehicleDataTypes="vehicleDataTypes"
                            ></schema-item>
                        </div>
                    </div>

                    <!-- save button -->
                    <div>
                        <vue-ladda
                            type="submit"
                            class="btn btn-card btn-style-green"
                            data-style="zoom-in"
                            v-if="!fieldsDisabled && !namingConflictWithNativeParams(vehicle_data)"
                            v-on:click="saveVehicleData()"
                            v-bind:loading="save_button_loading">
                            Save vehicle data config
                        </vue-ladda>
                    </div>
                </div>

                <!-- PROMOTE GROUP MODAL -->
                <b-modal ref="promoteModal" title="Promote Custom Vehicle Data to Production" hide-footer
                    id="promoteModal"
                    tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        This will promote the custom vehicle data mappings to production, immediately updating the
                        production policy
                        table. Are you sure you want to do this?
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-style-green"
                        data-style="zoom-in"
                        v-on:click="promoteVehicleDataClick()"
                        v-bind:loading="promote_button_loading">
                        Yes, promote to production!
                    </vue-ladda>
                </b-modal>

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
                'promote_button_loading': false,
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
            canPromote: function () {
                return this.vehicle_data && this.vehicle_data.status === 'STAGING';
            },
            fieldsDisabled: function () {
                return this.environment !== 'STAGING';
            }
        },
        methods: {
            toTop: function () {
                this.$scrollTo('body', 500);
            },
            environmentClick: function (cb) {
                let queryInfo = "";
                if (!this.id) {
                    queryInfo = "vehicle-data/template";
                } else {
                    queryInfo = "vehicle-data?id=" + this.id;
                }

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
            promoteVehicleDataClick: function () {
                this.handleModalClick('promote_button_loading', 'promoteModal', 'promoteVehicleData');
            },
            promoteVehicleData: function (cb) {
                this.httpRequest('post', 'vehicle-data/promote', { 'body': this.vehicle_data }, cb);
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
                if (foundName) {
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
                this.handleModalClick("delete_button_loading", "deleteModal", "deleteVehicleData");
            },
            undeleteVehicleData: function() {
                this.handleModalClick("undelete_button_loading", "undeleteModal", "undeleteVehicleData");
            },
            showDeleteModal: function() {
                this.$refs.deleteModal.show();
            },
            showUndeleteModal: function() {
                this.$refs.undeleteModal.show();
            },
            deleteVehicleData: function (cb) {
                this.vehicle_data.is_deleted = true;
                this.httpRequest("post", "vehicle-data", { "body": this.vehicle_data }, cb);
            },
            undeleteVehicleData: function (cb) {
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
            this.$refs.promoteModal.onAfterLeave();
            this.$refs.deleteModal.onAfterLeave();
            this.$refs.undeleteModal.onAfterLeave();
        }
    };
</script>
