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
                                    <th>UUID</th>
                                    <th>Platform</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="icon"><img class="rounded" style="width: 40px; height: 40px;" src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_15e9f9b8d79%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_15e9f9b8d79%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.4296875%22%20y%3D%22104.5%22%3E200x200%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E" data-holder-rendered="true" /></td>
                                    <td class="title">{{ app.name }}</td>
                                    <td>{{ app.updated_ts }}</td>
                                    <td>{{ app.uuid }}</td>
                                    <td>{{ app.platform }}</td>
                                    <td>{{ app.category.display_name }}</td>
                                    <td v-if="app.is_blacklisted">
                                        BLACKLISTED
                                    </td>
                                    <td v-else>
                                        {{ app.approval_status }}
                                    </td>
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
                    <div v-if="app.approval_status !== 'LIMITED'">
                        <label class="switch">
                            <input v-on:click="autoApproveClick" type="checkbox" :checked="app.is_auto_approved_enabled"></input>
                            <span class="slider round"></span>
                        </label>
                        <label class="form-check-label switch-label">
                          Automatically approve updates
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
                    <h4>Requested Permissions</h4>
                    <div class="table-responsive">
                        <table class="table table-striped table-sm table-w-33">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>HMI Level Requested</th>
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

                <div class="app-table">
                    <h4>Developer Contact Info</h4>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Vendor</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Tech Email</th>
                                    <th>Tech Phone</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{{ app.vendor.name }}</td>
                                    <td>{{ app.vendor.email }}</td>
                                    <td>{{ app.vendor.phone }}</td>
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
        getPolicy: function (isProduction, modelName) {
            const envName = isProduction ? "production" : "staging";
            this.httpRequest("post", "policy/apps?environment=" + envName, {
                "body": {
                    "policy_table": {
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
