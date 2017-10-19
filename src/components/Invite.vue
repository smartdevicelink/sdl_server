<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <div class="col-sm-9 ml-sm-auto col-md-10 pt-3 card card-settings card-align-top">
                <div class="settings-content">
                    <div class="settings-content">
                        <h4>Invite Members</h4>

                        <form id="inviteForm" v-on:submit.prevent="inviteClick">

                            <invitee
                                v-for="(item, index) in invitees"
                                v-bind:item="item"
                                v-bind:index="index"
                                v-bind:key="index">
                            </invitee>


                            <div v-on:click="addInvitee" id="addMember" class="another-member pointer">
                                <span>Add another member</span>
                                <i class="fa fa-plus"></i>
                            </div>

                            <div class="form-row">
                                <label for="message" class="col-form-label">Custom Message</label>
                                <textarea type="text" rows="5" class="form-control" id="message"></textarea>
                            </div>

                            <div>
                                <vue-ladda
                                    type="submit"
                                    class="btn btn-card btn-style-green"
                                    data-style="zoom-in"
                                    v-bind:loading="button_loading">
                                    Send Invitation(s)
                                </vue-ladda>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { eventBus } from '../main.js';
export default {
    data: function(){
        return {
            "button_loading": false,
            "invitees": [{
                "first_name": null,
                "last_name": null,
                "email": null
            }]
        };
    },
    methods: {
        "addInvitee": function(){
            this.invitees.push({
                "first_name": null,
                "last_name": null,
                "email": null
            });
        },
        "inviteClick": function(){
            // TODO: send the invites
            this.button_loading = true;
            setTimeout(() => {
                alert(JSON.stringify(this.invitees, null, "\t"));
                this.button_loading = false;
            }, 2000);
        }
    },
    created: function(){
        eventBus.$on("removeInvitee", (index)=> {
            this.invitees.splice(index, 1);
        });
    },
    mounted: function(){
        //this.$methods.addInvitee();
    }
}
</script>