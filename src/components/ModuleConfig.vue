<!-- Copyright (c) 2018, Livio, Inc. -->
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

                <h4>Module Config</h4>

                <!-- module config data -->
                <div class="functional-content">
                    <div class="form-row" v-if="module_config">
                        <div class="white-box rpc-container">
                            <!-- exchange in ignition cycles -->
                            <h5> Policy Table Update in Ignition Cycles</h5>
                            <!-- TODO: lots of repetition here. move out into their own components -->
                            <div class="form-group row">
                                <label class="col-sm-9 col-form-label" style="text-transform:none">exchange_after_x_ignition_cycles</label>
                                <div class="col-sm-3">
                                    <input v-model="module_config.exchange_after_x_ignition_cycles" :disabled="fieldsDisabled" class="form-control">
                                </div>
                            </div>
                            <br>
                            <!-- exchange in kilometers -->
                            <h5> Policy Table Update in Kilometers</h5>
                            <div class="form-group row">
                                <label class="col-sm-9 col-form-label" style="text-transform:none">exchange_after_x_kilometers</label>
                                <div class="col-sm-3">
                                    <input v-model="module_config.exchange_after_x_kilometers" :disabled="fieldsDisabled" class="form-control">
                                </div>
                            </div>
                            <br>
                            <!-- exchange in days -->
                            <h5> Policy Table Update in Days</h5>
                            <div class="form-group row">
                                <label class="col-sm-9 col-form-label" style="text-transform:none">exchange_after_x_days</label>
                                <div class="col-sm-3">
                                    <input v-model="module_config.exchange_after_x_days" :disabled="fieldsDisabled" class="form-control">
                                </div>
                            </div>
                            <br>
                            <!-- timeout in seconds-->
                            <h5> Policy Table Update Timeout in Seconds</h5>
                            <div class="form-group row">
                                <label class="col-sm-9 col-form-label" style="text-transform:none">timeout_after_x_seconds</label>
                                <div class="col-sm-3">
                                    <input v-model="module_config.timeout_after_x_seconds" :disabled="fieldsDisabled" class="form-control">
                                </div>
                            </div>
                            <br>
                            <!-- retry in seconds -->
                            <h5> Retry Policy Table Update in Seconds </h5>
                            <div class="form-group row">
                                <label class="col-sm-9 col-form-label" style="text-transform:none">seconds_between_retries</label>
                            </div>
                            <!-- retry in seconds element -->
                            <div class="form-group row" v-for="(value, key) in module_config.seconds_between_retries">
                                <label class="col-sm-8 col-form-label" style="text-transform:none">Element {{ key }}</label>
                                <div class="col-sm-3">
                                    <input v-model="module_config.seconds_between_retries[key]" :disabled="fieldsDisabled" class="form-control">
                                </div>
                                <i
                                    v-on:click="removeRetryUpdateElement(key)"
                                    v-if="!fieldsDisabled"
                                    class="col-sm-1 pointer fa fa-times hover-color-red"
                                    style="display:flex;justify-content:center;align-items:center;"
                                    aria-hidden="true">
                                </i>
                            </div>
                            <div v-if="!fieldsDisabled" v-on:click="addRetryUpdateElement()" id="add" class="another-rpc pointer">
                                <i class="fa fa-plus middle-middle"></i>
                            </div>
                            <br>
                            <!-- software update url -->
                            <h5> URL for Software Updates </h5>
                            <div class="form-group row">
                                <label class="col-sm-3 col-form-label" style="text-transform:none">0x04</label>
                                <div class="col-sm-9">
                                    <input v-model="module_config.endpoints['0x04']" :disabled="fieldsDisabled" class="form-control">
                                </div>
                            </div>
                            <br>
                            <!-- query apps url -->
                            <h5> URL for App Querying on iOS Devices  </h5>
                            <div class="form-group row">
                                <label class="col-sm-3 col-form-label" style="text-transform:none">queryAppsUrl</label>
                                <div class="col-sm-9">
                                    <input v-model="module_config.endpoints['queryAppsUrl']" :disabled="fieldsDisabled" class="form-control">
                                </div>
                            </div>
                            <br>
                            <!-- lock screen url -->
                            <h5> URL for Lock Screen Icon  </h5>
                            <div class="form-group row">
                                <label class="col-sm-3 col-form-label" style="text-transform:none">lock_screen_icon_url</label>
                                <div class="col-sm-9">
                                    <input v-model="module_config.endpoints['lock_screen_icon_url']" :disabled="fieldsDisabled" class="form-control">
                                </div>
                            </div>
                            <br>
                            <!-- notifications -->
                            <h5> Notifications per Minute by Priority  </h5>
                            <div class="form-group row" v-for="(value, key) in module_config.notifications_per_minute_by_priority">
                                <label class="col-sm-9 col-form-label" style="text-transform:none">{{ key }}</label>
                                <div class="col-sm-3">
                                    <input v-model="module_config.notifications_per_minute_by_priority[key]" :disabled="fieldsDisabled" class="form-control">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PROMOTE GROUP MODAL -->
                <b-modal ref="promoteModal" title="Promote Module Config to Production" hide-footer id="promoteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        This will promote the module config to production, immediately updating the production policy table. Are you sure you want to do this?
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-style-green"
                        data-style="zoom-in"
                        v-on:click="promoteConfigClick()"
                        v-bind:loading="promote_button_loading">
                        Yes, promote to production!
                    </vue-ladda>
                </b-modal>
            </main>
        </div>
    </div>
