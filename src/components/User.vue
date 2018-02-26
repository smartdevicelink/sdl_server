<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <div class="col-sm-9 ml-sm-auto col-md-10 pt-3 card card-settings card-align-top">
                <div class="settings-content">
                    <form v-on:submit.prevent="saveClick">
                        <h4>User Profile</h4>

                        <h5>Personal Info</h5>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="firstName" class="col-form-label">First Name</label>
                                <input v-model="user.first_name" type="text" class="form-control" id="firstName">
                            </div>
                            <div class="form-group col-md-6">
                                <label for="lastName" class="col-form-label">Last Name</label>
                                <input v-model="user.last_name" type="text" class="form-control" id="lastName">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="email" class="col-form-label">Email*</label>
                                <input v-model="user.email" type="email" class="form-control" id="email" required>
                            </div>
                        </div>


                        <h5>Change Password</h5>
                        <div class="form-group">
                            <label for="password" class="col-form-label">Current Password</label>
                            <input v-model="user.password" type="password" class="form-control" id="password">
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="newPassword" class="col-form-label">New Password</label>
                                <input v-model="user.new_password_1" type="password" class="form-control" id="newPassword" aria-describedby="passwordHelpBlock" pattern=".{6,}">
                                <small id="passwordHelpBlock" class="form-text text-muted">
                                    Must be at least 6 characters
                                </small>
                            </div>
                            <div class="form-group col-md-6">
                                <label for="retypePassword" class="col-form-label">Re-type Password</label>
                                <input v-model="user.new_password_2" type="password" class="form-control" id="retypePassword">
                            </div>
                        </div>

                        <vue-ladda
                            type="submit"
                            class="btn btn-card btn-style-green"
                            data-style="zoom-in"
                            v-bind:loading="button_loading">
                            Save
                        </vue-ladda>

                    </form>
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
                "first_name": "Roger",
                "last_name": "Humaan",
                "email": "support@smartdevicelink.com",
                "password": null,
                "new_password_1": null,
                "new_password_2": null
            },
            "button_loading": false
        };
    },
    methods: {
        "saveClick": function(){
            // TODO: submit the user's updated account information
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
    }
}
</script>