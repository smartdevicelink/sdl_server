<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <b-form-radio-group id="selectEnvironment"
                    buttons
                    button-variant="toggle"
                    v-on:change="environmentClick"
                    v-model="environment"
                    :options="environmentOptions"
                    name="chooseEnvironment" />

                <div class="pull-right">
                    <b-btn v-if="environment == 'STAGING' && can_promote" v-b-modal.promoteModal class="btn btn-style-green btn-sm align-middle">Promote changes to production</b-btn>
                </div>

                <h4>Consumer Friendly Messages<a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/messages-and-functional-groups/" target="_blank"></a></h4>
                <section class="tiles">
                    <card-item
                        v-for="(item, index) in consumer_messages"
                        v-bind:item="{
                            id: item.id,
                            title: item.message_category,
                            description: item.tts,
                            count: item.language_count,
                            is_deleted: item.is_deleted,
                            status: item.status
                        }"
                        v-bind:environment="environment"
                        v-bind:link="{
                            path: 'consumermessages/manage',
                            query: {
                                id: item.id,
                                environment: environment
                            }
                        }"
                        v-bind:count_label_plural="'languages'"
                        v-bind:count_label_singular="'language'"
                        v-bind:index="index"
                        v-bind:key="item.id"
                        >
                    </card-item>

                    <router-link
                        v-bind:to="{ path: 'consumermessages/manage', query: { environment: environment } }"
                        v-if="environment == 'STAGING'"
                        class="tile-plus"
                        >
                            <div class="tile-plus-container content-middle">
                                +
                            </div>
                    </router-link>
                </section>
            </main>

            <!-- PROMOTE GROUP MODAL -->
            <b-modal ref="promoteModal" title="Promote Consumer Messages to Production" hide-footer id="promoteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                <small class="form-text text-muted">
                    This will promote all staging Consumer Messages and their associated languages to production, modifying the production policy table. Are you sure you want to do this?
                </small>
                <vue-ladda
                    type="button"
                    class="btn btn-card btn-style-green"
                    data-style="zoom-in"
                    v-on:click="promoteMessages()"
                    v-bind:loading="promote_button_loading">
                    Yes, promote to production!
                </vue-ladda>
            </b-modal>
        </div>
    </div>
</template>

<script>
    export default {
        data () {
            return {
                "environment": "STAGING",
                "environmentOptions": [
                    {
                        "text": "Staging",
                        "value": "STAGING"
                    },
                    {
                        "text": "Production",
                        "value": "PRODUCTION"
                    }
                ],
                "consumer_messages": [],
                "promote_button_loading": false,
                "selected_language": null,
                "selected": []
            }
        },
        computed: {
            can_promote: function() {
                var show_button = false;
                for(var i = 0; i < this.consumer_messages.length; i++){
                    if(this.consumer_messages[i].status == "STAGING") show_button = true;
                }
                return show_button;
            },
        },
        methods: {
            "promoteMessages": function () {
                this.handleModalClick("promote_button_loading", "promoteModal", "promoteAllMessages");
            },
            "promoteAllMessages": function (cb) {
                // build an array of STAGING message IDs
                var staging_ids = [];
                for(var i = 0; i < this.consumer_messages.length; i++){
                    if(this.consumer_messages[i].status == "STAGING"){
                        staging_ids.push(this.consumer_messages[i].id);
                    }
                }

                staging_ids.length ? this.promoteMessageGroup(staging_ids, cb) : cb();
            },
            "promoteMessageGroup": function (id, cb) {
                //save all messages in the messages object
                this.httpRequest("post", "messages/promote", {"body": { id: id } }, cb);
            },
            "getConsumerMessageInfo": function (cb) {
                let url = "messages?environment=" + this.environment;
                this.httpRequest("get", url, {}, (err, response) => {
                    if (err) {
                        cb();
                    } else {
                        response.json().then(parsed => {
                            if (parsed.data.messages) {
                                cb(parsed.data.messages);
                            } else {
                                console.log("No message data returned");
                                cb();
                            }
                        });
                    }
                });
            },
            "environmentClick": function () {
                this.$nextTick(function () {
                    //get high level message data
                    this.getConsumerMessageInfo(messages => {
                        this.consumer_messages = messages;
                    });
                });
            }
        },
        mounted: function(){
            this.environmentClick();
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs.promoteModal.onAfterLeave();
        }
    }
</script>
