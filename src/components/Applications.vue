<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <template v-if="apps_pending.length > 0">
                    <div class="app-table">
                        <h4>Pending Applications</h4>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th colspan="2">Application Name</th>
                                        <th>Last Update</th>
                                        <th>Platform</th>
                                        <th>Category</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <app-row
                                        v-for="(item, index) in apps_pending"
                                        v-bind:item="item"
                                        v-bind:index="index"
                                        v-bind:key="item.id"
                                        >
                                    </app-row>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </template>

                <div class="app-table">
                    <h4 class="color-green">Approved Applications</h4>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th colspan="2">Application Name</th>
                                    <th>Last Update</th>
                                    <th>Platform</th>
                                    <th>Category</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <app-row
                                    v-for="(item, index) in apps_approved"
                                    v-bind:item="item"
                                    v-bind:index="index"
                                    v-bind:key="item.id"
                                    >
                                </app-row>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="app-table">
                    <h4 class="color-red">Denied Applications</h4>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th colspan="2">Application Name</th>
                                    <th>Last Update</th>
                                    <th>Platform</th>
                                    <th>Category</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <app-row
                                    v-for="(item, index) in apps_denied"
                                    v-bind:item="item"
                                    v-bind:index="index"
                                    v-bind:key="item.id"
                                    >
                                </app-row>
                            </tbody>
                        </table>
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
                "apps_pending": [],
                "apps_approved": [],
                "apps_denied": []
            }
        },
        methods: {
            "getApplications": function(status = "PENDING", storage_attribute ="apps_pending") {
                this.$http.get("applications", {
                    "params": {
                        "approval_status": status
                    }
                }).then(response => {
                    // success
                    response.json().then(parsed => {
                        this[storage_attribute] = parsed.data.applications;
                    });
                }, response => {
                    // error
                    console.log("Error receiving " + status + " applications. Status code: " + response.status);
                });
            }
        },
        created: function(){
            this.getApplications("PENDING", "apps_pending");
            this.getApplications("ACCEPTED", "apps_approved");
            this.getApplications("DENIED", "apps_denied");
        }
    }
</script>