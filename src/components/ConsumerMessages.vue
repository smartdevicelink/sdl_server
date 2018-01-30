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
                    <b-btn v-if="environment == 'STAGING'" v-b-modal.promoteModal class="btn btn-style-green btn-sm align-middle">Promote changes to production</b-btn>
                </div>

                <h4>Consumer Friendly Messages</h4>
                <section class="tiles">
                    <consumer-message-item
                        v-for="(item, index) in consumer_messages"
                        v-bind:item="item"
                        v-bind:environment="environment"
                        v-bind:index="index"
                        v-bind:key="item.id"
                        >
                    </consumer-message-item>

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
        },
        methods: {
            "promoteMessages": function () {
                this.handleModalClick("promote_button_loading", "promoteModal", "promoteAllMessages");
            },
            "handleModalClick": function (loadingProp, modalName, methodName) {
                //show a loading icon for the modal, and call the methodName passed in
                //when finished, turn off the loading icon, hide the modal, and reload the info
                this[loadingProp] = true;
                this[methodName](() => {
                    this[loadingProp] = false;
                    if (modalName) {
                        this.$refs[modalName].hide();
                    }
                    this.environmentClick();
                });
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
                this.httpRequest("post", "messages/promote", {id: id}, cb);
            },
            "mapAsync": function (array, func, cb) {
                let count = array.length;
                let mappedResults = [];
                for (let i = 0; i < array.length; i++) {
                    func(array[i], data => {
                        mappedResults.push(data);
                        count--;
                        if (count === 0) {
                            cb(mappedResults);
                        }
                    });
                }
            },
            "getConsumerMessageInfo": function (cb) {
                let url = "messages?environment=" + this.environment;
                this.httpRequest("get", url, {}, (err, response) => {
                    if (response) {
                        response.json().then(parsed => {
                            if (parsed.messages) {
                                cb(parsed.messages);
                            } else {
                                console.log("No message data returned");
                                cb();
                            }
                        });
                    }
                    else {
                        cb();
                    }
                });
            },
            "environmentClick": function () {
                //get high level message data
                this.getConsumerMessageInfo(messages => {
                    this.consumer_messages = messages;
                });
            },
            "httpRequest": function (action, route, body, cb) {
                if (action === "delete" || action === "get") {
                    if (body !== null) {
                        body = {body: body};
                    }
                }
                this.$http[action](route, body)
                    .then(response => {
                        cb(null, response);
                    }, response => {
                        console.error(response.body.error);
                        cb(response, null);
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