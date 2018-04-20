<template>
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <meta name="description" content="">
            <meta name="author" content="">

            <link rel="apple-touch-icon" sizes="180x180" href="~@/assets/images/apple-touch-icon.png">
            <link rel="icon" type="image/png" sizes="32x32" href="~@/assets/images/favicon-32x32.png">
            <link rel="icon" type="image/png" sizes="16x16" href="~@/assets/images/favicon-16x16.png">
            <link rel="manifest" href="~@/assets/manifest.json">
            <link rel="mask-icon" href="~@/assets/images/safari-pinned-tab.svg" color="#5bbad5">
            <meta name="theme-color" content="#ffffff">

            <title>SDL Policy Server - Application Detail</title>
        </head>

        <body>
            <page-header/>
            <router-view></router-view>
            <page-footer/>
            <!-- Bootstrap core JavaScript
            ================================================== -->
            <!-- Placed at the end of the document so the pages load faster -->
            <!--
            <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js" integrity="sha384-b/U6ypiBEHpOf/4+1nzFpr53nxSS+GLCkfwBdFNTxtclqqenISfwAzpKaMNFNmj4" crossorigin="anonymous"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/js/bootstrap.min.js" integrity="sha384-h0AbiXch4ZDo7tp9hKZ4TsHbi047NrKGLO3SEJAg45jXxnGIfYzk4Si90RDIqNm1" crossorigin="anonymous"></script>
            -->
        </body>
    </html>
</template>

<script>
import { eventBus } from './main.js';
import Header from './components/common/Header.vue'
import Footer from './components/common/Footer.vue'
export default {
      components: {
          "page-header": Header,
          "page-footer": Footer
      },
      created () {
          eventBus.$on("logout", ()=> {
              console.log("logout");
              this.$session.destroy();
              this.$router.go();
          });
      }
}
</script>