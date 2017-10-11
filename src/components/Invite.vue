<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <div class="col-sm-9 ml-sm-auto col-md-10 pt-3 card card-settings card-align-top">
                <div class="settings-content">
                    <div class="settings-content">
                        <h4>Invite Members</h4>

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
                            <button type="submit" class="btn btn-card btn-style-green">Send Invitation</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data: function(){
        return {
            "user": {
                "first_name": "Nick",
                "last_name": "Schwab",
                "email": "nick.schwab@livio.io",
                "password": null,
                "new_password_1": null,
                "new_password_2": null
            },
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
        "saveClick": function(){
            // TODO: submit the forgot password request
            if(this.user.new_password_1 != this.user.new_password_2){
                // new password must match
                return alert("Your new password and re-typed password must match");
            }
            this.button_loading = true;
            setTimeout(() => {
                alert(JSON.stringify(this.user, null, "\t"));
                this.button_loading = false;
            }, 2000);
        }
    },
    created: function(){
    },
    mounted: function(){
        //this.$methods.addInvitee();
    }
}
</script>