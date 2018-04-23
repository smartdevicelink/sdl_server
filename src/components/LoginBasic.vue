<template>
    <div class="container-fluid content color-bg-gray">
        <div class="row">
            <div class="card">
                <div class="auth-content">
                    <div class="form-group card-link">
                        Enter the password to continue:
                    </div>
                    <div class="login">
                        <form v-on:submit.prevent="loginClick">
                            <div class="form-group">
                                <input v-model="password_input" type="password" class="" id="password" placeholder="Password" required>
                            </div>
                            <b-btn type="submit" class="btn btn-card btn-style-green">Authorize</b-btn>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ["redirect","password"],
    data: function(){
        return {
            "password_input": this.password
        };
    },
    methods: {
        "loginClick": function(){
            this.httpRequest("post", "login", {
                "body": {
                    "password": this.password_input
                },
                "preventAuthRedirect": true
            }, (err, response) => {
                if (err) {
                    alert("Sorry, that password is incorrect.");
                    this.password_input = "";
                } else {
                    this.$session.start();
                    this.$session.set("BASIC_AUTH_PASSWORD", this.password_input);
                    this.$router.push(this.redirect || "applications");
                }
            });

        }
    }
}
</script>