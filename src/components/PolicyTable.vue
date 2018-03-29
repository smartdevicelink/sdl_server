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

                <h4>Policy Table Preview<a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/view-policy-table/"></a></h4>
                <div v-if="policytable !== null">
                    <vue-json-pretty :data="policytable"></vue-json-pretty>
                    <a id="back-to-top" v-scroll-to="'body'" v-on:click.prevent class="btn btn-primary btn-lg back-to-top" role="button"><i class="fa fa-fw fa-chevron-up"></i></a>
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
            "policytable": null
        };
    },
    methods: {
        "environmentClick": function(){
            const self = this;
            console.log("Selected environment: " + this.environment);
            this.$http.get("policy/preview?environment=" + this.environment, {
            }).then(response => {
                // success
                console.log("policy table retrieved");
                response.json().then(parsed => {
                    if(parsed.data && parsed.data.length){
                        this.policytable = parsed.data[0];
                    }else{
                        console.log("No policy table returned");
                    }
                });
            }, response => {
                // error
                console.log("Error fetching policy table. Status code: " + response.status);
                console.log("Error fetching policy table. Error message: " + response.body.error);
            });
        },
    },
    created: function(){
    },
    mounted: function(){
        this.environmentClick();
    }
}
</script>