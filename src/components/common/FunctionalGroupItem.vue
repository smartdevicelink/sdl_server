<template>
    <router-link v-bind:to="{ path: 'functionalgroups/manage', query: { id: item.id, environment: environment}}" v-bind:class="{ 'opacity-30': item.is_deleted }">
        <div>
            <h5>{{ item.name }}<i v-if="environment != 'PRODUCTION'" class="pull-right fa fa-pencil display-hover" aria-hidden="true"></i></h5>
            <div class="description">
                {{ item.description }}
            </div>
            <div class="permission-count">
                {{ item.selected_rpc_count + item.selected_parameter_count }} {{ permissionString(item) }}
            </div>
            <div
                v-if="item.status != 'PRODUCTION' || item.is_deleted"
                class="func-status-tag color-green">
                CHANGED {{ item.is_deleted ? "(DELETED)" : "" }}
            </div>
        </div>
    </router-link>
</template>

<script>
    export default {
        props: ['item','environment'],
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