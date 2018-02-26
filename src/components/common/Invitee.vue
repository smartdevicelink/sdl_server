<template>
    <div id="member1" class="member-details">
        <div class="member-details-title">
            <h5 class="add-member-counter">Member {{ index+1 }}</h5>
            <i v-on:click="removeInvitee" class="fa fa-minus pointer hover-color-red"></i>
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
            <input v-model="item.email" type="email" class="form-control" id="email" required>
        </div>
    </div>
</template>

<script>
    import { eventBus } from '../../main.js';
    export default {
        props: ['item','index'],
        data () {
            return {
            }
        },
        methods: {
            "removeInvitee": function(){
                eventBus.$emit("removeInvitee", this.index);
            }
        }
    }
</script>