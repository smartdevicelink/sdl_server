<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <div class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content">
                <div class="pull-right">
                    <template v-if="environment == 'STAGING' && id != null">
                        <b-btn v-b-modal.promoteModal v-if="false" class="btn btn-style-green btn-sm align-middle">Promote to production</b-btn>
                        <b-btn v-if="fg.is_deleted == false" v-on:click="showDeleteModal()" class="btn btn-danger btn-sm align-middle">Delete</b-btn>
                        <b-btn v-else v-on:click="showUndeleteModal()" class="btn btn-success btn-sm align-middle">Restore</b-btn>
                    </template>
                </div>

                <div class="functional-content">
                    <h4>Functional Group <a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/messages-and-functional-groups/" target="_blank"></a></h4>

                    <!-- Name -->
                    <div class="form-row">
                        <h4 for="name">Name</h4>
                        <input v-model="fg.name" :disabled="id" type="email" class="form-control" id="email" required>
                        <p v-if="duplicateName && !id"><br>A functional group with this name already exists! By saving, you will overwrite the previously existing functional group.</p>
                    </div>

                    <!-- Description -->
                    <div class="form-row">
                        <h4 for="description">Description</h4>
                        <textarea v-model="fg.description" :disabled="fieldsDisabled" type="text" rows="2" class="form-control" id="description"></textarea>
                    </div>

                    <!-- User Consent Prompt -->
                    <div class="form-row">
                        <h4 for="consent-prompt">User Consent Prompt</h4>
                        <b-form-select
                            v-model="fg.user_consent_prompt"
                            :options="consentPromptOptions"
                            :disabled="fieldsDisabled"
                            class="custom-select w-100">
                        </b-form-select>
                        <div v-if="selectPromptText && selectPromptText.id" class="white-box">
                            {{ selectPromptText.prompt }}
                        </div>
                    </div>

                    <!-- Is default checkbox -->
                    <div class="form-row">
                        <h4 for="is-default">Special Grants</h4>
                        <b-form-checkbox
                            class="color-bg-gray color-primary"
                            v-model="fg.is_default"
                            v-bind:disabled="fieldsDisabled">
                            Grant this functional group to all applications by default
                        </b-form-checkbox>

                        <b-form-checkbox
                            class="color-bg-gray color-primary"
                            v-model="fg.is_pre_data_consent"
                            v-bind:disabled="fieldsDisabled">
                            Grant this functional group to all applications prior to the user accepting SDL data consent
                        </b-form-checkbox>

                        <b-form-checkbox
                            class="color-bg-gray color-primary"
                            v-model="fg.is_device"
                            v-bind:disabled="fieldsDisabled">
                            Grant this functional group to all applications after the user has accepted SDL data consent
                        </b-form-checkbox>

                        <b-form-checkbox
                            class="color-bg-gray color-primary"
                            v-model="fg.is_app_provider_group"
                            v-bind:disabled="fieldsDisabled">
                            Grant this functional group to all applications with at least one service provider type
                        </b-form-checkbox>

                        <b-form-checkbox
                            class="color-bg-gray color-primary"
                            v-model="fg.is_administrator_group"
                            v-bind:disabled="fieldsDisabled">
                            Grant this functional group to applications with "Administrator" privileges
                        </b-form-checkbox>
                    </div>

                    <!-- RPC containers -->
                    <div class="form-row">
                        <h4 for="rpcs">RPCs</h4>
                        <div class="rpcs">
                            <rpc-item
                                v-for="(item, index) in fg.rpcs"
                                v-if="item.selected"
                                v-bind:status="fg.status"
                                v-bind:environment="environment"
                                v-bind:fieldsDisabled="fieldsDisabled"
                                v-bind:item="item"
                                v-bind:index="index"
                                v-bind:key="index">
                            </rpc-item>

                            <div v-if="!fieldsDisabled" v-b-modal.addRpcModal id="add" class="another-rpc pointer">
                                <i class="fa fa-plus middle-middle"></i>
                            </div>
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
                            v-bind:class="{ 'btn-style-green': !fg.is_deleted, 'btn-danger': fg.is_deleted }">
                            Save functional group
                        </vue-ladda>
                    </div>
                </div>

                <!-- ADD PARAMETER GROUP MODAL -->
                <b-modal ref="addRpcModal" title="Select RPC" hide-footer id="addRpcModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <input v-model="rpc_search" placeholder="Search for an RPC" class="form-control" id="rpc-search">

                    <ul class="list-group rpc-list">
                        <li
                            class="list-group-item rpc-list-item pointer"
                            v-for="(item, index) in fg.rpcs"
                            v-if="isRpcAvailable(item)"
                            v-on:click="addRpc(item)"
                        >
                        {{ item.name }}
                        </li>
                    </ul>
                </b-modal>

                <!-- DELETE GROUP MODAL -->
                <b-modal ref="deleteModal" title="Delete Functional Group" hide-footer id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        Are you sure you want to delete this Functional Group? By doing so, the Functional Group will be immediately removed from the staging policy table, and will be removed from the production policy table upon the next promotion to production.
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-danger"
                        data-style="zoom-in"
                        v-on:click="deleteGroup()"
                        v-bind:loading="delete_button_loading">
                        Yes, delete this functional group
                    </vue-ladda>
                </b-modal>

                <!-- UNDELETE GROUP MODAL -->
                <b-modal ref="undeleteModal" title="Restore Functional Group" hide-footer id="undeleteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        Are you sure you want to restore this Functional Group? By doing so, the Functional Group will be immediately restored on the staging policy table, and will be restored on the production policy table upon the next promotion to production.
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-success"
                        data-style="zoom-in"
                        v-on:click="undeleteGroup()"
                        v-bind:loading="undelete_button_loading">
                        Yes, restore this functional group
                    </vue-ladda>
                </b-modal>

                <!-- COPY GROUP MODAL -->
                <b-modal ref="copyModal" title="Copy Functional Group as a Template" hide-footer id="copyModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        Copying this group will copy the contents and configuration of the group into the creation process for a new Functional Group, giving you an easier starting place.
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-style-green"
                        data-style="zoom-in"
                        v-on:click="copyGroup()"
                        v-bind:loading="copy_button_loading">
                        Copy as Editable Template
                    </vue-ladda>
                </b-modal>

                <!-- PROMOTE GROUP MODAL -->
                <b-modal ref="promoteModal" title="Promote to Production Status" hide-footer id="promoteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        Promoting this functional group will change its status to production. The functional group will no longer be editable, and it will take precedence over all previous versions of this functional group.
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-style-green"
                        data-style="zoom-in"
                        v-on:click="promoteGroup()"
                        v-bind:loading="promote_button_loading">
                        Promote to Production
                    </vue-ladda>
                </b-modal>
            </div>
        </div>
    </div>
