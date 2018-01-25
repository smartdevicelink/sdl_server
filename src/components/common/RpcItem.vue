<template>
    <div class="white-box rpc-container">
        <h5>{{ item.name }}
            <i
                v-on:click="removeRpc()"
                v-if="!fieldsDisabled"
                class="pointer pull-right fa fa-times hover-color-red"
                aria-hidden="true">
            </i>
        </h5>
        <div class="white-box d-flex padding-0">
            <rpc-checklist
            v-bind:type="'parameter'"
            v-bind:header="'parameters'"
            v-bind:options="parameters"
            v-bind:status="status"
            v-bind:fieldsDisabled="fieldsDisabled"
            v-bind:rpcIndex="index"
            />
            <hmi-selector
                v-bind:type="'hmi'"
                v-bind:header="'Supported HMI Levels'"
                v-bind:status="status"
                v-bind:options="hmi_levels"
                v-bind:fieldsDisabled="fieldsDisabled"
                v-bind:rpcIndex="index"
            />
        </div>
    </div>
</template>

<script>
    export default {
        props: ['item','index','status','fieldsDisabled'],
        data () {
            return {
            };
        },
        methods: {
            "removeRpc": function(){
                this.item.selected = false;
            }
        },
        computed: {
            parameters: function(){
                return Object.keys(this.item.parameters).map((key, index)=>{
                    return {
                        "text": this.item.parameters[index].name,
                        "value": index,
                        "selected": this.item.parameters[index].selected
                    };
                });
            },
            hmi_levels: function(){
                return Object.keys(this.item.hmi_levels).map((key, index)=>{
                    return {
                        "text": this.item.hmi_levels[index].name,
                        "value": index,
                        "selected": this.item.hmi_levels[index].selected
                    };
                });
            }
        }
    }
</script>