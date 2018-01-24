<template>
    <div class="white-box rpc-container">
        <h5></h5>
        <h5>{{ index }}
            <i
                v-on:click="removeLanguage()"
                v-if="this.environment !== 'PRODUCTION'"
                class="pointer pull-right fa fa-times hover-color-red"
                aria-hidden="true">
            </i>
        </h5>

        <div class="form-group row">
            <label class="col-sm-2 col-form-label">TTS</label>
            <div class="col-sm-10">
                <input v-model="item.tts" class="form-control">
            </div>
        </div>

        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Line 1</label>
            <div class="col-sm-10">
                <input v-model="item.line1" class="form-control">
            </div>
        </div>

        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Line 2</label>
            <div class="col-sm-10">
                <input v-model="item.line2" class="form-control">
            </div>
        </div>

        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Text Body</label>
            <div class="col-sm-10">
                <input v-model="item.text_body" class="form-control">
            </div>
        </div>

        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Label</label>
            <div class="col-sm-10">
                <input v-model="item.label" class="form-control">
            </div>
        </div>

    </div>
</template>

<script>
    export default {
        props: ['item','index','environment'],
        data () {
            return {
            };
        },
        methods: {
            "saveMessageGroup": function () {
                let body = { messages: {} };
                body.messages[this.index] = this.item;
                this.$http.post("messages", body)
                    .then(response => {
                        this.save_button_loading = false;
                        this.$router.go(); //reload current page+
                    }, response => {
                        console.error(response.body.error);
                        this.save_button_loading = false;
                    });
            },
            "removeLanguage": function() {
                this.item.selected = false;
            }
        }
    }
</script>