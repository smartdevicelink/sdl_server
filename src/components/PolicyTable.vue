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
                <div v-if="policytable !== null">
                    <!--<pre class="prettyprint linenums hidenums">{{ policytable }}</pre>-->
                    <vue-json-pretty :data="policytable"></vue-json-pretty>
                    <a id="back-to-top" v-on:click.prevent="toTop" class="btn btn-primary btn-lg back-to-top" role="button"><i class="fa fa-fw fa-chevron-up"></i></a>
                </div>
            </main>
        </div>
    </div>
</template>


<script>
import * as $ from 'jquery'
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
        "toTop": function(){
            $('body,html').animate({
                scrollTop: 0
            }, 500);
            $('.prettyprint').animate({
                scrollLeft: 0
            }, 500);
        },
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
        $(document).ready(function(){
            $(window).scroll(function () {
                if ($(this).scrollTop() > 50) {
                    $('#back-to-top').show();
                } else {
                    $('#back-to-top').hide();
                }
            });
        });
    },
    mounted: function(){
        this.environmentClick();
    }
}
</script>