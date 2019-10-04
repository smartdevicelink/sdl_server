<!-- Copyright (c) 2019, Livio, Inc. -->
<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <b-form-radio-group id="selectEnvironment"
                    buttons
                    button-variant="toggle"
                    v-on:change="environmentClick"
                    v-model="environment"
                    :options="environmentOptions"
                    name="chooseEnvironment" />

                <div class="pull-right">
                    <b-btn v-if="environment == 'STAGING' && can_promote" v-b-modal.promoteModal class="btn btn-style-green btn-sm align-middle">Promote changes to production</b-btn>
                </div>

                <h4>Custom Vehicle Data Mapping</h4>

                <div>
                    Define custom vehicle parameters supported by the manufacturer's HMI.
                </div>

                <section class="tiles">
                    <card-item
                        v-for="(item, index) in custom_vehicle_data"
                        v-bind:item="{
                            title: item.name,
                            count: getParameterCount(item),
                            id: item.id,
                            parent_id: item.parent_id,
                            status: item.status,
                            name: item.name,
                            type: item.type,
                            key: item.key,
                            mandatory: item.mandatory,
                            min_length: item.min_length,
                            max_length: item.max_length,
                            min_size: item.min_size,
                            max_size: item.max_size,
                            min_value: item.min_value,
                            max_value: item.max_value,
                            array: item.array,
                            is_deleted: item.is_deleted,
                            created_ts: item.created_ts,
                            updated_ts: item.updated_ts,
                            params: item.params
                        }"
                        v-bind:environment="environment"
                        v-bind:link="{
                            path: 'vehicledata/manage',
                            query: {
                                id: item.id,
                                environment: environment
                            }
                        }"
                        v-bind:count_label_plural="'sub-parameters'"
                        v-bind:count_label_singular="'sub-parameter'"
                        v-bind:index="index"
                        v-bind:key="item.id"
                        >
                    </card-item>
                    <router-link
                        v-bind:to="{ path: 'vehicledata/manage', query: { environment: environment } }"
                        v-if="environment == 'STAGING'"
                        class="tile-plus"
                        >
                            <div class="tile-plus-container content-middle">
                                +
                            </div>
                    </router-link>
                </section>

            </main>

            <!-- PROMOTE GROUP MODAL -->
            <b-modal ref="promoteModal" title="Promote Functional Groups to Production" hide-footer id="promoteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                <small class="form-text">
                    <p>This will promote all modified Functional Groups to production, immediately updating the production policy table. Are you sure you want to do this?</p>
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
        </div>
    </div>
</template>

<script>
    import VueJsonPretty from 'vue-json-pretty';

    export default {
        components: {
            VueJsonPretty
        },
        data () {
            return {
                'environment': 'STAGING',
                'environmentOptions': [
                    {
                        'text': 'Staging',
                        'value': 'STAGING'
                    },
                    {
                        'text': 'Production',
                        'value': 'PRODUCTION'
                    }
                ],
                'promote_button_loading': false,
                'selected_vehicle_data_id': null,
                'custom_vehicle_data': [],
            }
        },
        computed: {
            can_promote: function () {
                let show_button = false;
                for (let i = 0; i < this.custom_vehicle_data.length; i++){
                    if(this.custom_vehicle_data[i].status == "STAGING") show_button = true;
                }
                return show_button;
            },
        },
        methods: {
            getParameterCount: function (obj) {
                if (!obj.params) 
                    return 0;

                let subParamCount = 0;
                for (let i = 0; i < obj.params.length; i++) {
                    subParamCount += this.getParameterCount(obj.params[i])
                }
                return obj.params.length + subParamCount;
            },
            environmentClick: function () {
                this.$nextTick(function () {
                    this.custom_vehicle_data = [];
                    //get high level custom vehicle data
                    this.getCustomVehicleData();
                });
            },
            getCustomVehicleData: function () {
                this.httpRequest("get", "vehicle-data", {
                    "params": {
                        "environment": this.environment
                    }
                }, (err, response) => {
                    if (err) {
                        console.log("Error fetching custom vehicle data: ");
                        console.log(err);
                    } else {
                        response.json().then(parsed => {
                            if (parsed.data.custom_vehicle_data && parsed.data.custom_vehicle_data.length) {
                                this.custom_vehicle_data = parsed.data.custom_vehicle_data;
                            } else {
                                console.log("No custom vehicle data returned");
                            }
                        });
                    }
                });
            },
            promoteVehicleDataClick: function () {
                this.handleModalClick("promote_button_loading", "promoteModal", "promoteAllVehicleData");
            },
            promoteAllVehicleData: function (cb) { //the back end will find the staging ids for the front end
                this.httpRequest("post", "vehicle-data/promote", { "body": {} }, cb);
            },
            getVehicleDataInfo: function (id, cb) {
                this.httpRequest("get", "vehicle-data?id=" + id, {}, cb);
            },
            saveVehicleDataInfo: function (vehicleData, cb) {
                this.httpRequest("post", "vehicle-data", { "body": vehicleData }, cb);
            }
        },
        mounted: function (){
            this.environmentClick();
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs.promoteModal.onAfterLeave();
        }
    }
</script>
