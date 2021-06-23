<template>
    <nav class="navbar navbar-expand-md navbar-dark fixed-top header-bg">
        <router-link to="/" class="navbar-brand col-sm-3 col-md-2">
            <img src="~@/assets/images/sdl_ps_logo@2x.png" class="nav-sdl-logo"/>
        </router-link>
        <button v-if="is_logged_in" type="button" v-on:click="openUserNav" class="btn btn-link hover-color-green user-nav">
            <i class="fa fa-fw fa-user-o color-white"></i>
        </button>
        <button class="navbar-toggler d-lg-none" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation" v-on:click="isHidden=!isHidden">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="navbar-collapse d-lg-none d-xl-block" data-toggle="collapse" v-if="!isHidden && (innerWidth < 768)" id="navbarsExampleDefault">
            <ul class="nav nav-pills flex-column d-md-none">
                
                <router-link tag="li" class="d-md-none" to="/applications">
                    <a class="nav-link">Applications <span v-if="badge_counts.applications > 0" class="badge badge-circle badge-danger">{{ badge_counts.applications }}</span></a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/policytable">
                    <a class="nav-link" href="/">View Policy Table</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/functionalgroups">
                    <a class="nav-link" href="/">Functional Groups <span v-if="badge_counts.functional_groups" class="badge badge-circle badge-danger">{{ badge_counts.functional_groups }}</span></a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/consumermessages">
                    <a class="nav-link" href="/">Consumer Messages <span v-if="badge_counts.consumer_messages" class="badge badge-circle badge-danger">{{ badge_counts.consumer_messages }}</span></a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/vehicledata">
                    <a class="nav-link" href="/">Custom Vehicle Data</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/moduleconfig">
                    <a class="nav-link" href="/">Module Config</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/about">
                    <a class="nav-link" href="/">About</a>
                </router-link>
                
            </ul>
        </div>
    </nav>
</template>

<script>
    import { eventBus } from '../../main.js';
    export default {
        data: function(){
            return {
                "is_logged_in": this.$session.exists(),
                "isHidden": true,
                "innerWidth": window.innerWidth,
                "badge_counts": {
                    "applications": 0,
                    "functional_groups": 0,
                    "consumer_messages": 0
                },
                "intervals": [
                    setInterval(this.setPendingAppCount, 60000),
                    setInterval(this.setUnmappedFunctionalCount, 60000)
                ]
            };
        },
        methods: {
            "openUserNav": function(){
                eventBus.$emit("openUserNav");
            },
            "onResize": function () {
                this.innerWidth = window.innerWidth
            },
            "setPendingAppCount": function() {
                // get number of pending applications
                this.httpRequest("get", "applications", {
                    "params": {
                        "approval_status": "PENDING"
                    }
                }, (err, response) => {
                    if(err){
                        // error
                        console.log("Error receiving PENDING applications.");
                    }else{
                        // success
                        response.json().then(parsed => {
                            this.badge_counts.applications = parsed.data.applications.length;
                        });
                    }
                });
            },
            "setUnmappedFunctionalCount": function() {
                // get number of unmapped RPCs and parameters in PRODUCTION
                this.httpRequest("get", "permissions/unmapped?environment=PRODUCTION", {
                }, (err, response) => {
                    if(err){
                        // error
                        console.log("Error fetching functional group data.");
                        console.log(response);
                    }else{
                        // success
                        response.json().then(parsed => {
                            this.badge_counts.functional_groups = (parsed.data.unmapped_rpc_count + parsed.data.unmapped_parameter_count);
                        });
                    }
                });
            }
        },
        watch: {
            "$route": function(){
                this.is_logged_in = this.$session.exists();
            },
        },
        created: function(){
            this.setPendingAppCount();
            this.setUnmappedFunctionalCount();
        },
        mounted() {
            this.$nextTick(() => {
                window.addEventListener('resize', this.onResize);
            })
        },
        beforeDestroy() { 
            window.removeEventListener('resize', this.onResize); 
            // ensure closing of all modals
            for(var i = 0; i < this.intervals.length; i++){
                clearInterval(this.intervals[i]);
            }
        },
    }
</script>