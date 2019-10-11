<!-- Copyright (c) 2018, Livio, Inc. -->
<template>
    <div class="functional-content">
        <b-modal :ref="name" title="Private Key Info" hide-footer :id="name" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
            <h4>Country Name (2 Letter Code)</h4>
            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.country"
                :maxlength="2"
                style="padding: 15px; width: 100%">
            </pattern-input>

            <h4>State or Province Name (Full Name)</h4>
            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.state"
                style="padding: 15px; width: 100%">
            </pattern-input>

            <h4>Locality Name (eg, City)</h4>
            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.locality"
                style="padding: 15px; width: 100%">
            </pattern-input>

            <h4>Organization Name (eg, Company)</h4>
            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.organization"
                style="padding: 15px; width: 100%">
            </pattern-input>

            <h4>Organizational Unit Name (eg, section)</h4>
            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.organizationUnit"
                style="padding: 15px; width: 100%">
            </pattern-input>

            <h4>* Common Name (eg, fully qualified host name)</h4>
            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.commonName"
                style="padding: 15px; width: 100%">
            </pattern-input>

            <h4>Email Address</h4>
            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.emailAddress"
                style="padding: 15px; width: 100%">
            </pattern-input>

            <h4 style="text-decoration: none">Days</h4>
            <pattern-input class="form-group text-truncate"
                id="textarea"
                v-model="certificate_options.days"
                :regExp="integerInput.regExp"
                :replacement="integerInput.replacement"
                style="padding: 15px; width: 100%">
            </pattern-input>

            <div v-if="certificate_options.commonName === ''" class="alert color-bg-red color-white d-table" role="alert">
                Common Name is a required field.
            </div>

            <vue-ladda
                v-else
                type="button"
                class="btn btn-card btn-style-green"
                data-style="zoom-in"
                v-on:click="generateCertificateClick()"
                v-bind:loading="button_loading">
                Generate Certificate
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
            "generateCertificateClick": function(){
                this.handleModalClick("button_loading", this.name, "generateCertificate");
            },
            "generateCertificate": function(cb){
                let options = this.certificate_options;
                options.clientKey = this.private_key;
                this.httpRequest("post", "security/certificate", {"body":{"options": options}}, (err, res) => {
                    if(err){
                        console.log("Error occurred creating certificate");
                        console.log(err);
                    } else {
                        res.json().then(parsed => {
                            if(parsed && parsed.data && parsed.data.certificate){
                                console.log("Everything went ok");
                                this.actionCallback(parsed.data)
                            } else {
                                console.log("No certificate returned");
                                this.actionCallback()
                            }
                        });
                    }
                });
                cb();
            },
        },
        beforeDestroy () {
            // ensure closing of all modals
            this.$refs[this.name].onAfterLeave();
        }
    }
</script>
