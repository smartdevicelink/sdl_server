<template>
    <tr>
        <td>
            <label class="switch">
                <input v-on:click="toggleAppFunctionalGroup" type="checkbox" :checked="item.is_selected" :disabled="disableEditing == 1"></input>
                <span class="slider round" :class="{ disabled: disableEditing }"></span>
            </label>
            <label class="form-check-label switch-label">
              {{ item.property_name }}<a class="fa fa-info-circle color-primary doc-link" :href="'/functionalgroups/manage?id='+item.id+'&environment='+item.status"></a>
            </label>
        </td>
    </tr>
</template>

<script>
    export default {
        props: ['item', 'approval_status', 'app_id', 'updatePolicyTablesHandler'],
        data () {
            return {
            }
        },
        methods: {
            "toggleAppFunctionalGroup": function(){
                this.httpRequest("put", "applications/groups", {
                    "body": {
                        "app_id": this.app_id,
                        "is_selected": !this.item.is_selected,
                        "property_name": this.item.property_name
                    }
                }, (err, response) => {
                    if(err){
                        // error
                        console.log("Error saving app functional group state");
                    }else{
                        // success
                        console.log("App functional group state saved");
                        this.item.is_selected = !this.item.is_selected;
                        //update the policy tables
                        this.updatePolicyTablesHandler(false, "policytableStaging");
                        this.updatePolicyTablesHandler(true, "policytableProduction");
                    }
                });
            }
        },
        computed: {
            disableEditing: function(){
                return ["ACCEPTED"].indexOf(this.approval_status) >= 0;
            }
        }
    }
</script>