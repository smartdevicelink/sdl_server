<template>
    <nav v-if="isUpdateAvailable()" class="navbar fixed-bottom upgrade-alert">
        <div class="mx-auto h-100">
            <span class="align-middle text-center">{{ (about.update_type ? "A " + about.update_type + " " : "An") }} update (v{{about.latest_version}}) is available for your SDL Server.</span>
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
            "about": {}
        };
    },
    methods: {
        isUpdateAvailable: function(){
            return this.about.is_update_available;
        }
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
                });
            }
        });
    }
}
</script>