<template>
    <tr>
        <td>
            <label class="switch">
                <input v-on:click="toggleAppServicePermission" type="checkbox" :checked="item.is_selected"></input>
                <span class="slider round"></span>
            </label>
            <label class="form-check-label switch-label">
              {{ item.name }}
            </label>
        </td>
    </tr>
</template>

<script>
    export default {
        props: ['item', 'app_id', 'service_type_name'],
        data () {
            return {
            }
        },
        methods: {
            "toggleAppServicePermission": function(){
                this.item.is_selected = !this.item.is_selected;

                this.httpRequest("put", "applications/service/permission", {
                    "body": {
                        "id": this.app_id,
                        "is_selected": this.item.is_selected,
                        "service_type_name": this.service_type_name,
                        "permission_name": this.item.name
                    }
                }, (err, response) => {
                    if(err){
                        // error
                        console.log("Error saving app service permission state");
                        this.item.is_selected = !this.item.is_selected;
                    }else{
                        // success
                        console.log("App service permission state saved");
                    }
                });
            }
        }
    }
</script>