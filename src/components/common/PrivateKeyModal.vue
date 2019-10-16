<!-- Copyright (c) 2018, Livio, Inc. -->
<template>
    <div class="functional-content">
        <b-modal :ref="name" title="Private Key Info" hide-footer :id="name" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
            <h4>Key Bit Size</h4>

            <pattern-input class="form-group text-truncate"
                id="textarea"
                :regExp="integerInput.regExp"
                :replacement="integerInput.replacement"
                v-model="certificate_options.keyBitsize"
                style="padding: 15px;width: 100%">
            </pattern-input>

            <h4>Cipher</h4>

            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.cipher"
                style="padding: 15px;width: 100%">
            </pattern-input>

            <vue-ladda
                type="button"
                class="btn btn-card btn-style-green"
                data-style="zoom-in"
                v-on:click="generatePrivateKeyClick()"
                v-bind:loading="button_loading">
                Generate Private Key
            </vue-ladda>

        </b-modal>
    </div>
</template>

<script>
    export default {
        props: ['name', 'environmentClick', 'actionCallback', 'certificate_options'],
        data () {
            return {
                "integerInput": {
                    "regExp": /^[\D]*|\D*/g, // Match any character that doesn't belong to the positive integer
                    "replacement": ""
                },
                "button_loading": false
            }
        },
        methods: {
            "generatePrivateKeyClick": function(){
                this.handleModalClick("button_loading", this.name, "generatePrivateKey");
            },
            "generatePrivateKey": function (cb) {
                const self = this;
                this.httpRequest('post', "security/private", { "body": { "options": self.certificate_options}}, (err, res) => {
                    if(err){
                        console.log("Error occurred creating private key");
                        console.log(err);
                    } else {
                        res.json().then(parsed => {
                            if(parsed && parsed.data){
                                console.log('Private key returned');
                                this.actionCallback(parsed.data);
                            } else {
                                console.log('No private key returned');
                                this.actionCallback();
                            }
                        })
                    }
                })
                cb();
            }
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs[this.name].onAfterLeave();
        }
    }
</script>
