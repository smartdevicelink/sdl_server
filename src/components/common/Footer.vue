<template>
    <nav v-if="isDifferentVersion()" class="navbar fixed-bottom upgrade-alert">
        <div class="mx-auto h-100">
            <span class="align-middle text-center">** Notice: A new version of the SDL Policy Server (v{{latest_version}}) is available.</span>
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
            "current_version": "1.0.0"
        };
    },
    methods: {
        isDifferentVersion: function(){
            return (this.latest_version != null && this.latest_version !== this.current_version);
        }
    },
    created: function(){
        //get current version
        this.httpRequest("get", "/version", {}, (err, response) => {
            if(err){
                // error
                console.log("Error checking local Policy Server version.");
                console.log(err);
            }else{
                // success
                this.current_version = response.body;
            }
        });

        this.$http.get("https://raw.githubusercontent.com/smartdevicelink/sdl_server/master/package.json").then(response => {
            // success
            response.json().then(parsed => {
                this.latest_version = parsed.version;
            });
        }, response => {
            // error
            console.log("Error checking remote Policy Server version. Status code: " + response.status);
        });
    }
}
</script>