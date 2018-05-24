<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <div class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content">

                <div class="pull-right">
                    <template v-if="environment == 'STAGING' && id != null">
                        <b-btn id="delete" v-if="message.is_deleted === false" v-on:click="showDeleteModal()" class="btn btn-danger btn-sm align-middle">Delete</b-btn>
                        <b-btn id="undelete" v-else v-on:click="showUndeleteModal()" class="btn btn-success btn-sm align-middle">Restore</b-btn>
                    </template>
                </div>

                <div class="functional-content">
                    <h4>Consumer Message {{ message.is_deleted ? "(deleted)" : "" }} <a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/messages-and-functional-groups/" target="_blank"></a></h4>

                    <!-- Name -->
                    <div class="form-row">
                        <h4 for="name">Name</h4>
                        <input v-model="message.message_category" :disabled="id" type="email" class="form-control" id="email">
                        <p v-if="duplicateName && !id"><br>A consumer message with this name already exists! By saving, you will overwrite the previously existing consumer message.</p>
                    </div>

                    <!-- container for languages -->
                    <div class="form-row">
                        <h4>Languages</h4>
                        <message-item
                            v-for="(value, key) in message.languages"
                            v-if="value.selected"
                            v-bind:item="value"
                            v-bind:fieldsDisabled="fieldsDisabled"
                            v-bind:environment="environment"
                            v-bind:index="key"
                            v-bind:key="key">
                        </message-item>

                        <div v-if="!fieldsDisabled" v-b-modal.addLanguageModal id="add" class="another-rpc pointer">
                            <i class="fa fa-plus middle-middle"></i>
                        </div>
                    </div>
                    <!-- save button -->
                    <div>
                        <vue-ladda
                            type="submit"
                            class="btn btn-card"
                            data-style="zoom-in"
                            v-if="!fieldsDisabled"
                            v-on:click="saveGroup()"
                            v-bind:loading="save_button_loading"
                            v-bind:class="{ 'btn-style-green': !message.is_deleted, 'btn-danger': message.is_deleted }">
                            Save consumer message
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
                    {{ value.language_id }}
                    </li>
                </ul>
            </b-modal>

            <!-- DELETE GROUP MODAL -->
            <b-modal ref="deleteModal" title="Delete Consumer Message" hide-footer id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                <small class="form-text">
                    <p>Are you sure you want to delete this Consumer Message group and its associated languages? By doing so, the Consumer Message will be immediately removed from the staging policy table, and will be removed from the production policy table upon the next promotion to production.</p>
                    <p v-if="message.functional_group_names && message.functional_group_names.length" class="alert alert-danger">
                        This Consumer Message Group is attached to the following staging Functional Groups. Deleting it will also remove the Consumer Message from these Functional Groups.
                        <ul style="margin-top:1em;">
                            <li
                                v-for="(item, index) in message.functional_group_names"
                                v-bind:item="item"
                                v-bind:index="index"
                                v-bind:key="item">
                                {{ item }}
                            </li>
                        </ul>
                    </p>

                </small>
                <b-btn
                    v-on:click="deleteGroup()"
                    class="btn btn-card btn-danger">
                    Yes, delete this consumer message
                </b-btn>
            </b-modal>

            <!-- UNDELETE GROUP MODAL -->
            <b-modal ref="undeleteModal" title="Restore Consumer Message" hide-footer id="undeleteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                <small class="form-text text-muted">
                    Are you sure you want to restore this Consumer Message group and its associated languages? By doing so, the Consumer Message will be immediately restored on the staging policy table, and will be restored on the production policy table upon the next promotion to production.
                </small>
                <vue-ladda
                    type="button"
                    class="btn btn-card btn-success"
                    data-style="zoom-in"
                    v-on:click="undeleteGroup()"
                    v-bind:loading="undelete_button_loading">
                    Yes, restore this consumer message
                </vue-ladda>
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
                "delete_button_loading": false,
                "undelete_button_loading": false,
                "message_names": []
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
                this.httpRequest("post", "messages", {"body": { messages: [this.message]} }, callback);
            },
            "showDeleteModal": function() {
                this.$refs.deleteModal.show();
            },
            "showUndeleteModal": function() {
                this.$refs.undeleteModal.show();
            },
            "deleteMessageGroup": function (cb) {
                this.message.is_deleted = true;
                this.httpRequest("post", "messages", {"body": { messages: [this.message]} }, cb);
            },
            "undeleteMessageGroup": function(cb) {
                this.message.is_deleted = false;
                this.httpRequest("post", "messages", {"body": { messages: [this.message]} }, cb);
            },
            "getConsumerMessageInfo": function (cb) {
                let queryInfo = "messages";
                if(!this.id){
                    queryInfo += "?template=true";
                }else{
                    queryInfo += "?id=" + this.id;
                }
                this.httpRequest("get", queryInfo, {}, (err, response) => {
                    if (err) {
                        console.log(err);
                    } else {
                        response.json().then(parsed => {
                            if (parsed.data.messages && parsed.data.messages.length) {
                                this.message = parsed.data.messages[0];
                                console.log(this.message);
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
            "deleteGroup": function () {
                this.handleModalClick("delete_button_loading", "deleteModal", "deleteMessageGroup");
            },
            "undeleteGroup": function () {
                this.handleModalClick("undelete_button_loading", "undeleteModal", "undeleteMessageGroup");
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
            "getConsumerMessageNames": function () {
                this.httpRequest("get", "messages/names", {}, (err, response) => {
                    if (response) {
                        response.json().then(parsed => {
                            this.message_names = parsed.data.names;
                        });
                    }
                });
            }
        },
        computed: {
            fieldsDisabled: function () {
                return (this.message.is_deleted || this.environment != 'STAGING');
            },
            duplicateName: function () {
                return this.message_names.includes(this.message ? this.message.message_category : undefined);
            }
        },
        created: function () {
            this.getConsumerMessageInfo();
            this.getConsumerMessageNames();
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs.addLanguageModal.onAfterLeave();
            this.$refs.deleteModal.onAfterLeave();
            this.$refs.undeleteModal.onAfterLeave();
        }
    }
</script>
