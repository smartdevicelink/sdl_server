<template>
    <div class="white-box rpc-container">
        <h5>{{ index }} ({{ item.status }})</h5>
        <table style="width:100%">
            <tr>
                <td><b>tts</b></td>
                <input v-model="item.tts" style="width:100%;border-style:inset;"/>
            </tr>
            <tr>
                <td><b>line1</b></td>
                <input v-model="item.line1" style="width:100%;border-style:inset;"/>
            </tr>
            <tr>
                <td><b>line2</b></td>
                <input v-model="item.line2" style="width:100%;border-style:inset;"/>
            </tr>
            <tr>
                <td><b>text_body</b></td>
                <input v-model="item.text_body" style="width:100%;border-style:inset;"/>
            </tr>
            <tr>
                <td><b>label</b></td>
                <input v-model="item.label" style="width:100%;border-style:inset;"/>
            </tr>
        </table>
        <!-- save button -->
        <div>
            <vue-ladda
                type="submit"
                class="btn btn-card btn-style-green"
                data-style="zoom-in"
                v-on:click="saveMessageGroup()"
                v-bind:loading="save_button_loading">
                Save
            </vue-ladda>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['item','index'],
        data () {
            return {
                "save_button_loading": false
            };
        },
        methods: {
            "saveMessageGroup": function () {
                this.save_button_loading = true;
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
            }
        }
    }
</script>