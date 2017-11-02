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
        beforeCreate: function(){
            this.$http.get("applications", {
                "params": {
                    "approval_status": "PENDING"
                }
            }).then(response => {
                // success
                response.json().then(parsed => {
                    console.log(response);
                    this.apps_pending = parsed.applications;
                });
            }, response => {
                // error
                console.log("Error receiving PENDING applications. Status code: " + response.status);
            });

            this.$http.get("applications", {
                "params": {
                    "approval_status": "ACCEPTED"
                }
            }).then(response => {
                // success
                response.json().then(parsed => {
                    this.apps_approved = parsed.applications;
                });
            }, response => {
                // error
                console.log("Error receiving ACCEPTED applications. Status code: " + response.status);
            });

            this.$http.get("applications", {
                "params": {
                    "approval_status": "DENIED"
                }
            }).then(response => {
                // success
                response.json().then(parsed => {
                    this.apps_denied = parsed.applications;
                });
            }, response => {
                // error
                console.log("Error receiving DENIED applications. Status code: " + response.status);
            });
        }
    }
</script>