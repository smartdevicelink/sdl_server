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
        </ul>
    </nav>
</template>

<script>
export default {
    data: function(){
        return {
            "badge_counts": {
                "applications": 0,
                "functional_groups": 0
            }
        };
    },
    beforeCreate: function(){
        console.log("TODO: fetch pending app count and unallocated permission count")
        setTimeout(() => {
            this.badge_counts.applications = 4;
            this.badge_counts.functional_groups = 2;
        }, 200);
    }
}
</script>