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
                                    name="chooseEnvironment"/>

                <div class="pull-right">
                    <b-btn v-if="environment == 'STAGING' && canPromote" v-b-modal.promoteModal
                           class="btn btn-style-green btn-sm align-middle">Promote changes to production
                    </b-btn>
                </div>


                <div class="form-row">
                    <h4>Custom Vehicle Data Preview</h4>
                </div>
                <div v-if="vehicle_data">
                    <vue-json-pretty :data="vehicleDataPreview"
                                     :deep="2"
                                     :showLine="showLine"
                                     :showLength="showLength"
                    ></vue-json-pretty>
                </div>


                <div class="form-row">
                    <h4>Reserved Vehicle Data Params</h4>
                </div>
                <p>
                    The following keys are the default vehicle data params defined by the Mobile API and cannot
                    be used for custom vehicle data.
                </p>

                <ul>
                    <li v-for="(param, index) in reserved_params">{{ param }}</li>
                </ul>


                <div class="form-row">
                    <h4>Custom Vehicle Data Mapping</h4>
                </div>

                <div class="form-row">
                    <div>
                        Define custom vehicle params supported by the manufacturer's HMI.
                    </div>
                </div>


                <div class="functional-content" v-if="vehicle_data">

                    <div class="form-row">
                        <h4 for="name">Schema Version</h4>
                        <input v-model="vehicle_data.schema_version" :disabled="fieldsDisabled" class="form-control">
                    </div>

                    <div class="form-row">
                        <h4 for="name">Mapping</h4>

                    </div>


                    <div class="form-row">
                        <div>
                            <div v-for="(item, index) in vehicle_data.schema_items">
                                <div>
                                    <schema-item
                                            v-if="!item.deleted"

                                            :item="item"
                                            :fieldsDisabled="fieldsDisabled"
                                            :index="index"
                                            :items="vehicle_data.schema_items"
                                    ></schema-item>
                                </div>
                            </div>
                            <!-- save button -->
                            <div>

                                <div id="add" class="another-rpc pointer"
                                     v-on:click="addSchemaItem()"
                                >
                                    Add Schema Item
                                    <i class="fa fa-plus middle-middle"></i></div>


                            </div>

                        </div>
                    </div>

                    <!-- save button -->
                    <div>
                        <vue-ladda
                                type="submit"
                                class="btn btn-card btn-style-green"
                                data-style="zoom-in"
                                v-if="!fieldsDisabled"
                                v-on:click="saveVehicleData()"
                                v-bind:loading="save_button_loading">
                            Save vehicle data config
                        </vue-ladda>
                    </div>
                </div>


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

            </main>
        </div>
    </div>
</template>

<script>
    import VueJsonPretty from 'vue-json-pretty';

    export default {
        components: {
            VueJsonPretty
        },
        data() {
            return {
                'showLine': false,
                'showLength': true,
                'deep': 0,
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
                'integerInput': {
                    'regExp': /^[\D]*|\D*/g, // Match any character that doesn't belong to the positive integer
                    'replacement': ''
                },
                'save_button_loading': false,
                'promote_button_loading': false,
                'module_config': null,
                'vehicle_data': {
                    'schema_items': []
                },
                'reserved_params': []
            };
        },
        computed: {
            vehicleDataPreview: function() {
                let vehicle_data = this.vehicle_data;
                return {
                    vehicle_data: {
                        schema_version: vehicle_data.schema_version,
                        schema_items: vehicle_data.schema_items,
                    }
                };
            },
            canPromote: function() {
                return this.vehicle_data && this.vehicle_data.status === 'STAGING';
            },
            fieldsDisabled: function() {
                return this.environment != 'STAGING';
            }
        },
        methods: {
            'parseVehicleData': function(vehicle_data) {
                function updateItem(item) {
                    item.minvalue = item.minvalue || '';
                    item.maxvalue = item.maxvalue || '';
                    item.minsize = item.minsize || '';
                    item.maxsize = item.maxsize || '';
                    item.minlength = item.minlength || '';
                    item.maxlength = item.maxlength || '';
                    if (item.params) {
                        for (let param of item.params) {
                            updateItem(param);
                        }
                    }
                }

                for (let schema_item of vehicle_data.schema_items) {
                    updateItem(schema_item);
                }
                this.vehicle_data = vehicle_data;
            },
            'addSchemaItem': function() {
                this.vehicle_data.schema_items.push(
                    {
                        name: '',
                        key: '',
                        type: '',
                        array: false,
                        since: '',
                        until: '',
                        removed: false,
                        deprecated: false,
                        minvalue: '',
                        maxvalue: '',
                        minsize: '',
                        maxsize: '',
                        minlength: '',
                        maxlength: '',
                        params: []
                    }
                );

            },
            'toTop': function() {
                this.$scrollTo('body', 500);
            },
            'environmentClick': function() {
                this.$nextTick(function() {
                    this.httpRequest('get', 'vehicle-data', {
                        'params': {
                            'environment': this.environment
                        }
                    }, (err, res) => {
                        if (err) {
                            console.log('Error fetching vehicle data: ');
                            console.log(err);
                        } else {
                            res.json().then(parsed => {
                                if (parsed.data.vehicle_data) {
                                    this.parseVehicleData(parsed.data.vehicle_data);
                                } else {
                                    console.log('No vehicle data returned');
                                }
                            });
                        }
                    });

                    this.httpRequest('get', 'vehicle-data/reserved-params', {}, (err, res) => {
                        if (err) {
                            console.log('Error fetching reserved params: ');
                            console.log(err);
                        } else {
                            res.json().then(parsed => {
                                if (parsed.data.reserved_params) {
                                    this.reserved_params = parsed.data.reserved_params;
                                } else {
                                    console.log('No reserved params returned');
                                }
                            });
                        }
                    });
                });
            },
            'saveVehicleData': function() {
                this.handleModalClick('save_button_loading', null, 'saveData');
            },
            'saveData': function(cb) {
                this.httpRequest('post', 'vehicle-data', { 'body': this.vehicle_data }, (err) => {
                    this.toTop();
                    cb();
                });
            },
            'promoteVehicleDataClick': function() {
                this.handleModalClick('promote_button_loading', 'promoteModal', 'promoteVehicleData');
            },
            'promoteVehicleData': function(cb) {
                this.httpRequest('post', 'vehicle-data/promote', { 'body': this.vehicle_data }, cb);
            },
        },
        mounted: function() {
            this.environmentClick();
        },
        beforeDestroy() {
            // ensure closing of all modals
            this.$refs.promoteModal.onAfterLeave();
        }
    };
</script>
