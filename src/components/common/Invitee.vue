<template>
    <div id="member1" class="member-details">
        <div class="member-details-title">
            <h5 class="add-member-counter">Member {{ index+1 }}</h5>
            <i class="fa fa-minus pointer hover-color-red"></i>
        </div>
        <div class="form-row">
            <div class="form-group col-md-6">
                <label for="firstName" class="col-form-label">First Name</label>
                <input v-model="item.first_name" type="text" class="form-control" id="firstName">
            </div>
            <div class="form-group col-md-6">
                <label for="lastName" class="col-form-label">Last Name</label>
                <input v-model="item.last_name" type="text" class="form-control" id="lastName">
            </div>
        </div>
        <div class="form-row">
            <label for="email" class="col-form-label">Email*</label>
            <input v-model="item.email" type="text" class="form-control" id="email">
        </div>
    </div>
</template>

<script>
    export default {
        props: ['item','index'],
        data () {
            return {
                "item": this.item,
                "index": this.index,
                "actions_visible": false
            }
        },
        methods: {
            "toggleActions": function(){
                this.actions_visible = !this.actions_visible;
            },
            "actionClick": function(){
                // TODO: mark app as approved or denied and set updated item data attributes
                alert("Action click on an item of status: " + this.item.status);
            }
        },
        computed: {
            classStatusDot: function(){
                return {
                    "color-red": this.item.status == "denied",
                    "color-green": this.item.status == "approved"
                }
            },
            classActionButton: function(){
                return {
                    "btn-danger": this.item.status == 'approved' ? true : false,
                    "btn-success": this.item.status == 'denied' ? true : false
                }
            },
            actionText: function(){
                return this.item.status == 'approved' ? 'Deny' : 'Approve';
            }
        }
    }
</script>