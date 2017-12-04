<template>
    <router-link v-bind:to="{ path: 'functionalgroups/manage', query: { id: item.id, intent: 'edit'}}">
        <div>
            <h5>{{ item.name }}<i class="pull-right fa fa-pencil display-hover" aria-hidden="true"></i></h5>
            <div class="description">
                {{ item.description }}
            </div>
            <div class="permission-count">
                {{ item.selected_rpc_count + item.selected_parameter_count }} {{ permissionString(item) }}
            </div>
        </div>
    </router-link>
</template>

<script>
    export default {
        props: ['item'],
        data () {
            return {};
        },
        methods: {
            permissionString: function (item) {
                if (item.selected_rpc_count + item.selected_parameter_count !== 1) {
                    return "permissions";
                }
                else {
                    return "permission";
                }
            }
        }
    }
</script>