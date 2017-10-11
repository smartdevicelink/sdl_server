<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">

                <div class="app-action pull-right">
                    <template v-if="app.status === 'pending'">
                        <b-btn class="btn btn-success btn-sm align-middle mr-md-3">Approve</b-btn>
                        <b-btn v-b-modal.appActionModal class="btn btn-danger btn-sm align-middle">Deny</b-btn>
                    </template>
                    <template v-else-if="actions_visible">
                        <span class="app-status align-middle"><i class="fa fa-fw fa-circle" v-bind:class="classStatusDot"></i> {{ app.status }}</span>
                        <b-btn v-if="app.status == 'denied'" class="btn btn-success btn-sm align-middle">Approve</b-btn>
                        <b-btn v-else v-b-modal.appActionModal class="btn btn-danger btn-sm align-middle">Deny</b-btn>
                        <a v-on:click="toggleActions" class="fa fa-fw fa-1-5x fa-times align-middle"></a>
                    </template>
                    <template v-else>
                        <span class="app-status align-middle"><i class="fa fa-fw fa-circle" v-bind:class="classStatusDot"></i> {{ app.status }}</span>
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
                                    <td>9/1/2017</td>
                                    <td>{{ app.uuid }}</td>
                                    <td>{{ app.platform }}</td>
                                    <td>{{ app.category }}</td>
                                    <td>{{ app.status }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="app.status == 'denied'" class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Decline Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="text-wrap">Reason user input for explanation of declination to load here. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea consequat. Duis autem vel eum iriure dolor esse molestie consequat, vel illum.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <label class="switch">
                            <input v-on:click="autoApproveClick" v-model="auto_approve" type="checkbox"></input>
                            <span class="slider round"></span>
                        </label>
                        <label class="form-check-label switch-label">
                          Automatically approve updates
                        </label>
                    </div>
                </div>

                <div class="app-table">
                    <h4>Requested Permissions</h4>
                    <div class="table-responsive">
                        <table class="table table-striped table-sm w-auto">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="permission in app.permissions">
                                    <td>{{ permission.name }}</td>
                                    <td>{{ permission.type }}</td>
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
                    <div class="policy-table">
                        <pre class="prettyprint linenums hidenums">{
    "6ff40ba7-e1d2-425c-b60e-231847377caa": {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": [
        "Base-4"
        ]
    }
    }</pre>
                    </div>
                </div>

                <!-- APP DENY MODAL -->
                <b-modal title="Deny Application" hide-footer id="appActionModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <form>
                        <div class="form-group">
                            <textarea class="app-action form-control" id="appActionReason" rows="5" placeholder="Reason here..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-card btn-style-green">Send</button>
                        <div class="horizontal-divider">
                            <span class="line"></span>
                            <span class="text">OR</span>
                            <span class="line"></span>
                        </div>
                        <button type="submit" class="btn btn-card btn-style-white">Send without feedback</button>
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
            "auto_approve": true,
            "app": {
                "id": 1,
                "uuid": "6ff40ba7-e1d2-425c-b60e-231847377caa",
                "name": "Livio Music",
                "category": "Entertainment",
                "platform": "iOS",
                "icon_url": null,
                "status": "pending",
                "tech_email": "nick@nickschwab.com",
                "tech_phone": "616-799-7779",
                "vendor": {
                    "name": "Nick's App Company",
                    "email": "nick.schwab@livio.io",
                    "phone": null
                },
                "permissions": [
                    {
                        "name": "RPMs",
                        "type": "PARAMETER"
                    },
                    {
                        "name": "Speed",
                        "type": "PARAMETER"
                    },
                    {
                        "name": "GPS",
                        "type": "PARAMETER"
                    },
                    {
                        "name": "Tire Pressure",
                        "type": "PARAMETER"
                    },
                    {
                        "name": "Radio Control",
                        "type": "MODULE"
                    }
                ]
            }
        };
    },
    mounted: function(){
        setTimeout(PR.prettyPrint, 0);
    },
    methods: {
        "toggleActions": function(){
            this.actions_visible = !this.actions_visible;
        },
        "actionClick": function(){
            // TODO: mark app as approved or denied and set updated item data attributes
            alert("Action click on an item of status: " + this.app.status);
        },
        "autoApproveClick": function(){
            // TODO: save the app's auto-approve setting
            alert("Auto-approval set to: " + this.auto_approve);
        }
    },
    computed: {
        classStatusDot: function(){
            return {
                "color-red": this.app.status == "denied",
                "color-green": this.app.status == "approved"
            }
        },
        actionText: function(){
            return this.item.status == 'approved' ? 'Deny' : 'Approve';
        }
    }
}
</script>