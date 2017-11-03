<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <div class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content">
                <div class="pull-right">
                    <template v-if="intent == 'edit'">
                        <b-btn class="btn btn-dark btn-sm align-middle d-none">Revert Version</b-btn>
                        <b-btn v-if="fg.status != 'PRODUCTION'" class="btn btn-style-green btn-sm align-middle">Move to Production</b-btn>
                        <b-btn v-b-modal.copyModal class="btn btn-dark btn-sm align-middle">Copy as Template</b-btn>
                        <b-btn v-b-modal.deleteModal class="btn btn-danger btn-sm align-middle">Delete</b-btn>
                    </template>
                </div>

                <div class="functional-content">
                    <h4>Functional Group</h4>

                    <div class="form-row">
                        <h4 for="name">Name</h4>
                        <input v-model="fg.name" :disabled="fg.status == 'PRODUCTION'" type="email" class="form-control" id="email" required>
                    </div>

                    <div class="form-row">
                        <h4 for="description">Description</h4>
                        <textarea v-model="fg.description" :disabled="fg.status == 'PRODUCTION'" type="text" rows="2" class="form-control" id="description"></textarea>
                    </div>

                    <div class="form-row">
                        <h4 for="consent-prompt">User Consent Prompt</h4>
                        <b-form-select
                            v-model="fg.selected_prompt_id"
                            :disabled="fg.status == 'PRODUCTION'"
                            class="custom-select w-100">
                            <option value="null">Select an optional Consent Prompt...</option>
                            <option
                                v-for="(item, index) in consent_prompts"
                                v-bind:value="item.id">
                                {{ item.name }}
                            </option>
                        </b-form-select>
                        <div v-if="consent_prompts[selected_prompt_index]" class="white-box">
                            {{ consent_prompts[selected_prompt_index] ? consent_prompts[selected_prompt_index].prompt : '' }}
                        </div>
                    </div>

                    <!-- TODO: create container for RPCs -->
                    <div class="form-row">
                        <h4 for="rpcs">RPCs</h4>
                        <div class="rpcs">
                            <rpc-item
                                v-for="(item, index) in fg.rpcs"
                                v-if="item.selected"
                                v-bind:status="fg.status"
                                v-bind:item="item"
                                v-bind:index="index"
                                v-bind:key="index">
                            </rpc-item>

                            <div v-if="fg.status != 'PRODUCTION'" v-b-modal.addRpcModal id="add" class="another-rpc pointer">
                                <i class="fa fa-plus middle-middle"></i>
                            </div>
                        </div>
                    </div>

                    <div>
                        <vue-ladda
                            v-if="fg.status != 'PRODUCTION'"
                            type="submit"
                            class="btn btn-card btn-style-green"
                            data-style="zoom-in"
                            v-on:click="saveGroup()"
                            v-bind:loading="save_button_loading">
                            Save
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
                        {{ item.name }}<i v-b-tooltip.hover.auto title="" class="fa fa-info-circle pull-right"></i>
                        </li>
                    </ul>
                </b-modal>

                <!-- DELETE GROUP MODAL -->
                <b-modal ref="deleteModal" title="Delete Functional Group" hide-footer id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
                    <small class="form-text text-muted">
                        Deleting a functional group is irreversible. You can create functional groups from templates, but any changes you've made to this current version will be lost. To continue, press "Delete," otherwise, click the x.
                    </small>
                    <vue-ladda
                        type="button"
                        class="btn btn-card btn-danger"
                        data-style="zoom-in"
                        v-on:click="deleteGroup()"
                        v-bind:loading="delete_button_loading">
                        Delete
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

            </div>
        </div>
    </div>
</template>

