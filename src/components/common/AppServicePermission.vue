<template>
    <tr>
        <td>
            <label class="switch">
                <input v-on:click="toggleAppServicePermission" type="checkbox" :checked="item.is_selected" :disabled="disableEditing == 1"></input>
                <span class="slider round" :class="{ disabled: disableEditing }"></span>
            </label>
            <label class="form-check-label switch-label">
              {{ item.name }}
            </label>
        </td>
    </tr>
</template>

<script>
    export default {
        props: ['item', 'approval_status', 'app_id', 'service_type_name', 'updatePolicyTablesHandler'],
        data () {
            return {
            }
        },
        methods: {
            "toggleAppServicePermission": function(){
                this.httpRequest("put", "applications/service/permission", {
                    "body": {
                        "id": this.app_id,
                        "is_selected": !this.item.is_selected,
                        "service_type_name": this.service_type_name,
                        "permission_name": this.item.name
                    }
                }, (err, response) => {
                    if(err){
                        // error
                        console.log("Error saving app service permission state");
                    }else{
                        // success
                        console.log("App service permission state saved");
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