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
                <div class="alert color-bg-red color-white d-table" role="alert">
                    ** Notice: There are <b>{{ unused_count.rpcs }} RPCs</b> and <b>{{ unused_count.parameters }} parameters</b> not currently being used in a functional group.
                </div>
                <h4>Functional Groups</h4>
                <section class="tiles">
                    <functional-group-item
                        v-for="(item, index) in functional_groups"
                        v-bind:item="item"
                        v-bind:index="index"
                        v-bind:key="item.id"
                        >
                    </functional-group-item>
                    <a v-if="environment == 'staging'" v-b-modal.functionalGroupModal class="tile-plus">
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
                    <router-link v-bind:to="{ path: 'functionalgroups/manage', query: { id: selected_group_id, intent: 'create' } }">
                        <b-btn v-bind:disabled="is_clone_disabled" type="button" aria-describedby="copyHelp" class="btn btn-card btn-style-green">Create New Functional Group Based on Existing Group</b-btn>
                    </router-link>
                </b-modal>

            </main>
        </div>
    </div>
</template>

<script>
    export default {
        data () {
            return {
                "environment": "staging",
                "environmentOptions": [
                    {
                        "text": "Staging",
                        "value": "staging"
                    },
                    {
                        "text": "Production",
                        "value": "production"
                    }
                ],
                "selected_group_id": null,
                "is_clone_disabled": true,
                "unused_count": {
                    "rpcs": 2,
                    "parameters": 12
                },
                "functional_groups": []
            }
        },
        methods: {
            "environmentClick": function(){
                this.functional_groups = [];
                console.log("Selected environment: " + this.environment);
                // TODO: get functional groups
                setTimeout(()=>{
                    this.functional_groups = [
                        {
                            "id": 1,
                            "name": "drivingCharacteristics-3",
                            "description": "This functional group does some stuff and then also does some things. They’re both important. Yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda.",
                            "permission_count": 4
                        },
                        {
                            "id": 2,
                            "name": "drivingCharacteristics-3",
                            "description": "This functional group does some stuff.",
                            "permission_count": 4
                        },
                        {
                            "id": 3,
                            "name": "drivingCharacteristics-3",
                            "description": "This functional group does some stuff and then also does some things. They’re both important. Yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda.",
                            "permission_count": 4
                        },
                        {
                            "id": 4,
                            "name": "drivingCharacteristics-3",
                            "description": "This functional group does some stuff and then also does some things. They’re both important. Yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda.",
                            "permission_count": 4
                        },
                        {
                            "id": 5,
                            "name": "drivingCharacteristics-3",
                            "description": "This functional group does some stuff and then also does some things. They’re both important. Yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda.",
                            "permission_count": 4
                        },
                        {
                            "id": 5,
                            "name": "drivingCharacteristics-3",
                            "description": "This functional group does some stuff and then also does some things. They’re both important. Yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda.",
                            "permission_count": 4
                        },
                        {
                            "id": 5,
                            "name": "drivingCharacteristics-3",
                            "description": "This functional group does some stuff and then also does some things. They’re both important. Yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda yadda.",
                            "permission_count": 4
                        }
                    ];
                }, 300);
            },
            "selectedFunctionalGroup": function(){
                this.is_clone_disabled = this.selected_group_id != "null" ? false : true;
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