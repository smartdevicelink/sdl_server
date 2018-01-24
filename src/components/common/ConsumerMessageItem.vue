<template>
    <router-link v-bind:to="{ path: 'consumermessages/manage', query: { id: item.id, environment: environment}}" v-bind:class="{ 'opacity-30': item.is_deleted }">
        <div>
            <h5>{{ item.message_category }}<i v-if="environment != 'PRODUCTION'" class="pull-right fa fa-pencil display-hover"aria-hidden="true"></i></h5>
            <div class="description">
                {{ item.tts }}
            </div>
            <div class="language-count">
                {{item.language_count}} language{{ item.language_count !== 1 ? "s" : "" }}
            </div>
            <div v-if="environment != 'PRODUCTION'" class="message-status-tag">
                {{item.status}}
            </div>
        </div>
    </router-link>
</template>

<script>
    export default {
        props: ['item', 'environment'],
        data () {
            return {};
        }
    }
</script>