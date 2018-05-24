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

                <div v-if="unused_count.rpcs !== 0 || unused_count.parameters !== 0" class="alert color-bg-red color-white d-table" role="alert">
                    ** Notice: {{ unused_permissions_text }} not currently being used in a functional group.
                    <div v-for="perm in unmapped_permissions">
                        {{ perm.name }} ({{ perm.type }})
                    </div>
                </div>
                <h4>Functional Groups<a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/messages-and-functional-groups/" target="_blank"></a></h4>
                <section class="tiles">
                    <card-item
                        v-for="(item, index) in functional_groups"
                        v-bind:item="{
                            id: item.id,
                            title: item.name,
                            description: item.description,
                            count: item.selected_rpc_count,
                            is_deleted: item.is_deleted,
                            is_default: item.is_default,
                            status: item.status
                        }"
                        v-bind:environment="environment"
                        v-bind:link="{
                            path: 'functionalgroups/manage',
                            query: {
                                id: item.id,
                                environment: environment
                            }
                        }"
                        v-bind:count_label_plural="'permissions'"
                        v-bind:count_label_singular="'permission'"
                        v-bind:index="index"
                        v-bind:key="item.id"
                        >
                    </card-item>
                    <router-link
                        v-bind:to="{ path: 'functionalgroups/manage', query: { environment: environment } }"
                        v-if="environment == 'STAGING'"
                        class="tile-plus"
                        >
                            <div class="tile-plus-container content-middle">
                                +
                            </div>
                    </router-link>
                    <!-- DISABLED MODAL VERSION W/ CLONING AS TEMPLATE -->
                    <a v-if="false && environment == 'STAGING'" v-b-modal.functionalGroupModal class="tile-plus">
                        <div class="tile-plus-container content-middle">
                            +
                        </div>
                    </a>
                    <!-- END DISABLED MODAL VERSION -->
                </section>

                <!-- NEW FUNCTIONAL GROUP MODAL -->
                <b-modal ref="functionalGroupModal" title="Add new functional group" hide-footer id="functionalGroupModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small id="blankHelp" class="form-text text-muted">
                        Start from scratch with a blank template
                    </small>
                    <router-link v-bind:to="{ path: 'functionalgroups/manage', query: { intent: 'create' } }">
                        <button type="button" aria-describedby="blankHelp" class="btn btn-card btn-style-green">Create New Blank Functional Group</button>
                    </router-link>
                    <div class="horizontal-divider">
                        <span class="line"></span>
                        <span class="text">OR</span>
                        <span class="line"></span>
                    </div>
                    <small id="copyHelp" class="form-text text-muted">
                        Create a duplicate of an existing functional group as a starting point
                    </small>
                    <b-form-select
                        v-model="selected_group_id"
                        v-on:input="selectedFunctionalGroup()"
                        class="custom-select dropdown w-100">
                        <option value="null">Select a Functional Group...</option>
                        <option
                            v-for="(item, index) in functional_groups"
                            v-bind:value="item.id">
                            {{ item.name }}
                        </option>
                    </b-form-select>
                    <b-btn v-bind:disabled="is_clone_disabled" v-on:click="cloneGroupById()" type="button" aria-describedby="copyHelp" class="btn btn-card btn-style-green">Create New Functional Group Based on Existing Group</b-btn>
                    <!--
                    <router-link v-bind:to="{ path: 'functionalgroups/manage', query: { id: selected_group_id, intent: 'create' } }">
                        <b-btn v-bind:disabled="is_clone_disabled" type="button" aria-describedby="copyHelp" class="btn btn-card btn-style-green">Create New Functional Group Based on Existing Group</b-btn>
                    </router-link>
                    -->
                </b-modal>

            </main>

            <!-- PROMOTE GROUP MODAL -->
            <b-modal ref="promoteModal" title="Promote Functional Groups to Production" hide-footer id="promoteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                <small class="form-text">
                    <p>This will promote all modified Functional Groups to production, immediately updating the production policy table. Are you sure you want to do this?</p>
                    <p v-if="staging_consent_prompts_in_use.length" class="alert alert-danger">
                        One or more Functional Groups are using the following Consumer Messages which have changes that have not yet been promoted to production. You may want to consider promoting your Consumer Messages to production before promoting your Functional Groups.
                        <ul style="margin-top:1em;">
                            <li
                                v-for="(item, index) in staging_consent_prompts_in_use"
                                v-bind:item="item"
                                v-bind:index="index"
                                v-bind:key="item">
                                {{ item }}
                            </li>
                        </ul>
                    </p>
                </small>
                <vue-ladda
                    type="button"
                    class="btn btn-card btn-style-green"
                    data-style="zoom-in"
                    v-on:click="promoteGroupsClick()"
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
                "promote_button_loading": false,
                "selected_group_id": null,
                "is_clone_disabled": true,
                "unused_count": {
                    "rpcs": 0,
                    "parameters": 0
                },
                "unmapped_permissions": [],
                "functional_groups": []
            }
        },
        computed: {
            can_promote: function() {
                var show_button = false;
                for(var i = 0; i < this.functional_groups.length; i++){
                    if(this.functional_groups[i].status == "STAGING") show_button = true;
                }
                return show_button;
            },
            unused_permissions_text: function () {
                const rpcCount = this.unused_count.rpcs;
                const parameterCount = this.unused_count.parameters;
                let output = "";
                if (rpcCount !== 1) {
                    output += "There are " + rpcCount + " RPCs";
                }
                else {
                    output += "There is " + rpcCount + " RPC";
                }
                if (parameterCount !== 1) {
                    output += " and " + parameterCount + " parameters";
                }
                else {
                    output += " and " + parameterCount + " parameter";
                }
                return output;
            },
            staging_consent_prompts_in_use: function () {
                let cfm = [];
                this.functional_groups.forEach(function(fg){
                    if(fg.selected_prompt_status == "STAGING" && fg.user_consent_prompt && cfm.indexOf(fg.user_consent_prompt) < 0){
                        cfm.push(fg.user_consent_prompt);
                    }
                });
                return cfm;
            }
        },
        methods: {
            "environmentClick": function () {
                this.$nextTick(function () {
                    this.functional_groups = [];
                    //get high level functional group data
                    this.getFunctionalGroupData();
                    //get unmapped permissions
                    this.getUnmappedPermissions();
                });
            },
            "getFunctionalGroupData": function () {
                this.httpRequest("get", "groups", {
                    "params": {
                        "environment": this.environment
                    }
                }, (err, response) => {
                    if (err) {
                        console.log("Error fetching functional group data: ");
                        console.log(err);
                    } else {
                        response.json().then(parsed => {
                            if(parsed.data.groups && parsed.data.groups.length){
                                this.functional_groups = parsed.data.groups;
                            }else{
                                console.log("No functional data returned");
                            }
                        });
                    }
                });
            },
            "getUnmappedPermissions": function () {
                this.httpRequest("get", "permissions/unmapped", {
                    "params": {
                        "environment": this.environment
                    }
                }, (err, response) => {
                    if (err) {
                        console.log("Error fetching functional group data: ");
                        console.log(err);
                    } else {
                        response.json().then(parsed => {
                            this.unmapped_permissions = parsed.data.permissions;
                            this.unused_count.rpcs = parsed.data.unmapped_rpc_count;
                            this.unused_count.parameters = parsed.data.unmapped_parameter_count;
                        });
                    }
                });
            },
            "promoteGroupsClick": function () {
                this.handleModalClick("promote_button_loading", "promoteModal", "promoteAllGroups");
            },
            "promoteAllGroups": function (cb) {
                // build an array of STAGING IDs
                var staging_ids = [];
                for(var i = 0; i < this.functional_groups.length; i++){
                    if(this.functional_groups[i].status == "STAGING"){
                        staging_ids.push(this.functional_groups[i].id);
                    }
                }

                staging_ids.length ? this.httpRequest("post", "groups/promote", { "body": { id: staging_ids } }, cb) : cb();
            },
            "selectedFunctionalGroup": function () {
                this.is_clone_disabled = this.selected_group_id != "null" ? false : true;
            },
            "cloneGroupById": function () {
                //using selected_group_id, query the server for the full functional group info, then clone that via a save
                this.getFunctionalGroupInfo(this.selected_group_id, (err, response) => {
                    if (response) {
                        response.json().then(json => {
                            const fg = json.data.groups[0];
                            this.saveFunctionalGroupInfo(fg, () => {
                                //process complete! refresh the data on the page
                                this.environmentClick();
                                this.$refs.functionalGroupModal.hide();
                            });
                        });
                    }
                });
            },
            "getFunctionalGroupInfo": function (id, cb) {
                this.httpRequest("get", "groups?id=" + id, {}, cb);
            },
            "saveFunctionalGroupInfo": function (functionalGroup, cb) {
                this.httpRequest("post", "groups", { "body": functionalGroup }, cb);
            }
        },
        mounted: function(){
            this.environmentClick();
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs.functionalGroupModal.onAfterLeave();
            this.$refs.promoteModal.onAfterLeave();
        }
    }
</script>
