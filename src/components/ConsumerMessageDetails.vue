<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <div class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content">

                <div class="pull-right">
                    <template v-if="environment == 'STAGING' && id != null">
                        <b-btn id="delete" v-if="message.is_deleted === false" v-b-modal.deleteModal class="btn btn-danger btn-sm align-middle">Mark for deletion</b-btn>
                        <b-btn id="undelete" v-if="message.is_deleted === true" v-on:click="undeleteMessageGroup()" class="btn btn-success btn-sm align-middle">Undelete</b-btn>
                    </template>
                </div>

                <div class="functional-content">
                    <h4>Consumer Message {{ message.is_deleted ? "(deleted)" : "" }}</h4>

                    <!-- Name -->
                    <div class="form-row">
                        <h4 for="name">Name</h4>
                        <!-- TODO: first input in the textbox is ignored -->
                        <input v-model="message.message_category" :disabled="environment != 'STAGING'" type="email" class="form-control" id="email">
                    </div>

                    <!-- TODO: create container for RPCs -->
                    <div class="form-row">
                        <h4>Languages</h4>
                        <message-item
                            v-for="(value, key) in message.languages"
                            v-if="value.selected"
                            v-bind:item="value"
                            v-bind:environment="environment"
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
                            class="btn btn-card"
                            data-style="zoom-in"
                            v-if="environment == 'STAGING'"
                            v-on:click="saveMessageGroup()"
                            v-bind:loading="save_button_loading"
                            v-bind:class="{ 'btn-style-green': !message.is_deleted, 'btn-danger': message.is_deleted }">
                            {{ message && message.is_deleted ? 'Save deleted message' : 'Save message' }}
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
                        v-for="(value, key) in message.languages"
                        v-if="isLangAvailable(value)"
                        v-on:click="addLanguage(value)"
                    >
                    {{ key }}<i v-b-tooltip.hover.auto title="" class="fa fa-info-circle pull-right"></i>
                    </li>
                </ul>
            </b-modal>

            <!-- DELETE GROUP MODAL -->
            <b-modal ref="deleteModal" title="Delete Consumer Message" hide-footer id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                <small class="form-text text-muted">
                    Are you sure you want to delete this Consumer Message group and its associated languages? By doing so, the Consumer Message will be immediately revoked from the staging policy table when you press the save button, and will be revoked from the production policy table upon the next promotion to production.
                </small>
                <b-btn
                    v-on:click="deleteMessageGroup()"
                    class="btn btn-card btn-danger">
                    Yes, mark this message for deletion
                </b-btn>
            </b-modal>
        </div>
    </div>
</template>

<script>
import { eventBus } from '../main.js';
    export default {
        props: ['id','environment'],
        data: function () {
            return {
                "message": {},
                "lang_search": null,
                "save_button_loading": false,
                "delete_button_loading": false
            };
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
            "saveMessageGroup": function (callback) {
                // save the entire group w/ languages
                // TODO
                // back-end should clean the data by removing ids
                // and not saving languages which were not selected
                this.httpRequest("post", "messages", {messages: this.message}, callback);
            },
            "deleteMessageGroup": function (callback) {
                //save all messages in the messages object
                this.message.is_deleted = true;
                this.$refs.deleteModal.hide();
            },
            "undeleteMessageGroup": function() {
                this.message.is_deleted = false;
            },
            "getConsumerMessageInfo": function (cb) {
                let queryInfo = "messages?id=" + this.id;
                this.httpRequest("get", queryInfo, null, (err, response) => {
                    if (response) {
                        response.json().then(parsed => {
                            if (parsed.messages && parsed.messages.length) {
                                this.message = parsed.messages[0];
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
            },
            "deleteGroup": function () {
                this.handleModalClick("delete_button_loading", "deleteModal", "deleteMessageGroup");
            },
            "saveGroup": function () {
                this.handleModalClick("save_button_loading", null, "saveMessageGroup");
            },
            "handleModalClick": function (loadingProp, modalName, methodName) {
                //show a loading icon for the modal, and call the methodName passed in
                //when finished, turn off the loading icon, hide the modal, and push the
                //user back to the functional groups page
                this[loadingProp] = true;
                this[methodName](() => {
                    this[loadingProp] = false;
                    if (modalName) {
                        this.$refs[modalName].hide();
                    }
                    this.$router.push("/consumermessages");
                });
            },
        },
        created: function () {
            if(this.id){
                this.getConsumerMessageInfo();
            }
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs.addLanguageModal.onAfterLeave();
            this.$refs.deleteModal.onAfterLeave();
        }
    }
</script>