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
                    <b-btn v-if="environment == 'STAGING'" v-b-modal.promoteModal class="btn btn-style-green btn-sm align-middle">Promote all to production</b-btn>
                </div>

                <div v-if="unused_count.rpcs !== 0 || unused_count.parameters !== 0" class="alert color-bg-red color-white d-table" role="alert">
                    ** Notice: {{ unused_permissions_text }} not currently being used in a functional group.
                    <div v-for="perm in unmapped_permissions">
                        {{ perm.name }} ({{ perm.type }})
                    </div>
                </div>
                <h4>Functional Groups</h4>
                <section class="tiles">
                    <functional-group-item
                        v-for="(item, index) in functional_groups"
                        v-bind:item="item"
                        v-bind:environment="environment"
                        v-bind:index="index"
                        v-bind:key="item.id"
                        >
                    </functional-group-item>
                    <a v-if="environment == 'STAGING'" v-b-modal.functionalGroupModal class="tile-plus">
                        <div class="tile-plus-container content-middle">
                            +
                        </div>
                    </a>
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
                <small class="form-text text-muted">
                    This will promote all staging Functional Groups to production, modifying the production policy table. Are you sure you want to do this?
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
        },
        methods: {
            "environmentClick": function () {
                this.functional_groups = [];
                //get high level functional group data
                this.getFunctionalGroupData();
                //get unmapped permissions
                this.getUnmappedPermissions();
            },
            "getFunctionalGroupData": function () {
                this.$http.get("groups?environment=" + this.environment, {})
                    .then(response => {
                        // success
                        response.json().then(parsed => {
                            if(parsed.groups && parsed.groups.length){
                                this.functional_groups = parsed.groups;
                            }else{
                                console.log("No functional data returned");
                            }
                        });
                    }, response => {
                        // error
                        console.log("Error fetching functional group data: " + response.body.error);
                    });
            },
            "getUnmappedPermissions": function () {
                this.$http.get("permissions/unmapped?environment=" + this.environment, {})
                    .then(response => {
                        // success
                        response.json().then(parsed => {
                            this.unmapped_permissions = parsed.permissions;
                            this.unused_count.rpcs = parsed.unmapped_rpc_count;
                            this.unused_count.parameters = parsed.unmapped_parameter_count;
                        });
                    }, response => {
                        // error
                        console.log("Error fetching functional group data: " + response.body.error);
                    });
            },
            "selectedFunctionalGroup": function () {
                this.is_clone_disabled = this.selected_group_id != "null" ? false : true;
            },
            "cloneGroupById": function () {
                //using selected_group_id, query the server for the full functional group info, then clone that via a save
                this.getFunctionalGroupInfo(this.selected_group_id, (err, response) => {
                    if (response) {
                        response.json().then(json => {
                            const fg = json.groups[0];
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
                this.httpRequest("get", "groups?id=" + id, null, cb);
            },
            "saveFunctionalGroupInfo": function (functionalGroup, cb) {
                this.httpRequest("post", "groups", functionalGroup, cb);
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
            this.$refs.functionalGroupModal.onAfterLeave();
        }
    }
</script>