</template>

<script>
    export default {
        data () {
            return {
                "environment": "STAGING",
                "environmentOptions": [
                    {
                        "text": "Staging",
                        "value": "STAGING"
                    },
                    {
                        "text": "Production",
                        "value": "PRODUCTION"
                    }
                ],
                "promote_button_loading": false,
                "module_config": {
                    "status": "PRODUCTION",
                    "exchange_after_x_ignition_cycles": 100,
                    "exchange_after_x_kilometers": 1800,
                    "exchange_after_x_days": 30,
                    "timeout_after_x_seconds": 60,
                    "seconds_between_retries": [1,
                    5,
                    25,
                    125,
                    625],
                    "endpoints": {
                        "0x07": "http://localhost:3000/api/1/policies/proprietary",
                        "0x04": "http://localhost:3000/api/1/softwareUpdate",
                        "queryAppsUrl": "http://sdl.shaid.server",
                        "lock_screen_icon_url": "http://i.imgur.com/QwZ9uKG.png"
                    },
                    "notifications_per_minute_by_priority": {
                        "EMERGENCY": 60,
                        "NAVIGATION": 15,
                        "VOICECOM": 20,
                        "COMMUNICATION": 6,
                        "NORMAL": 4,
                        "NONE": 0
                    }
                }
            }
        },
        computed: {
            can_promote: function() {
                return this.module_config && this.module_config.status === "STAGING";
            },
            fieldsDisabled: function () {
                return this.environment != 'STAGING';
            }
        },
        methods: {
            "environmentClick": function () {
                /*this.httpRequest("get", "groups?id=1", null, function (err, res) {
                    console.log(err);
                    console.log(res);
                });*/
            },
            "promoteConfigClick": function () {
                this.handleModalClick("promote_button_loading", "promoteModal", "promoteConfig");
            },
            "promoteConfig": function (next) {
                console.log("clicky");
                next();
            },
            "addRetryUpdateElement": function () {
                this.module_config.seconds_between_retries.push(0);
            },
            "removeRetryUpdateElement": function (key) {
                this.module_config.seconds_between_retries.splice(key, 1);
            }
        },
        mounted: function(){
            this.environmentClick();
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs.promoteModal.onAfterLeave();
        }
    }
</script>