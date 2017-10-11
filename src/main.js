// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import BootstrapVue from 'bootstrap-vue'
import VueLadda from 'vue-ladda'
import SideNav from './components/common/SideNav.vue'
import UserNav from './components/common/UserNav.vue'
import AppRow from './components/common/AppRow.vue'
import Invitee from './components/common/Invitee.vue'

Vue.use(BootstrapVue);

Vue.config.productionTip = false

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import './assets/css/font-awesome.min.css'
import './assets/css/style.css'
import './assets/js/run_prettify.js'

Vue.component("vue-ladda", VueLadda);
Vue.component("page-side-nav", SideNav);
Vue.component("page-user-nav", UserNav);
Vue.component("app-row", AppRow);
Vue.component("invitee", Invitee);

export const eventBus = new Vue();

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
