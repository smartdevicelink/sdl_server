<template>
    <div class="white-box rpc-container">
        <h5>{{ item.name }}<i v-on:click="removeRpc()" class="pointer pull-right fa fa-times" aria-hidden="true"></i></h5>
        <div class="white-box d-flex padding-0">
            <rpc-checklist
            v-bind:header="'parameters'"
            v-bind:options="options"
            v-bind:selected="item.selected_parameters"
            />
            <rpc-checklist
                v-bind:header="'Supported HMI Levels'"
                v-bind:options="hmi_levels"
                v-bind:selected="item.selected_hmi_levels"
            />
        </div>
    </div>
</template>

<script>
    export default {
        props: ['item'],
        data () {
            return {
                "hmi_levels": [
                    {
                        "text": "HMI_FULL",
                        "value": "HMI_FULL"
                    },
                    {
                        "text": "HMI_LIMITED",
                        "value": "HMI_LIMITED"
                    },
                    {
                        "text": "HMI_BACKGROUND",
                        "value": "HMI_BACKGROUND"
                    },
                    {
                        "text": "HMI_NONE",
                        "value": "HMI_NONE"
                    }
                ]
            };
        },
        methods: {
            "removeRpc": function(){
                this.item.selected = false;
            }
        },
        computed: {
            options: function(){
                return Object.keys(this.item.parameters).map((key, index)=>{
                    return {
                        "text": this.item.parameters[index].name,
                        "value": this.item.parameters[index].id
                    };
                });
            }
        }
    }
</script>