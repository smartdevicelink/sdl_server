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
            }
        };
    },
    beforeCreate: function(){
        this.$http.get("applications", {
            "params": {
                "approval_status": "PENDING"
            }
        }).then(response => {
            // success
            response.json().then(parsed => {
                this.badge_counts.applications = parsed.applications.length;
            });
        }, response => {
            // error
            console.log("Error receiving PENDING applications. Status code: " + response.status);
        });

        // TODO: get function group badge number count

    }
}
</script>