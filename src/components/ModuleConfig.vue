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
                    <b-btn v-if="environment == 'STAGING' && canPromote" v-b-modal.promoteModal class="btn btn-style-green btn-sm align-middle">Promote changes to production</b-btn>
                </div>

                <h4>Module Config<a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/module-config/" target="_blank"></a></h4>

                <!-- module config data -->
                <div class="functional-content" v-if="module_config">

                            <div class="form-row">
                                <h4>Refresh the Policy Table after every:</h4>

                                <div class="form-group row">
                                    <div class="col-sm-2">
                                        <pattern-input class="form-control text-truncate"
                                           :regExp="integerInput.regExp"
                                           :replacement="integerInput.replacement"
                                           :disabled="fieldsDisabled"
                                           v-model.number="module_config.exchange_after_x_ignition_cycles"></pattern-input>
                                    </div>
                                    <label class="col-sm-10 col-form-label color-primary" style="text-transform:none">Ignition {{ Math.abs(module_config.exchange_after_x_ignition_cycles) == 1 ? "Cycle" : "Cycles" }}</label>
                                </div>

                                <div class="form-group row">
                                    <div class="col-sm-2">
                                        <pattern-input class="form-control text-truncate"
                                           :regExp="integerInput.regExp"
                                           :replacement="integerInput.replacement"
                                           :disabled="fieldsDisabled"
                                           v-model.number="module_config.exchange_after_x_kilometers"></pattern-input>
                                    </div>
                                    <label class="col-sm-10 col-form-label color-primary" style="text-transform:none">{{ Math.abs(module_config.exchange_after_x_kilometers) == 1 ? "Kilometer" : "Kilometers" }} Traveled</label>
                                </div>
                                <div class="form-group row">
                                    <div class="col-sm-2">
                                        <pattern-input class="form-control text-truncate"
                                           :regExp="integerInput.regExp"
                                           :replacement="integerInput.replacement"
                                           :disabled="fieldsDisabled"
                                           v-model.number="module_config.exchange_after_x_days"></pattern-input>
                                    </div>
                                    <label class="col-sm-10 col-form-label color-primary" style="text-transform:none">{{ Math.abs(module_config.exchange_after_x_days) == 1 ? "Day" : "Days" }}</label>
                                </div>
                            </div>

                            <div class="form-row">
                                <h4 for="name">Policy Table Refresh Timeout</h4>
                                <div class="form-group row">
                                    <div class="col-sm-2">
                                        <pattern-input class="form-control text-truncate"
                                           :regExp="integerInput.regExp"
                                           :replacement="integerInput.replacement"
                                           :disabled="fieldsDisabled"
                                           v-model.number="module_config.timeout_after_x_seconds"></pattern-input>
                                    </div>
                                    <label class="col-sm-10 col-form-label color-primary" style="text-transform:none">{{ Math.abs(module_config.timeout_after_x_seconds) == 1 ? "Second" : "Seconds" }}</label>
                                </div>
                            </div>

                            <!-- retry in seconds -->
                            <div class="form-row" style="max-width: 450px;">
                                <h4>When a Policy Table Refresh Fails:</h4>
                                    <!-- retry in seconds element -->
                                    <div class="white-box rpc-container" v-for="(value, key) in module_config.seconds_between_retries">
                                        <div class="row">
                                            <label class="col col-form-label color-primary" style="text-transform:none">Retry after</label>
                                            <div class="col">
                                                <pattern-input class="form-control text-truncate"
                                                   :regExp="integerInput.regExp"
                                                   :replacement="integerInput.replacement"
                                                   :disabled="fieldsDisabled"
                                                   v-model.number="module_config.seconds_between_retries[key]"></pattern-input>
                                            </div>
                                            <label class="col col-form-label color-primary" style="text-transform:none">{{ Math.abs(module_config.seconds_between_retries[key]) == 1 ? "second" : "seconds" }}</label>
                                            <div class="col" style="display:flex;justify-content:center;align-items:center;">
                                                <i
                                                    v-on:click="removeRetryUpdateElement(key)"
                                                    v-if="!fieldsDisabled"
                                                    class="pointer fa fa-times hover-color-red"
                                                    style=""
                                                    aria-hidden="true">
                                                </i>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="!fieldsDisabled" v-on:click="addRetryUpdateElement()" id="add" class="another-rpc pointer">
                                        <i class="fa fa-plus middle-middle"></i>
                                    </div>
                            </div>

                            <div class="form-row">
                                <h4 for="name">Software Update URL (0x04)</h4>
                                <input v-model="module_config.endpoints['0x04']" :disabled="fieldsDisabled" class="form-control">
                            </div>

                            <div class="form-row">
                                <h4 for="name">iOS App Querying URL</h4>
                                <input v-model="module_config.endpoints['queryAppsUrl']" :disabled="fieldsDisabled" class="form-control">
                            </div>

                            <div class="form-row">
                                <h4>Lock Screen Icon URL</h4>
                                <div class="form-group row">
                                    <div class="col-sm-10">
                                        <input v-model="module_config.endpoints['lock_screen_icon_url']" :disabled="fieldsDisabled" class="form-control"></input>
                                    </div>
                                    <div class="col-sm">
                                        <img v-if="module_config.endpoints['lock_screen_icon_url']" v-bind:src="module_config.endpoints['lock_screen_icon_url']" class="pull-right" style="max-width:90px;max-height:50px;"/>
                                    </div>
                                </div>


                            </div>

                            <!-- notifications -->
                            <div class="form-row">
                                <h4>Notification Rate Limits by Priority Level</h4>
                                <div class="form-group row" v-for="(value, key) in module_config.notifications_per_minute_by_priority">
                                    <div class="col-sm-2">
                                        <pattern-input class="form-control text-truncate"
                                           :regExp="integerInput.regExp"
                                           :replacement="integerInput.replacement"
                                           :disabled="fieldsDisabled"
                                           v-model.number="module_config.notifications_per_minute_by_priority[key]"></pattern-input>
                                    </div>
                                    <label class="col-sm-10 col-form-label color-primary" style="text-transform:none">{{ key }} {{ Math.abs(module_config.notifications_per_minute_by_priority[key]) == 1 ? "notification" : "notifications" }} per minute</label>
                                </div>
                            </div>

                    <!-- save button -->
                    <div>
                        <vue-ladda
                            type="submit"
                            class="btn btn-card btn-style-green"
                            data-style="zoom-in"
                            v-if="!fieldsDisabled"
                            v-on:click="saveModuleConfig()"
                            v-bind:loading="save_button_loading">
                            Save module config
                        </vue-ladda>
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
                "integerInput": {
                    "regExp": /^[\D]*|\D*/g, // Match any character that doesn't belong to the positive integer
                    "replacement": ""
                },
                "save_button_loading": false,
                "promote_button_loading": false,
                "module_config": null
            }
        },
        computed: {
            canPromote: function() {
                return this.module_config && this.module_config.status === "STAGING";
            },
            fieldsDisabled: function () {
                return this.environment != 'STAGING';
            }
        },
        methods: {
            "toTop": function(){
                this.$scrollTo("body", 500);
            },
            "environmentClick": function () {
                this.$nextTick(function () {
                    this.httpRequest("get", "module", {
                        "params": {
                            "environment": this.environment
                        }
                    }, (err, res) => {
                        if (err) {
                            console.log("Error fetching module config data: ");
                            console.log(err);
                        }
                        else {
                            res.json().then(parsed => {
                                if (parsed.data.module_configs && parsed.data.module_configs.length) {
                                    this.module_config = parsed.data.module_configs[0]; //only one entry
                                }
                                else {
                                    console.log("No module config data returned");
                                }
                            });
                        }
                    });
                });
            },
            "saveModuleConfig": function () {
                this.handleModalClick("save_button_loading", null, "saveConfig");
            },
            "saveConfig": function (cb) {
                this.httpRequest("post", "module", { "body": this.module_config }, (err) => {
                    this.toTop();
                    cb();
                });
            },
            "promoteConfigClick": function () {
                this.handleModalClick("promote_button_loading", "promoteModal", "promoteConfig");
            },
            "promoteConfig": function (cb) {
                this.httpRequest("post", "module/promote", { "body": this.module_config }, cb);
            },
            "addRetryUpdateElement": function () {
                var newVal = this.module_config.seconds_between_retries.length ? this.module_config.seconds_between_retries[this.module_config.seconds_between_retries.length - 1]*5 : 1;
                this.module_config.seconds_between_retries.push(newVal);
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
