<template>
    <router-link v-bind:to="{ path: 'consumermessages/manage', query: { message_category: item.message_category, intent: 'edit'}}" v-bind:class="{ 'opacity-30': item.is_deleted }">
        <div>
            <h5>{{ item.message_category }}<i class="pull-right fa fa-pencil display-hover" aria-hidden="true"></i></h5>
            <div class="description">
                {{ item.tts }}
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
        }
    }
</script>