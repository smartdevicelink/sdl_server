<!-- Copyright (c) 2018, Livio, Inc. -->
<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <h4>About this Policy Server<a class="fa fa-question-circle color-primary doc-link" v-b-tooltip.hover title="Click here for more info about this page" href="https://smartdevicelink.com/en/guides/sdl-server/user-interface/about/" target="_blank"></a></h4>

                <div class="functional-content" v-if="about">

                    <div class="form-row mb-0">
                        <h4 for="name">Version {{ about.current_version }}</h4>
                        <div class="row">
                            <div class="col-sm-12">
                                <template v-if="!updateAvailable">
                                    <i
                                        class="fa fa-check-circle color-green"
                                        style=""
                                        aria-hidden="true">
                                    </i>
                                    <label class="col-form-label color-primary mt-0 ml-1" style="text-transform:none">Current version</label>
                                </template>
                                <template v-else>
                                    <i
                                        class="fa fa-times-circle color-red"
                                        style=""
                                        aria-hidden="true">
                                    </i>
                                    <label class="col-form-label color-primary mt-0 ml-1" style="text-transform:none">Update available! <a href="https://github.com/smartdevicelink/sdl_server" class="color-red" target="_blank">Install {{ about.latest_version }}</a></label>
                                </template>



                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <h4 for="name">Webhook URL</h4>
                        <input v-model="about.webhook_url" :disabled="fieldsDisabled" class="form-control">
                    </div>


                    <div class="form-row mb-0">
                        <h4 for="name">Configuration Options</h4>
                        <div class="row">
                            <div class="col-sm-12">
                                <i
                                    v-if="about.ssl_port"
                                    class="fa fa-check-circle color-green"
                                    style=""
                                    aria-hidden="true">
                                </i>
                                <i
                                    v-else
                                    class="fa fa-times-circle color-red"
                                    style=""
                                    aria-hidden="true">
                                </i>
                                <label class="col-form-label color-primary mt-0 ml-1" style="text-transform:none">SSL: {{ about.ssl_port ? `enabled (port ${about.ssl_port})` : `disabled` }}</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-row m-0">
                        <div class="row">
                            <div class="col-sm-12">
                                <i
                                    v-if="about.cache_module"
                                    class="fa fa-check-circle color-green"
                                    style=""
                                    aria-hidden="true">
                                </i>
                                <i
                                    v-else
                                    class="fa fa-times-circle color-red"
                                    style=""
                                    aria-hidden="true">
                                </i>
                                <label class="col-form-label color-primary ml-1" style="text-transform:none">Caching: {{ about.cache_module ? `enabled (${about.cache_module})` : `disabled` }}</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-row m-0">
                        <div class="row">
                            <div class="col-sm-12">
                                <i
                                    v-if="about.auth_type"
                                    class="fa fa-check-circle color-green"
                                    style=""
                                    aria-hidden="true">
                                </i>
                                <i
                                    v-else
                                    class="fa fa-times-circle color-red"
                                    style=""
                                    aria-hidden="true">
                                </i>
                                <label class="col-form-label color-primary ml-1" style="text-transform:none">Authentication: {{ about.auth_type ? `enabled (${about.auth_type})` : `disabled` }}</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-row m-0">
                        <div class="row">
                            <div class="col-sm-12">
                                <i
                                    v-if="about.auto_approve_all_apps"
                                    class="fa fa-check-circle color-green"
                                    style=""
                                    aria-hidden="true">
                                </i>
                                <i
                                    v-else
                                    class="fa fa-times-circle color-red"
                                    style=""
                                    aria-hidden="true">
                                </i>
                                <label class="col-form-label color-primary ml-1" style="text-transform:none">Auto-approve incoming apps: {{ about.auto_approve_all_apps ? `enabled` : `disabled` }}</label>
                            </div>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    </div>
</template>

<script>
    export default {
        data () {
            return {
                "about": null
            }
        },
        computed: {
            fieldsDisabled: function () {
                return true;
            },
            updateAvailable: function () {
                return (this.about && this.about.current_version != this.about.latest_version);
            }
        },
        methods: {
        },
        created (){
            this.httpRequest("get", "about", {}, (err, response) => {
                if(err){
                    // error
                    console.log("Error receiving about info.");
                    console.log(response);
                }else{
                    // success
                    response.json().then(parsed => {
                        this.about = parsed.data;
                        this.about.webhook_url = this.about.base_url + "/api/v1/webhook";
                    });
                }
            });
        },
        mounted (){
        },
        beforeDestroy () {
        }
    }
</script>
