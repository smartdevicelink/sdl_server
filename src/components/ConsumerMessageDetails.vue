<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <div class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content">

                <div class="functional-content">
                    <h4>Consumer Message</h4>

                    <!-- Name -->
                    <div class="form-row">
                        <h4 for="name">Name</h4>
                        <!-- TODO: first input in the textbox is ignored -->
                        <input v-model="copyMessageCategory" :disabled="intent == 'edit'" type="email" class="form-control" id="email">
                    </div>

                    <!-- TODO: create container for RPCs -->
                    <div class="form-row">
                        <h4>Languages</h4>
                        <message-item
                            v-for="(value, key) in messages"
                            v-if="value.selected"
                            v-bind:item="value"
                            v-bind:index="key"
                            v-bind:key="key">
                        </message-item>

                        <div v-b-modal.addLanguageModal id="add" class="another-rpc pointer">
                            <i class="fa fa-plus middle-middle"></i>
                        </div>
                    </div>
                    <!-- save button -->
                    <div>
                        <vue-ladda
                            type="submit"
                            class="btn btn-card btn-style-green"
                            data-style="zoom-in"
                            v-on:click="saveMessageGroup()"
                            v-bind:loading="save_button_loading">
                            Save All
                        </vue-ladda>
                    </div>
                
                </div>

            </div>

            <!-- ADD LANGUAGE MODAL -->
            <b-modal ref="addLanguageModal" title="Select Language" hide-footer id="addLanguageModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                <input v-model="lang_search" placeholder="Search for a language" class="form-control" id="lang-search">
                <ul class="list-group rpc-list">
                    <li
                        class="list-group-item rpc-list-item pointer"
                        v-for="(value, key) in messages"
                        v-if="isLangAvailable(value)"
                        v-on:click="addLanguage(value)"
                    >
                    {{ key }}<i v-b-tooltip.hover.auto title="" class="fa fa-info-circle pull-right"></i>
                    </li>
                </ul>
            </b-modal>
        </div>
    </div>
</template>

<script>
import { eventBus } from '../main.js';
    export default {
        props: ['message_category','intent'],
        data: function () {
            return {
                "messages": {},
                "lang_search": null,
                "save_button_loading": false,
                "copyMessageCategory": null
            };
        },
        watch: {
            //the one time where Vue fails. Make a copy of message_category and store here, then listen for changes
            //this prevents an issue where typing in the Name field ignores the first character
            copyMessageCategory: function (newMessageCategory) {
                //ensure that changes to newMessageCategory cause an update to all message information
                for (let lang in this.messages) {
                    this.messages[lang].message_category = newMessageCategory;
                }
            },
        },
        methods: {
            "addLanguage": function (lang) {
                lang.selected = true;
                this.$refs.addLanguageModal.hide();
            },
            "isLangAvailable": function (lang) {
                if (!this.lang_search) {
                    return !lang.selected;
                } else {
                    return !lang.selected && (lang.language_id.toLowerCase().indexOf(this.lang_search.toLowerCase()) > -1);
                }
            },
            "saveMessageGroup": function () { //TODO: remove all this
                this.save_button_loading = true;
                //save all messages in the messages object
                this.httpRequest("post", "messages", {messages: this.messages}, (err, res) => {
                    this.save_button_loading = false;
                    this.$router.push("/consumermessages");
                });
            },
            "getConsumerMessageInfo": function (getTemplate, cb) {
                let queryInfo;
                if (getTemplate) {
                    queryInfo = "messages?template=true";
                }
                else { //use message_category in this case
                    queryInfo = "messages?category=" + this.message_category;
                }
                //include environment
                queryInfo += "&environment=staging"; //always get in staging mode since all entries are editable
                this.httpRequest("get", queryInfo, null, (err, response) => {
                    if (response) {
                        response.json().then(parsed => {
                            if (parsed.messages) {
                                this.messages = parsed.messages;
                            } else {
                                console.log("No message data returned");
                            }
                            if (cb) {
                                cb(); //done
                            }
                        });                    
                    }
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
        created: function () {
            //only get info if the intent was made to edit an existing message
            //and if the category was actually passed in. otherwise return a template of a consumer message
            this.getConsumerMessageInfo(this.message_category === null || this.intent !== "edit", () => {
                this.copyMessageCategory = this.message_category; //store this into the copy of message category
            });
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs.addLanguageModal.onAfterLeave();
        }
    }
</script>