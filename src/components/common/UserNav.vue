<template>
    <div id="user-sidebar" class="user-sidebar" v-bind:style="style">
        <div class="user-sidebar-close">
            <a v-on:click="closeUserNav" class="color-white">
                <i class="fa fa-fw fa-1-5x fa-times hover-color-green"></i>
            </a>
        </div>
        <div class="user-sidebar-header">
            <h5>{{ email }}</h5>
            <router-link to="/user" class="color-white">
                <i class="fa fa-fw fa-1-5x fa-gear hover-color-green hover-spin"></i>
            </router-link>
        </div>
        <div>
            <router-link to="/login" class="btn btn-card btn-user-sidebar btn-style-green">Logout</router-link>
            <router-link to="/invite" class="btn btn-card btn-user-sidebar btn-style-white">Invite Members</router-link>
        </div>
    </div>
</template>

<script>
    import { eventBus } from '../../main.js';
    export default {
        data () {
            return {
                "email": "jonathan@livio.io",
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
            }
        },
        created () {
            eventBus.$on("openUserNav", ()=> {
                this.style = {
                    "display": "block"
                };
                console.log("received openUserNav");
            });
        }
    }
</script>