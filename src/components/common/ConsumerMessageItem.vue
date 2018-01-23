<template>
    <router-link v-bind:to="{ path: 'consumermessages/manage', query: { message_category: item.message_category, intent: 'edit'}}">
        <div>
            <h5>{{ item.message_category }}<i class="pull-right fa fa-pencil display-hover" aria-hidden="true"></i></h5>
            <div class="description">
                {{ item.tts }}
            </div>
            <div class="language-count">
                {{item.language_count}} {{languageString(item)}}
            </div>
            <div class="message-status-tag" v-if="item.status=='PRODUCTION'" v-bind:style="{ color: 'green'}">
                {{item.status}}
            </div>
            <div class="message-status-tag" v-else v-bind:style="{ color: 'orange'}">
                {{item.status}}
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
            languageString: function (item) {
                if (item.language_count !== 1) {
                    return "languages";
                }
                else {
                    return "language";
                }
            }
        }
    }
</script>