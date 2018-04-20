<template>
    <div id="user-sidebar" class="user-sidebar" v-bind:style="style">
        <div class="user-sidebar-close">
            <a v-on:click="closeUserNav" class="color-white">
                <i class="fa fa-fw fa-1-5x fa-times hover-color-green"></i>
            </a>
        </div>
        <!--
        <div class="user-sidebar-header">
            <h5>{{ email }}</h5>
            <router-link to="/user" class="color-white">
                <i class="fa fa-fw fa-1-5x fa-gear hover-color-green hover-spin"></i>
            </router-link>
        </div>
        -->
        <div>
            <b-btn v-on:click="logout" class="btn btn-card btn-user-sidebar btn-style-green">Logout</b-btn>
            <!--<router-link to="/invite" class="btn btn-card btn-user-sidebar btn-style-white">Invite Members</router-link>-->
        </div>
    </div>
</template>

<script>
    import { eventBus } from '../../main.js';
    export default {
        data () {
            return {
                "email": "support@smartdevicelink.com",
                "style": {
                    "display": "none"
                }
            }
        },
        methods: {
            "closeUserNav": function(){
                this.style = {
                    "display": "none"
                };
            },
            "logout": function(){
                eventBus.$emit("logout");
            }
        },
        created () {
            eventBus.$on("openUserNav", ()=> {
                this.style = {
                    "display": "block"
                };
            });
        }
    }
</script>