</template>

<script>
import { eventBus } from '../main.js';
    export default {
        props: ['id','environment'],
        data: function(){
            return {
                "fg": {
                    "id": null,
                    "name": null,
                    "description": null,
                    "status": "STAGING",
                    "user_consent_prompt": null,
                    "selected_prompt_id": "null",
                    "is_default": false,
                    "is_pre_data_consent": false,
                    "is_device": false,
                    "is_app_provider_group": false,
                    "is_administrator_group": false,
                    "rpcs": [
                    ]
                },
                "rpc_search": null,
                "delete_button_loading": false,
                "undelete_button_loading": false,
                "copy_button_loading": false,
                "save_button_loading": false,
                "promote_button_loading": false,
                "selected_prompt": null,
                "consent_prompts": [],
                "group_names": []
            };
        },
        methods: {
            "addRpc": function(rpc){
                rpc.selected = true;
                this.$refs.addRpcModal.hide();
            },
            "isRpcAvailable": function(rpc){
                if(!this.rpc_search){
                    return !rpc.selected;
                }else{
                    return !rpc.selected && (rpc.name.toLowerCase().indexOf(this.rpc_search.toLowerCase()) > -1);
                }
            },
            "showDeleteModal": function() {
                this.$refs.deleteModal.show();
            },
            "showUndeleteModal": function() {
                this.$refs.undeleteModal.show();
            },
            "deleteGroup": function () {
                this.handleModalClick("delete_button_loading", "deleteModal", "deleteFunctionalGroupInfo");
            },
            "undeleteGroup": function() {
                this.handleModalClick("undelete_button_loading", "undeleteModal", "undeleteFunctionalGroupInfo");
            },
            "saveGroup": function () {
                this.handleModalClick("save_button_loading", null, "saveFunctionalGroupInfo");
            },
            "copyGroup": function () {
                this.handleModalClick("copy_button_loading", "copyModal", "saveFunctionalGroupInfo");
            },
            "promoteGroup": function () {
                this.handleModalClick("promote_button_loading", "promoteModal", "promoteFunctionalGroupInfo");
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
                    this.$router.push("/functionalgroups");
                });
            },
            "getConsentPrompts": function () {
                this.httpRequest("get", "messages?environment="+this.environment.toLowerCase()+"&hide_deleted=true", {}, (err, response) => {
                    if (response) {
                        //returns all en-us results under the environment specified
                        response.json().then(parsed => {
                            if (parsed.data.messages && parsed.data.messages.length) {
                                const transformedMessages = parsed.data.messages.map(function (msg) {
                                    return {
                                        "id": msg.id,
                                        "name": msg.message_category,
                                        "prompt": msg.text
                                    }
                                });
                                transformedMessages.unshift({
                                    "id": null,
                                    "name": "",
                                    "prompt": null
                                });
                                this.consent_prompts = transformedMessages;
                                console.log(this.consent_prompts);
                            }
                        });
                    }
                });
            },
            "getFunctionalGroupInfo": function (cb) {
                let queryInfo = "groups";
                if(!this.id){
                    queryInfo += "?template=true";
                }else{
                    queryInfo += "?id=" + this.id;
                }
                queryInfo += "&environment=" + this.environment.toLowerCase();

                this.httpRequest("get", queryInfo, {}, (err, response) => {
                    if (response) {
                        response.json().then(parsed => {
                            if (parsed.data.groups && parsed.data.groups[0]) {
                                this.fg = parsed.data.groups[0];
                                console.log(this.fg);
                            } else {
                                console.log("No functional data returned");
                            }
                            if (cb) {
                                cb(); //done
                            }
                        });
                    }
                });
            },
            "saveFunctionalGroupInfo": function (cb) {
                this.httpRequest("post", "groups", { "body": this.fg }, cb);
            },
            "promoteFunctionalGroupInfo": function (cb) {
                this.httpRequest("post", "groups/promote", { "body": this.fg }, cb);
            },
            "deleteFunctionalGroupInfo": function (cb) {
                this.fg.is_deleted = true;
                this.httpRequest("post", "groups", { "body": this.fg }, cb);
            },
            "undeleteFunctionalGroupInfo": function (cb) {
                this.fg.is_deleted = false;
                this.httpRequest("post", "groups", { "body": this.fg }, cb);
            },
            "getFunctionalGroupNames": function () {
                this.httpRequest("get", "groups/names", {}, (err, response) => {
                    if (response) {
                        response.json().then(parsed => {
                            this.group_names = parsed.data.names;
                        });
                    }
                });
            }
        },
        computed: {
            consentPromptOptions: function () {
                return this.consent_prompts.map(function (consentPrompt) {
                    return consentPrompt.name;
                });
            },
            selectPromptText: function () {
                return this.consent_prompts.find(prompt => {
                    return prompt.name === this.fg.user_consent_prompt;
                });
            },
            fieldsDisabled: function () {
                return (this.fg.is_deleted || this.environment != 'STAGING');
            },
            duplicateName: function () {
                return this.group_names.includes(this.fg.name);
            }
        },
        created: function(){
            // listen for checkbox changes in RPC components
            eventBus.$on("rpcCheckboxChecked", (rpc_index, item_index, item_type, is_checked) => {
                /*console.log({
                    rpc_index,
                    item_index,
                    item_type,
                    is_checked
                });*/
                if(item_type == "parameter"){
                    this.fg.rpcs[rpc_index].parameters[item_index].selected = is_checked;
                }else if(item_type == "hmi"){
                    this.fg.rpcs[rpc_index].hmi_levels[item_index].selected = is_checked;
                }
            });
            //only get functional group info if the intent was made to edit an existing functional
            //group and if the id was actually passed in. otherwise return a template of a functional group
            //get consent prompts regardless in case a new functional group from scratch is desired
            this.getConsentPrompts();
            this.getFunctionalGroupInfo();
            this.getFunctionalGroupNames();
        },
        mounted: function(){
            //this.$methods.addInvitee();
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs.copyModal.onAfterLeave();
            this.$refs.deleteModal.onAfterLeave();
            this.$refs.undeleteModal.onAfterLeave();
            this.$refs.addRpcModal.onAfterLeave();
            this.$refs.promoteModal.onAfterLeave();
        }
    }
</script>
