<template>
    <nav class="navbar navbar-expand-md navbar-dark fixed-top header-bg">
        <router-link to="/" class="navbar-brand col-sm-3 col-md-2">
            <img src="~@/assets/images/sdl_ps_logo@2x.png" class="nav-sdl-logo"/>
        </router-link>
        <button class="navbar-toggler d-lg-none" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarsExampleDefault">
            <ul class="navbar-nav mr-auto">
                <!--
                <li class="nav-item active">
                    <a class="nav-link" href="#">Applications/</a>
                </li>
                -->
            </ul>
            <button v-if="is_logged_in" type="button" v-on:click="openUserNav" class="btn btn-link hover-color-green">
                <i class="fa fa-fw fa-user-o color-white"></i>
            </button>
        </div>
    </nav>
</template>

<script>
    import { eventBus } from '../../main.js';
    export default {
        data: function(){
            return {
                "is_logged_in": this.$session.exists()
            };
        },
        methods: {
            "openUserNav": function(){
                eventBus.$emit("openUserNav");
            }
        },
        watch: {
            "$route": function(to, from){
                this.is_logged_in = this.$session.exists();
            }
        }
    }
</script>