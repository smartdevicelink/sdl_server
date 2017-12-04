<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main v-if="app != null" class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">

                <div class="app-action pull-right">
                    <template v-if="app.approval_status === 'PENDING'">
                        <vue-ladda
                            type="button"
                            class="btn btn-success btn-sm align-middle mr-md-3"
                            data-style="zoom-in"
                            v-on:click="approveClick"
                            v-bind:loading="button_loading">
                            Approve
                        </vue-ladda>
                        <b-btn v-b-modal.appActionModal class="btn btn-danger btn-sm align-middle">Deny</b-btn>
                    </template>
                    <template v-else-if="actions_visible">
                        <span class="app-status align-middle"><i class="fa fa-fw fa-circle" v-bind:class="classStatusDot"></i> {{ app.approval_status }}</span>
                        <vue-ladda
                            v-if="app.approval_status == 'DENIED'"
                            type="button"
                            class="btn btn-success btn-sm align-middle"
                            data-style="zoom-in"
                            v-on:click="approveClick"
                            v-bind:loading="button_loading">
                            Approve
                        </vue-ladda>
                        <b-btn v-else v-b-modal.appActionModal class="btn btn-danger btn-sm align-middle">Deny</b-btn>
                        <a v-on:click="toggleActions" class="fa fa-fw fa-1-5x fa-times align-middle"></a>
                    </template>
                    <template v-else>
                        <span class="app-status align-middle"><i class="fa fa-fw fa-circle" v-bind:class="classStatusDot"></i> {{ app.approval_status }}</span>
                        <a v-on:click="toggleActions" class="fa fa-fw fa-1-5x fa-ellipsis-v align-middle"></a>
                    </template>
                </div>

                <div class="app-table">
                    <h4>General App Info</h4>
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
                                    <td>{{ app.category.name }}</td>
                                    <td>{{ app.approval_status }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="app.approval_status == 'DENIED'" class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Decline Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="text-wrap">{{ app.denial_message }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <label class="switch">
                            <input v-on:click="autoApproveClick" v-model="app.is_auto_approved_enabled" type="checkbox"></input>
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

                <div v-if="policytable != null"class="app-table">
                    <h4>Policy Table Preview</h4>
                    <div class="policy-table">
                        <pre class="prettyprint linenums hidenums">{{ policytable }}</pre>
                    </div>
                </div>

                <!-- APP DENY MODAL -->
                <b-modal ref="appActionModal" title="Deny Application" hide-footer id="appActionModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <form>
                        <div class="form-group">
                            <textarea v-bind="app.denial_message" class="app-action form-control" id="appActionReason" rows="5" placeholder="Reason here..."></textarea>
                        </div>
                        <vue-ladda
                            type="button"
                            v-on:click="sendDenyClick(true)"
                            class="btn btn-card btn-style-green"
                            data-style="zoom-in"
                            v-bind:loading="send_button_loading">
                            Send
                        </vue-ladda>
                        <div class="horizontal-divider">
                            <span class="line"></span>
                            <span class="text">OR</span>
                            <span class="line"></span>
                        </div>
                        <vue-ladda
                            type="button"
                            v-on:click="sendDenyClick(false)"
                            class="btn btn-card btn-style-white"
                            data-style="zoom-in"
                            v-bind:loading="no_feedback_button_loading">
                            Send without feedback
                        </vue-ladda>
                    </form>
                </b-modal>

            </main>
        </div>
    </div>
</template>

<script>
export default {
    data: function(){
        return {
            "actions_visible": false,
            "button_loading": false,
            "send_button_loading": false,
            "no_feedback_button_loading": false,
            "app": null,
            "policytable": null
        };
    },
    methods: {
        "toggleActions": function(){
            this.actions_visible = !this.actions_visible;
        },
        "approveClick": function(){
            this.button_loading = true;

            this.$http.post("applications/action", {
                "id": this.$route.params.id,
                "approval_status": "ACCEPTED"
            }).then(response => {
                // success
                this.app.approval_status = "ACCEPTED";
                this.button_loading = false;
                this.actions_visible = false;
            }, response => {
                // error
                console.log("Error approving application. Status code: " + response.status);
                this.button_loading = false;
                this.actions_visible = false;
            });
        },
        "autoApproveClick": function(){
            console.log("Requesting auto-approval change to: " + this.app.is_auto_approved_enabled);

            this.$http.post("applications/auto", {
                "uuid": this.app.uuid,
                "is_auto_approved_enabled": this.app.is_auto_approved_enabled
            }).then(response => {
                // success
                console.log("Auto-approve setting changed to: " + this.app.is_auto_approved_enabled);
            }, response => {
                // error
                console.log("Error changing auto-approval setting. Status code: " + response.status);
                this.app.is_auto_approved_enabled = !this.app.is_auto_approved_enabled;
            });
        },
        "sendDenyClick": function(with_feedback){
            if(with_feedback){
                this.send_button_loading = true;
                console.log("sending denial with feedback");
            }else{
                this.no_feedback_button_loading = true;
                console.log("sending denial without feedback");
            }

            this.$http.post("applications/action", {
                "id": this.$route.params.id,
                "approval_status": "DENIED",
                "message": with_feedback ? this.app.denial_message : null
            }).then(response => {
                // success
                console.log("done");
                this.app.approval_status = "DENIED";
                this.send_button_loading = false;
                this.no_feedback_button_loading = false;
                this.actions_visible = false;
                this.$refs.appActionModal.hide();
            }, response => {
                // error
                console.log("Error denying application. Status code: " + response.status);
                this.send_button_loading = false;
                this.no_feedback_button_loading = false;
                this.actions_visible = false;
            });
        },
        getPolicy: function(){
            //
            //this.$http.post((this.app.approval_status == "ACCEPTED" ? "production" : "staging") + "/policy", {
            const envName = this.app.approval_status == "ACCEPTED" ? "production" : "staging";
            this.$http.post("policy/apps?environment=" + envName, { 
                "policy_table": {
                    "app_policies": {
                        [this.app.uuid]: {}
                    }
                }
            }).then(response => {
                // success
                console.log("policy table retrieved");
                console.log(response);
                response.json().then(parsed => {
                    if(parsed.data && parsed.data.length && parsed.data[0].policy_table.app_policies[this.app.uuid]){
                        this.policytable = parsed.data[0].policy_table.app_policies[this.app.uuid];
                        PR.prettyPrint();
                    }else{
                        console.log("No policy table returned");
                    }
                });
            }, response => {
                // error
                console.log("Error fetching policy table. Status code: " + response.status);
                console.log(response.body.error);
            });
        }
    },
    computed: {
        classStatusDot: function(){
            return {
                "color-red": this.app.approval_status == "DENIED",
                "color-green": this.app.approval_status == "ACCEPTED"
            }
        }
    },
    beforeCreate: function(){
        this.$http.get("applications", {
            "params": {
                "id": this.$route.params.id
            }
        }).then(response => {
            // success
            response.json().then(parsed => {
                if(parsed.applications.length){
                    this.app = parsed.applications[0];
                    this.getPolicy();
                }else{
                    console.log("No applications returned");
                }
            });
        }, response => {
            // error
            console.log("Error receiving application. Status code: " + response.status);
        });
    }
}
</script>