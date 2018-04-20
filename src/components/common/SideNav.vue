<template>
    <nav class="col-sm-3 col-md-2 d-none d-sm-block nav-bg sidebar">
        <ul class="nav nav-pills flex-column">
            <router-link tag="li" class="nav-item" to="/applications" active-class="active">
                <a class="nav-link">Applications <span v-if="badge_counts.applications > 0" class="badge badge-circle badge-danger">{{ badge_counts.applications }}</span></a>
            </router-link>
            <router-link tag="li" class="nav-item" to="/policytable" active-class="active">
                <a class="nav-link">View Policy Table</a>
            </router-link>
            <router-link tag="li" class="nav-item" to="/functionalgroups" active-class="active">
                <a class="nav-link">Functional Groups <span v-if="badge_counts.functional_groups" class="badge badge-circle badge-danger">{{ badge_counts.functional_groups }}</span></a>
            </router-link>
            <router-link tag="li" class="nav-item" to="/consumermessages" active-class="active">
                <a class="nav-link">Consumer Messages <span v-if="badge_counts.consumer_messages" class="badge badge-circle badge-danger">{{ badge_counts.consumer_messages }}</span></a>
            </router-link>
            <router-link tag="li" class="nav-item" to="/moduleconfig" active-class="active">
                <a class="nav-link">Module Config</a>
            </router-link>
        </ul>
    </nav>
</template>

<script>
export default {
    data: function(){
        return {
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
    created: function(){
        this.setPendingAppCount();
        this.setUnmappedFunctionalCount();
    },
    beforeDestroy () {
        // ensure closing of all modals
        for(var i = 0; i < this.intervals.length; i++){
            clearInterval(this.intervals[i]);
        }
    }
}
</script>