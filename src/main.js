// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import BootstrapVue from 'bootstrap-vue'
import VueLadda from 'vue-ladda'
import VueSession from 'vue-session'
import VueResource from 'vue-resource'
import SideNav from './components/common/SideNav.vue'
import UserNav from './components/common/UserNav.vue'
import AppRow from './components/common/AppRow.vue'
import Invitee from './components/common/Invitee.vue'
import FunctionalGroupItem from './components/common/FunctionalGroupItem.vue'
import RpcItem from './components/common/RpcItem'
import RpcChecklist from './components/common/RpcChecklist'
import HmiSelector from './components/common/HmiSelector'
import ConsumerMessageItem from './components/common/ConsumerMessageItem.vue'
import MessageItem from './components/common/MessageItem'

Vue.use(BootstrapVue);
Vue.use(VueSession);
Vue.use(VueResource);

Vue.config.productionTip = false

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import './assets/css/font-awesome.min.css'
import './assets/css/style.css'
import './assets/js/run_prettify.js'
import async from 'async';
Object.definePrototype(Vue.prototype, '$async', { value: async });

Vue.component("vue-ladda", VueLadda);
Vue.component("page-side-nav", SideNav);
Vue.component("page-user-nav", UserNav);
Vue.component("app-row", AppRow);
Vue.component("invitee", Invitee);
Vue.component("functional-group-item", FunctionalGroupItem);
Vue.component("rpc-item", RpcItem);
Vue.component("rpc-checklist", RpcChecklist);
Vue.component("hmi-selector", HmiSelector);
Vue.component("consumer-message-item", ConsumerMessageItem);
Vue.component("message-item", MessageItem);

Vue.http.options.root = '/api/v1';

export const eventBus = new Vue();

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
