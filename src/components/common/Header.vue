<template>
    <nav class="navbar navbar-expand-md navbar-dark fixed-top header-bg">
        <router-link to="/" class="navbar-brand col-sm-3 col-md-2">
            <img src="~@/assets/images/sdl_ps_logo@2x.png" class="nav-sdl-logo"/>
        </router-link>
        <!--b-button v-b-toggle.collapse>
            <span class="navbar-toggler-icon"></span>
        </b-button>
        <div class="collapse navbar-collapse" id="navbarExampleDefault">
        <b-collapse id="collapse">
            <ul>
                <li>Applications</li>
            </ul>
        </b-collapse>
        </div-->
        <button v-if="is_logged_in" type="button" v-on:click="openUserNav" class="btn btn-link hover-color-green user-nav">
            <i class="fa fa-fw fa-user-o color-white"></i>
        </button>
        <!--button type="button" v-on:click="openMobileNav" class="navbar-toggler" data-toggle="collapse" >
            <i class="fa fa-fw fa-user-o color-white"></i>
        </button-->
        <button class="navbar-toggler d-lg-none" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation" v-on:click="isHidden=!isHidden">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="navbar-collapse d-lg-none d-xl-block" data-toggle="collapse" v-if="!isHidden && (innerWidth < 768)" id="navbarsExampleDefault">
            <ul class="nav nav-pills flex-column d-md-none">
                
                <router-link tag="li" class="d-md-none" to="/applications">
                    <a class="nav-link">Applications</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/policytable">
                    <a class="nav-link" href="/">View Policy Table</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/functionalgroups">
                    <a class="nav-link" href="/">Functional Groups</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/consumermessages">
                    <a class="nav-link" href="/">Consumer Messages</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/vehicledata">
                    <a class="nav-link" href="/">Custom Vehicle Data</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/moduleconfig">
                    <a class="nav-link" href="/">Module Config</a>
                </router-link>
                <router-link tag="li" class="d-md-none" to="/about">
                    <a class="nav-link" href="/">About</a>
                </router-link>
                
            </ul>
        </div>
    </nav>
</template>

<script>
    import { eventBus } from '../../main.js';
    export default {
        data: function(){
            return {
                "is_logged_in": this.$session.exists(),
                "isHidden": true,
                "innerWidth": window.innerWidth
            };
        },
        methods: {
            "openUserNav": function(){
                eventBus.$emit("openUserNav");
            },
            "isNavHidden": function () {
                console.log(window.innerWidth);
                return true;
            },
            "onResize": function () {
                this.innerWidth = window.innerWidth
            }
        },
        watch: {
            "$route": function(to, from){
                this.is_logged_in = this.$session.exists();
            },

            "windowHeight": function (newHeight, oldHeight) {
                this.txt = `it changed to ${newHeight} from ${oldHeight}`;
            }
        },

        mounted() {
            this.$nextTick(() => {
                window.addEventListener('resize', this.onResize);
            })
        },
        beforeDestroy() { 
            window.removeEventListener('resize', this.onResize); 
        },
    }
</script>