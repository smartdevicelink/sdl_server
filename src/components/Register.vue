<template>
    <div class="container-fluid content color-bg-gray">
        <div class="row">
            <div class="card">
                <div class="auth-content">
                    <div class="form-group card-link">
                        <router-link to="/login">Sign In</router-link>
                        <span class="card-link-spacer">/</span>
                        <router-link to="/register" class="active">Register</router-link>
                    </div>
                    <div class="register">
                        <form v-on:submit.prevent="registerClick">
                            <div class="form-group">
                                <input v-model="email" type="email" class="" id="email" placeholder="Email" required>
                            </div>
                            <div class="form-group">
                                <input v-model="password" type="password" class="" id="temporaryPassword" placeholder="Temporary Password" required>
                                <small id="passwordHelpBlock" class="form-text text-muted">
                                    Check your email
                                </small>
                            </div>
                            <div class="form-group">
                                <input v-model="new_password_1" type="password" class="" id="setPassword" placeholder="Create New Password" aria-describedby="passwordHelpBlock" pattern=".{6,}" required>
                                <small id="passwordHelpBlock" class="form-text text-muted">
                                    Must be at least 6 characters
                                </small>
                            </div>
                            <div class="form-group">
                                <input v-model="new_password_2" type="password" class="" id="retypePassword" placeholder="Re-type Password" pattern=".{6,}" required>
                            </div>
                            <button type="submit" class="btn btn-card btn-style-green">Register</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ["email", "password"],
    data: function(){
        return {
            "email": null,
            "password": null,
            "new_password_1": null,
            "new_password_2": null
        };
    },
    methods: {
        "registerClick": function(){
            // TODO: check the user's auth information and register them
            if(!this.newPassword2 || !this.newPassword1 || this.newPassword1 != this.newPassword2){
                // new password must match
                return alert("Your new password and re-typed password must match");
            }
            console.log("Validate registration: " + this.email + " using " + this.password);
            this.$router.push("applications");
        }
    }
}
</script>