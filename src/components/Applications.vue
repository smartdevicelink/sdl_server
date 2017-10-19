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
                "apps_pending": [
                    {
                        "id": 1,
                        "name": "Livio Music",
                        "category": "Entertainment",
                        "platform": "iOS",
                        "icon_url": null,
                        "approval_status": "pending"
                    },
                    {
                        "id": 2,
                        "name": "Livio Music",
                        "category": "Entertainment",
                        "platform": "Android",
                        "icon_url": null,
                        "approval_status": "pending"
                    },
                    {
                        "id": 3,
                        "name": "Livio T-1",
                        "category": "Entertainment",
                        "platform": "Skynet",
                        "icon_url": null,
                        "approval_status": "pending"
                    }
                ],
                "apps_approved": [
                    {
                        "id": 4,
                        "name": "Spotify for Android",
                        "category": "Entertainment",
                        "platform": "Android",
                        "icon_url": null,
                        "approval_status": "approved"
                    },
                    {
                        "id": 5,
                        "name": "Pandora for iOS",
                        "category": "Entertainment",
                        "platform": "iOS",
                        "icon_url": null,
                        "approval_status": "approved"
                    }
                ],
                "apps_denied": [
                    {
                        "id": 6,
                        "name": "Glympse",
                        "category": "Navigation",
                        "platform": "Android",
                        "icon_url": null,
                        "approval_status": "denied"
                    },
                    {
                        "id": 7,
                        "name": "Google Maps",
                        "category": "Navigation",
                        "platform": "Android",
                        "icon_url": null,
                        "approval_status": "denied"
                    }
                ]
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