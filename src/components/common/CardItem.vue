<template>
    <router-link v-bind:to="link" v-bind:class="{ 'opacity-30': item.is_deleted }">
        <div>
            <h5>
                {{ item.title }}
                <i v-if="environment != 'PRODUCTION'" class="pull-right fa fa-pencil display-hover" aria-hidden="true"></i>
            </h5>
            <div class="description">
                {{ item.description }}
            </div>
            <div v-if="item.is_default" class="color-green">
                <p>DEFAULT</p>
            </div>
            <div class="permission-count">
                {{ item.count || '0' }} {{ item.count == 1 ? count_label_singular : count_label_plural }}
            </div>
            <div
                v-if="item.status != 'PRODUCTION' || item.is_deleted"
                class="func-status-tag color-green">
                MODIFIED {{ item.is_deleted ? "(DELETED)" : "" }}
            </div>
        </div>
    </router-link>
</template>

<script>
    export default {
        props: ['item','environment', 'link', 'count_label_singular', 'count_label_plural'],
        data () {
            return {};
        }
    }
</script>
