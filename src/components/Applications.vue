<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">

                <div v-for="appList in apps">
                    <div class="app-table" v-if="appList.list.length > 0">
                        <h4 :class="appList.class">{{ appList.title }}<a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/applications/" target="_blank"></a></h4>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th colspan="2">Application Name</th>
                                        <th>Last Update</th>
                                        <th>Platform</th>
                                        <th>State</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <app-row
                                        v-for="(item, index) in appList.list"
                                        v-bind:item="item"
                                        v-bind:index="index"
                                        v-bind:key="item.id"
                                        >
                                    </app-row>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<script>
    export default {
        data () {
            return {
                "apps": {
                    "apps_pending": {
                        "list": [],
                        "title": "Pending Applications"
                    },
                    "apps_approved": {
                        "list": [],
                        "class": "color-green",
                        "title": "Accepted Applications"
                    },
                    "apps_denied": {
                        "list": [],
                        "class": "color-red",
                        "title": "Limited Applications"
                    },
                }
            }
        },
        methods: {
            "getApplications": function(status = "PENDING", storage_attribute ="apps_pending") {
                this.httpRequest("get", "applications", {
                    "params": {
                        "approval_status": status
                    }
                }, (err, response) => {
                    if(err){
                        // error
                        console.log("Error receiving " + status + " applications. Status code: " + response.status);
                    }else{
                        // success
                        response.json().then(parsed => {
                            this.apps[storage_attribute].list = this.apps[storage_attribute].list.concat(parsed.data.applications);
                        });
                    }
                });
            }
        },
        created: function(){
            for (let key in this.apps) {
                this.apps[key].list = [];
            }
            this.getApplications("PENDING", "apps_pending");
            this.getApplications("STAGING", "apps_pending");
            this.getApplications("ACCEPTED", "apps_approved");
            this.getApplications("LIMITED", "apps_denied");
        }
    }
</script>
