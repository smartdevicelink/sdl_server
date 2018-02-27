<template>
    <div class="container-fluid content color-bg-gray">
        <div class="row">
            <div class="card">
                <div class="auth-content">
                    <div class="form-group card-link">
                        <router-link to="/login" class="active">Sign In</router-link>
                        <span class="card-link-spacer">/</span>
                        <router-link to="/register">Register</router-link>
                    </div>
                    <div class="login">
                        <form v-on:submit.prevent="loginClick">
                            <div class="form-group">
                                <input v-model="email_input" type="email" class="" id="email" placeholder="Email" required>
                            </div>
                            <div class="form-group">
                                <input v-model="password_input" type="password" class="" id="password" placeholder="Password" required>
                            </div>
                            <b-btn type="submit" class="btn btn-card btn-style-green">Sign In</b-btn>
                        </form>
                        <router-link to="/forgot">
                            <button type="button" class="btn btn-card btn-style-white">Forgot Password?</button>
                        </router-link>
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
            "email_input": this.email,
            "password_input": this.password
        };
    },
    methods: {
        "loginClick": function(){
            // TODO: check the user's auth information and log them in
            console.log("Validate login: " + this.email_input + " using " + this.password_input);
            this.$session.start();
            this.$router.push("applications");
        }
    }
}
</script>