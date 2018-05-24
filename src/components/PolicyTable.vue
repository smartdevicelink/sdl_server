<template>
    <div class="container-fluid">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <b-form-radio-group id="selectEnvironment"
                    buttons
                    button-variant="toggle"
                    v-on:change="environmentClick"
                    v-model="environment"
                    :options="environmentOptions"
                    name="chooseEnvironment" />

                <h4>Policy Table<a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/view-policy-table/" target="_blank"></a></h4>
                <b-input-group style="margin-bottom:0.5em;">
                    <b-input-group-addon>POST</b-input-group-addon>
                    <b-form-input type="text" v-bind:value="policyTablePostUrl"></b-form-input>
                </b-input-group>
                <div v-if="policytable !== null">
                    <vue-json-pretty :data="policytable"></vue-json-pretty>
                    <a v-if="!at_top" id="back-to-top" v-scroll-to="'body'" v-on:click.prevent class="btn btn-primary btn-lg back-to-top" role="button"><i class="fa fa-fw fa-chevron-up"></i></a>
                </div>
            </main>
        </div>
    </div>
</template>


<script>
import VueJsonPretty from 'vue-json-pretty'

export default {
    components: {
        VueJsonPretty
    },
    data: function(){
        return {
            "environment": "staging",
            "environmentOptions": [
                {
                    "text": "Staging",
                    "value": "staging"
                },
                {
                    "text": "Production",
                    "value": "production"
                }
            ],
            "policytable": null,
            "at_top": true
        };
    },
    computed: {
        "policyTablePostUrl": function(){
            return location.protocol + "//" + location.host + "/api/v1/" + this.environment + "/policy";
        }
    },
    methods: {
        "environmentClick": function(){
            this.$nextTick(function () {
                const self = this;
                console.log("Selected environment: " + this.environment);
                this.httpRequest("get", "policy/preview", {
                    "params": {
                        "environment": this.environment
                    }
                }, (err, response) => {
                    if (err) {
                        console.log("Error fetching policy table.");
                        console.log(err);
                    } else {
                        console.log("policy table retrieved");
                        response.json().then(parsed => {
                            if(parsed.data && parsed.data.length){
                                this.policytable = parsed.data[0];
                            }else{
                                console.log("No policy table returned");
                            }
                        });
                    }
                });
            });
        },
        "checkScroll": function(e) {
            this.at_top = window.scrollY ? false : true;
        }
    },
    created: function(){
        window.addEventListener('scroll', this.checkScroll);
    },
    mounted: function(){
        this.environmentClick();
    },
    destroyed: function() {
        window.removeEventListener('scroll', this.checkScroll);
    }
}
</script>