<script>
import { eventBus } from '../main.js';
export default {
    props: ['id','intent'],
    data: function(){
        return {
            "fg": {
                "id": null,
                "name": null,
                "description": null,
                "status": "STAGING",
                "selected_prompt_id": "null",
                "rpcs": [
                ]
            },
            "rpc_search": null,
            "delete_button_loading": false,
            "copy_button_loading": false,
            "save_button_loading": false
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
        "deleteGroup": function(){
            // TODO
            this.delete_button_loading = true;
            setTimeout(()=>{
                this.delete_button_loading = false;
                this.$refs.deleteModal.hide();
                this.$router.push("/functionalgroups");
            }, 1000);
            console.log("Delete pressed");
        },
        "saveGroup": function(){
            console.log(this.fg);
            // TODO
            this.save_button_loading = true;
            setTimeout(()=>{
                this.save_button_loading = false;
                this.$router.push("/functionalgroups");
            }, 1000);
            console.log("Save pressed");
        },
        "copyGroup": function(){
            console.log(this.fg);
            // TODO
            this.copy_button_loading = true;
            setTimeout(()=>{
                this.copy_button_loading = false;
                this.$refs.copyModal.hide();
            }, 1000);
            console.log("Copy pressed");
        }
    },
    computed: {
        selected_prompt_index: function(){
            var index = null;
            for(var i in this.consent_prompts){
                if(this.consent_prompts[i].id == this.fg.selected_prompt_id){
                    index = i;
                    break;
                }
            }
            return index;
        }
    },
    created: function(){
        // listen for checkbox changes in RPC components
        eventBus.$on("rpcCheckboxChecked", (rpc_index, item_index, item_type, is_checked)=> {
            console.log({
                rpc_index,
                item_index,
                item_type,
                is_checked
            });
            if(item_type == "parameter"){
                this.fg.rpcs[rpc_index].parameters[item_index].selected = is_checked;
            }else if(item_type == "hmi"){
                this.fg.rpcs[rpc_index].hmi_levels[item_index].selected = is_checked;
            }
        });

        // TODO: get consent prompts
        this.consent_prompts = [
            {
                "id": 1,
                "name": "waffles",
                "prompt": "i like waffles"
            },
            {
                "id": 2,
                "name": "pancakes",
                "prompt": "i like pancakes too"
            },
            {
                "id": 3,
                "name": "bacon",
                "prompt": "%appName% is requesting the use of the following vehicle information and permissions: %functionalGroupLabels%. If you press Yes, you agree that %vehicleMake% will not be liable for any damages or loss of privacy related to %appName%''s use of your data. Please press Yes to allow or No to deny."
            }
        ];

        // TODO: fetch the desired functional group
        if(this.id){
            setTimeout(()=>{
                this.fg = {
                    "id": 1,
                    "name": "MyFunctionalGroupName",
                    "description": "An awesome functional group that does stuff.",
                    "status": "STAGING",
                    "selected_prompt_id": 1,
                    "rpcs": [
                        {
                            "name": "GetVehicleData",
                            "parameters": [
                                {
                                    "id": 1,
                                    "key": "rpm",
                                    "name": "RPMs",
                                    "selected": true,
                                },
                                {
                                    "id": 2,
                                    "key": "speed",
                                    "name": "Speed"
                                },
                                {
                                    "id": 3,
                                    "key": "prndl",
                                    "name": "Transmission Gear (PRNDL)",
                                    "selected": true
                                },
                                {
                                    "id": 4,
                                    "key": "beltStatus",
                                    "name": "Seatbelt Status"
                                },
                                {
                                    "id": 5,
                                    "key": "airbagStatus",
                                    "name": "Airbag Status"
                                },
                                {
                                    "id": 6,
                                    "key": "fuelLevel",
                                    "name": "Fuel Level"
                                }
                            ],
                            "hmi_levels": [
                                {
                                    "name": "HMI_FULL",
                                    "value": "HMI_FULL",
                                    "selected": true
                                },
                                {
                                    "name": "HMI_LIMITED",
                                    "value": "HMI_LIMITED"
                                },
                                {
                                    "name": "HMI_BACKGROUND",
                                    "value": "HMI_BACKGROUND",
                                    "selected": true
                                },
                                {
                                    "name": "HMI_NONE",
                                    "value": "HMI_NONE"
                                }
                            ],
                            "selected": true
                        },
                        {
                            "name": "SubscribeVehicleData",
                            "parameters": [
                                {
                                    "id": 1,
                                    "key": "rpm",
                                    "name": "RPMs",
                                    "selected": true,
                                },
                                {
                                    "id": 2,
                                    "key": "speed",
                                    "name": "Speed"
                                },
                                {
                                    "id": 3,
                                    "key": "prndl",
                                    "name": "Transmission Gear (PRNDL)",
                                    "selected": true
                                },
                                {
                                    "id": 4,
                                    "key": "beltStatus",
                                    "name": "Seatbelt Status"
                                },
                                {
                                    "id": 5,
                                    "key": "airbagStatus",
                                    "name": "Airbag Status"
                                },
                                {
                                    "id": 6,
                                    "key": "fuelLevel",
                                    "name": "Fuel Level"
                                }
                            ],
                            "hmi_levels": [
                                {
                                    "name": "HMI_FULL",
                                    "value": "HMI_FULL",
                                    "selected": true
                                },
                                {
                                    "name": "HMI_LIMITED",
                                    "value": "HMI_LIMITED"
                                },
                                {
                                    "name": "HMI_BACKGROUND",
                                    "value": "HMI_BACKGROUND",
                                    "selected": true
                                },
                                {
                                    "name": "HMI_NONE",
                                    "value": "HMI_NONE"
                                }
                            ],
                            "selected": false
                        },
                        {
                            "name": "OnVehicleData",
                            "parameters": [
                                {
                                    "id": 1,
                                    "key": "rpm",
                                    "name": "RPMs",
                                    "selected": true,
                                },
                                {
                                    "id": 2,
                                    "key": "speed",
                                    "name": "Speed"
                                },
                                {
                                    "id": 3,
                                    "key": "prndl",
                                    "name": "Transmission Gear (PRNDL)",
                                    "selected": true
                                },
                                {
                                    "id": 4,
                                    "key": "beltStatus",
                                    "name": "Seatbelt Status"
                                },
                                {
                                    "id": 5,
                                    "key": "airbagStatus",
                                    "name": "Airbag Status"
                                },
                                {
                                    "id": 6,
                                    "key": "fuelLevel",
                                    "name": "Fuel Level"
                                }
                            ],
                            "hmi_levels": [
                                {
                                    "name": "HMI_FULL",
                                    "value": "HMI_FULL",
                                    "selected": true
                                },
                                {
                                    "name": "HMI_LIMITED",
                                    "value": "HMI_LIMITED"
                                },
                                {
                                    "name": "HMI_BACKGROUND",
                                    "value": "HMI_BACKGROUND",
                                    "selected": true
                                },
                                {
                                    "name": "HMI_NONE",
                                    "value": "HMI_NONE"
                                }
                            ],
                            "selected": false
                        }
                    ]
                };
            },700);
        }
    },
    mounted: function(){
        //this.$methods.addInvitee();
    }
}
</script>