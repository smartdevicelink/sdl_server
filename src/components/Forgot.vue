<template>
    <div class="container-fluid content color-bg-gray">
        <div class="row">
            <div class="card">
                <div class="auth-content">
                    <div class="form-group card-link">
                        <router-link to="/login">Sign In</router-link>
                        <span class="card-link-spacer">/</span>
                        <router-link to="/forgot" class="active">Forgot Password</router-link>
                    </div>
                    <div class="forgot-password">
                        <form id="forgotPasswordForm" v-on:submit.prevent="forgotClick">
                            <div class="form-group">
                                <input v-model="email" type="email" id="email" placeholder="Email" required>
                            </div>
                            <vue-ladda
                                type="submit"
                                class="btn btn-card btn-style-green"
                                data-style="zoom-in"
                                v-bind:loading="button_loading">
                                Request a New Password
                            </vue-ladda>
                        </form>
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
            "email": null,
            "button_loading": false
        };
    },
    methods: {
        "forgotClick": function(){
            // TODO: submit the forgot password request
            this.button_loading = true;
            setTimeout(() => {
                this.button_loading = false;
            }, 2000);
        }
    }
}
</script>