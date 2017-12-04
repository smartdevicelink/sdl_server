<template>
    <nav v-if="isDifferentVersion()" class="navbar fixed-bottom upgrade-alert">
        <div class="mx-auto h-100">
            <span class="align-middle text-center">** Notice: A new version of the SDL Policy Server (v2.1) is available.</span>
            <a href="https://github.com/smartdevicelink/sdl_server" target="_blank">
                <button type="button" class="btn btn-update btn-sm h-100">Update Now</button>
            </a>
        </div>
    </nav>
</template>

<script>
export default {
    data: function(){
        return {
            "latest_version": null,
            "current_version": "1"
        };
    },
    methods: {
        isDifferentVersion: function(){
            return (this.latest_version != null && this.latest_version !== this.current_version);
        }
    },
    beforeCreate: function(){
        //TODO: when master is updated, change the url from 'redesign' to 'master'
        this.$http.get("https://raw.githubusercontent.com/smartdevicelink/sdl_server/redesign/package.json").then(response => {
            // success
            response.json().then(parsed => {
                this.latest_version = parsed.version;
            });
        }, response => {
            // error
            console.log("Error checking Policy Server version. Status code: " + response.status);
        });
    }
}
</script>