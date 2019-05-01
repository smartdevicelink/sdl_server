<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main v-if="app != null" class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <!--
                m-md-2
                -->
                <div class="app-action pull-right">
                    <b-dropdown right
                        id="ddown-right"
                        :text="selected_option.state"
                        :class="selected_option.class">
                        <div
                            v-for="opt in dropdown_options[selected_option.id]"
                            :key="opt.id">

                            <b-dropdown-item
                                v-if="opt !== 'divide'"
                                @click="immediate_option_clicked = opt; handleAppState(opt.id)"
                                :class="opt.color"
                            >
                                {{opt.name}}
                            </b-dropdown-item>
                            <b-dropdown-divider
                                v-if="opt === 'divide'">
                            </b-dropdown-divider>

                        </div>
                    </b-dropdown>
                </div>

                <div class="app-table">
                    <h4>General App Info<a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/applications/" target="_blank"></a></h4>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th colspan="2">Application Name</th>
                                    <th>Last Update</th>
                                    <th>Platform</th>
                                    <th>Category</th>
                                    <th>Hybrid App Preference</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="icon"><img class="rounded" style="width: 40px; height: 40px;" src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_15e9f9b8d79%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_15e9f9b8d79%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.4296875%22%20y%3D%22104.5%22%3E200x200%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E" data-holder-rendered="true" /></td>
                                    <td class="title">{{ app.name }}</td>
                                    <td>{{ app.updated_ts }}</td>
                                    <td>{{ app.platform }}</td>
                                    <td>{{ app.category.display_name }}</td>
                                    <td class="overflow-visible">
                                        <b-dropdown size="sm" right
                                            variant="secondary"
                                            id="ddown-right"
                                            :text="selected_hybrid_app_preference.text">
                                            <div
                                                v-for="opt in hybrid_dropdown_options"
                                                :key="opt.value">

                                                <b-dropdown-item
                                                    @click="saveHybridPreference(opt.value)"
                                                >
                                                    {{opt.text}}
                                                </b-dropdown-item>

                                            </div>
                                        </b-dropdown>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="app.platform == 'CLOUD' || app.platform == 'EMBEDDED'" class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Endpoint</th>
                                    <th>Transport Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{{ app.cloud_endpoint }}</td>
                                    <td>{{ app.cloud_transport_type }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="app.approval_status == 'LIMITED'" class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Decline Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="text-wrap">
                                        <pre>{{ app.denial_message || "No notes provided." }}</pre>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-2 mb-2" v-if="app.approval_status !== 'LIMITED'">
                        <label class="switch">
                            <input v-on:click="autoApproveClick" type="checkbox" :checked="app.is_auto_approved_enabled"></input>
                            <span class="slider round"></span>
                        </label>
                        <label class="form-check-label switch-label">
                          Automatically approve future updates to this app
                        </label>
                    </div>
                    <div class="mt-2 mb-2">
                        <label class="switch">
                            <input v-on:click="toggleAdministratorClick" type="checkbox" :checked="app.is_administrator_app"></input>
                            <span class="slider round"></span>
                        </label>
                        <label class="form-check-label switch-label">
                          Grant this app access to "Administrator" Functional Groups<a class="fa fa-exclamation-circle color-primary doc-link" v-b-tooltip.hover title="Manage Administator permissions via the Functional Groups tab"></a>
                        </label>
                    </div>
                    <div class="mt-2 mb-5">
                        <label class="switch">
                            <input v-on:click="togglePassthroughClick" type="checkbox" :checked="app.allow_unknown_rpc_passthrough"></input>
                            <span class="slider round"></span>
                        </label>
                        <label class="form-check-label switch-label">
                          Allow app to send unknown RPCs through App Service RPC passthrough
                        </label>
                    </div>
                </div>

                <div class="app-table">
                    <h4>App Display Names</h4>
                    <div class="table-responsive">
                        <table class="table table-striped table-sm table-w-33">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="name in app.display_names">
                                    <td>{{ name }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="app-table">
                    <h4>General Permissions</h4>
                    <div class="table-responsive">
                        <table class="table table-striped table-sm table-w-33">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Min. HMI Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="permission in app.permissions">
                                    <td>{{ permission.key }}</td>
                                    <td>{{ permission.type }}</td>
                                    <td>{{ permission.hmi_level }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-for="service in app.services" class="app-table">
                    <h4>{{ service.display_name }} Service Provider</h4>
                    <!--<span>The developer has indicated that this app is capable of handling one or more App Service Types. Which App Service Provider RPCs would you like to grant to the app? If you wish to deny an entire App Service Type, please reject the application.</span>-->
                    <div class="table-responsive">
                        <table class="table table-striped table-sm table-w-33">
                            <thead>
                                <tr>
                                    <th>Permissions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <app-service-permission-row
                                    v-for="(item, index) in service.permissions"
                                    v-bind:item="item"
                                    v-bind:index="index"
                                    v-bind:key="item.id"
                                    v-bind:app_id="app.id"
                                    v-bind:approval_status="app.approval_status"
                                    v-bind:service_type_name="service.name"
                                    v-bind:updatePolicyTablesHandler="getPolicy"/>
                            </tbody>
                        </table>
                    </div>

                    <div class="table-responsive">
                        <table class="table table-striped table-sm table-w-33">
                            <thead>
                                <tr>
                                    <th>{{ service.display_name }} Service Names</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="name in service.service_names">
                                    <td>{{ name }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="app-table">
                    <h4>Developer Contact Info</h4>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Vendor</th>
                                    <th>Email</th>
                                    <th>Tech Email</th>
                                    <th>Tech Phone</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{{ app.vendor_name }}</td>
                                    <td>{{ app.vendor_email }}</td>
                                    <td>{{ app.tech_email }}</td>
                                    <td>{{ app.tech_phone }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="app-table">
                    <h4>Policy Table Preview</h4>

                    <b-form-radio-group id="selectEnvironment"
                        buttons
                        button-variant="toggle"
                        v-model="environment"
                        :options="environmentOptions"
                        name="chooseEnvironment" />

                    <div class="policy-table" style="word-break:break-all">
                        <!--<pre class="prettyprint linenums hidenums">{{ policytable }}</pre>-->
                        <vue-json-pretty v-if="environment == 'STAGING' " :data="policytableStaging"></vue-json-pretty>
                        <vue-json-pretty v-else :data="policytableProduction"></vue-json-pretty>
                    </div>
                </div>

                <!-- APP LIMITED MODAL -->
                <b-modal ref="appActionModal" title="Reject Application Updates" hide-footer id="appActionModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <form>
                        <h6>Rejecting an application will disallow any changes the application requested, including additional permissions. <br><br>
                            However, permissions received from the previously accepted version and from default functional groups will still be given.</h6>
                        <div class="form-group">
                            <textarea v-model="modal_text" class="app-action form-control" id="appActionReason" rows="5" placeholder="Reason here..."></textarea>
                        </div>
                        <vue-ladda
                            type="button"
                            v-on:click="handleModalClick()"
                            class="btn btn-card btn-style-red"
                            data-style="zoom-in"
                            v-bind:loading="send_button_loading">
                            {{ deny_button_text }}
                        </vue-ladda>
                    </form>
                </b-modal>

                <!-- APP BLACKLIST MODAL -->
                <b-modal ref="appBlacklistModal" title="Blacklist Application" hide-footer id="appBlacklistModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <form>
                        <h6>Blacklisting an application will prevent it from receiving any permissions on both staging and production.</h6>
                        <div class="form-group">
                            <textarea v-model="modal_text" class="app-action form-control" id="appActionReason" rows="5" placeholder="Reason here..."></textarea>
                        </div>
                        <vue-ladda
                            type="button"
                            v-on:click="handleModalClick()"
                            class="btn btn-card btn-style-red"
                            data-style="zoom-in"
                            v-bind:loading="send_button_loading">
                            {{ deny_button_text }}
                        </vue-ladda>
                    </form>
                </b-modal>


                <!-- NOT PRODUCTION MODAL -->
                <b-modal ref="notProductionModal" title="Remove from Production" hide-footer id="notProductionModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <form>
                        <h5>WARNING: You are about to move this application from Production to {{ immediate_option_clicked.state }}. This will revoke all changes requested from this application and it may no longer function. Are you sure you want to do this?</h5>

                        <vue-ladda
                            type="button"
                            v-on:click="changeState(immediate_option_clicked.id)"
                            class="btn btn-card btn-style-red"
                            data-style="zoom-in"
                            v-bind:loading="send_button_loading">
                            Remove from Production
                        </vue-ladda>
                    </form>
                </b-modal>
            </main>
        </div>
    </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty'

export default {
    components: {
        VueJsonPretty
    },
    data: function () {
        const pending_opt = {
            "name": "Revert to Pending",
            "state": "Pending",
            "id": "pending",
            "class": "dropdown-primary"
        };
        const staging_opt = {
            "name": "Test in Staging",
            "state": "Staging",
            "id": "staging",
            "class": "dropdown-primary"
        };
        const production_opt = {
            "name": "Promote to Production",
            "state": "Accepted",
            "id": "production",
            "class": "dropdown-green"
        };
        const limited_opt = {
            "name": "Reject Updates",
            "state": "Limited",
            "id": "limited",
            "color": "color-red",
            "class": "dropdown-red"
        };
        const blacklist_opt = {
            "name": "Blacklist Application",
            "state": "Blacklisted",
            "id": "blacklist",
            "class": "dropdown-black"
        };
        const remove_blacklisted_opt = {
            "name": "Remove from Blacklist",
            "state": "Limited",
            "id": "removeBlacklist",
            "class": "dropdown-red"
        };
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
            "send_button_loading": false,
            "no_feedback_button_loading": false,
            "blacklist_button_loading": false,
            "app": null,
            "policytableStaging": null,
            "policytableProduction": null,
            "options": {
                "PENDING": pending_opt,
                "STAGING": staging_opt,
                "ACCEPTED": production_opt,
                "LIMITED": limited_opt,
                "BLACKLISTED": blacklist_opt
            },
            "dropdown_options": {
                "pending": [
                    staging_opt,
                    "divide",
                    limited_opt
                ],
                "staging": [
                    production_opt,
                    "divide",
                    limited_opt
                ],
                "production": [
                    staging_opt,
                    limited_opt
                ],
                "limited": [
                    staging_opt,
                    "divide",
                    blacklist_opt
                ],
                "blacklist": [
                    remove_blacklisted_opt
                ]
            },
            "selected_option": pending_opt,
            "immediate_option_clicked": {},
            "blacklist_toggle": false,
            "modal_text": "",
            "hybrid_dropdown_options": {
                "BOTH": {
                    "text": "Both",
                    "value": "BOTH"
                },
                "MOBILE": {
                    "text": "Mobile",
                    "value": "MOBILE"
                },
                "CLOUD": {
                    "text": "Cloud",
                    "value": "CLOUD"
                }
            },
            "selected_hybrid_app_preference": {
                "text": "Both",
                "value": "BOTH"
            }
        };
    },
    methods: {
        "handleAppState": function (changedState) {
            if (this.app) {
                const isProduction = this.app.approval_status === "ACCEPTED";
                if (isProduction) {
                    return this.$refs.notProductionModal.show();
                }
                this.changeState(changedState);
            }
        },
        "changeState": function (changedState) {
            if (this.app) {
                if (changedState === "pending") {
                    this.changeApprovalState("PENDING", false);
                }
                else if (changedState === "staging") {
                    this.changeApprovalState("STAGING", false);
                }
                else if (changedState === "production") {
                    this.changeApprovalState("ACCEPTED", false);
                }
                else if (changedState === "limited") {
                    this.$refs.appActionModal.show();
                }
                else if (changedState === "removeBlacklist") {
                    this.changeApprovalState("LIMITED", false, null, true);
                }
                else if (changedState === "blacklist") {
                    this.blacklist_toggle = true;
                    this.$refs.appBlacklistModal.show();
                }
            }
        },
        "handleModalClick": function () {
            this.changeApprovalState("LIMITED", this.blacklist_toggle, "send_button_loading", this.contains_feedback);
        },
        "toggleActions": function(){
            this.actions_visible = !this.actions_visible;
        },
        "changeApprovalState": function (approvalStatus, isBlacklisted, loadingIconProperty, withFeedBack) {
            if (loadingIconProperty) {
                this[loadingIconProperty] = true;
            }

            this.httpRequest("post", "applications/action", {
                "body": {
                    "id": this.$route.params.id,
                    "approval_status": approvalStatus,
                    "blacklist": isBlacklisted,
                    "uuid": this.app.uuid,
                    "version_id": this.app.version_id,
                    "denial_message": withFeedBack ? this.modal_text : null
                }
            }, (err, response) => {
                this.$refs.appActionModal.hide();
                this.$refs.appBlacklistModal.hide();
                this.$refs.notProductionModal.hide();
                this.blacklist_toggle = false; //reset the toggle
                if (loadingIconProperty) {
                    this[loadingIconProperty] = false;
                }
                if (err) {
                    // error
                    console.log("Error changing approval status of application.");
                }
                else {
                    // success
                    this.getApp();
                }
            });
        },
        "autoApproveClick": function(){
            this.app.is_auto_approved_enabled = !this.app.is_auto_approved_enabled;
            console.log("Requesting auto-approval change to: " + this.app.is_auto_approved_enabled);

            if(this.app.is_auto_approved_enabled && !confirm("Future versions of this app will be granted all of its requested permissions (including App Services). Are you sure you would like to enable auto-approval for this app?")){
                // user cancelled the confirmation dialog
                this.app.is_auto_approved_enabled = !this.app.is_auto_approved_enabled;
                return;
            }

            this.httpRequest("post", "applications/auto", {
                "body": {
                    "uuid": this.app.uuid,
                    "is_auto_approved_enabled": this.app.is_auto_approved_enabled
                }
            }, (err, response) => {
                if(err){
                    // error
                    console.log("Error changing auto-approval setting.");
                    this.app.is_auto_approved_enabled = !this.app.is_auto_approved_enabled;
                }else{
                    // success
                    console.log("Auto-approve setting changed to: " + this.app.is_auto_approved_enabled);
                }
            });
        },
        "toggleAdministratorClick": function(){
            this.app.is_administrator_app = !this.app.is_administrator_app;
            console.log("Requesting administrator access change to: " + this.app.is_administrator_app);

            this.httpRequest("post", "applications/administrator", {
                "body": {
                    "uuid": this.app.uuid,
                    "is_administrator_app": this.app.is_administrator_app
                }
            }, (err, response) => {
                if(err){
                    // error
                    console.log("Error changing administrator app setting.");
                    this.app.is_administrator_app = !this.app.is_administrator_app;
                }else{
                    // success
                    console.log("App administrator setting changed to: " + this.app.is_administrator_app);
                    this.getApp();
                }
            });
        },
        "togglePassthroughClick": function(){
            this.app.allow_unknown_rpc_passthrough = !this.app.allow_unknown_rpc_passthrough;
            console.log("Requesting RPC Passthrough change to: " + this.app.allow_unknown_rpc_passthrough);

            this.httpRequest("post", "applications/passthrough", {
                "body": {
                    "uuid": this.app.uuid,
                    "allow_unknown_rpc_passthrough": this.app.allow_unknown_rpc_passthrough
                }
            }, (err, response) => {
                if(err){
                    // error
                    console.log("Error changing RPC Passthrough app setting.");
                    this.app.allow_unknown_rpc_passthrough = !this.app.allow_unknown_rpc_passthrough;
                }else{
                    // success
                    console.log("RPC Passthrough setting changed to: " + this.app.allow_unknown_rpc_passthrough);
                    this.getApp();
                }
            });
        },
        "saveHybridPreference": function(pref){
            var old_preference = this.app.hybrid_app_preference.value;
            this.selected_hybrid_app_preference = this.hybrid_dropdown_options[pref];
            console.log("Requesting hybrid preference change to: " + this.selected_hybrid_app_preference.value);

            this.httpRequest("post", "applications/hybrid", {
                "body": {
                    "uuid": this.app.uuid,
                    "hybrid_preference": this.selected_hybrid_app_preference.value
                }
            }, (err, response) => {
                if(err){
                    // error
                    console.log("Error changing app hybrid preference.");
                    this.selected_hybrid_app_preference = this.hybrid_dropdown_options[old_preference.value];
                }else{
                    // success
                    console.log("App hybrid preference changed to: " + this.selected_hybrid_app_preference.value);
                    this.getApp();
                }
            });
        },
        getPolicy: function (isProduction, modelName) {
            const envName = isProduction ? "production" : "staging";
            this.httpRequest("post", "policy/apps?environment=" + envName, {
                "body": {
                    "policy_table": {
                        "module_config": {
                            "full_app_id_supported": true
                        },
                        "app_policies": {
                            [this.app.uuid]: {}
                        }
                    }
                }
            }, (err, response) => {
                if(err){
                    // error
                    console.log("Error fetching policy table.");
                    console.log(response);
                }else{
                    // success
                    console.log("policy table retrieved");
                    console.log(response);
                    response.json().then(parsed => {
                        if(parsed.data && parsed.data.length ) {
                            var appObject = {};
                            appObject[this.app.uuid] = parsed.data[0].policy_table.app_policies[this.app.uuid];
                            this[modelName] = appObject;
                        }else{
                            console.log("No policy table returned");
                        }
                    });
                }
            });
        },
        getApp: function () {
            this.httpRequest("get", "applications", {
                "params": {
                    "id": this.$route.params.id
                }
            }, (err, response) => {
                if(err){
                    // error
                    console.log("Error receiving application.");
                    console.log(response);
                }else{
                    // success
                    response.json().then(parsed => {
                        if(parsed.data.applications.length){
                            this.app = parsed.data.applications[0];
                            this.selected_hybrid_app_preference = this.hybrid_dropdown_options[this.app.hybrid_app_preference || "BOTH"];
                            if (this.app.is_blacklisted) {
                                this.selected_option = this.options["BLACKLISTED"];
                            }
                            else {
                                this.selected_option = this.options[this.app.approval_status];
                            }
                            this.getPolicy(false, "policytableStaging");
                            this.getPolicy(true, "policytableProduction");
                        }else{
                            console.log("No applications returned");
                        }
                    });
                }
            });
        }
    },
    computed: {
        classStatusDot: function(){
            return {
                "color-red": this.app.approval_status == "LIMITED",
                "color-green": this.app.approval_status == "ACCEPTED"
            }
        },
        deny_button_text: function () {
            const actionName = this.blacklist_toggle ? "Blacklist application" : "Reject application updates";
            if (this.contains_feedback) {
                return actionName + " with feedback";
            }
            else {
                return actionName + " without feedback";
            }
        },
        contains_feedback: function () {
            return this.app && this.modal_text;
        },
        hybrid_dd_text: function () {
            return this.hybrid_dropdown_options[this.selected_hybrid_app_preference].text;
        }
    },
    created: function(){
        this.getApp();
    },
    beforeDestroy () {
        // ensure closing of all modals
        this.$refs.appActionModal.onAfterLeave();
        this.$refs.appBlacklistModal.onAfterLeave();
        this.$refs.notProductionModal.onAfterLeave();
    }
}
</script>
