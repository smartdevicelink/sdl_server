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
import RpcItem from './components/common/RpcItem'
import RpcChecklist from './components/common/RpcChecklist'
import HmiSelector from './components/common/HmiSelector'
import MessageItem from './components/common/MessageItem'
import CardItem from './components/common/CardItem'

Vue.use(BootstrapVue);
Vue.use(VueSession);
Vue.use(VueResource);

Vue.config.productionTip = false

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import './assets/css/font-awesome.min.css'
import './assets/css/style.css'
import async from 'async';
Object.defineProperty(Vue.prototype, '$async', { value: async });

Vue.component("vue-ladda", VueLadda);
Vue.component("page-side-nav", SideNav);
Vue.component("page-user-nav", UserNav);
Vue.component("app-row", AppRow);
Vue.component("invitee", Invitee);
Vue.component("rpc-item", RpcItem);
Vue.component("rpc-checklist", RpcChecklist);
Vue.component("hmi-selector", HmiSelector);
Vue.component("message-item", MessageItem);
Vue.component("card-item", CardItem);

Vue.http.options.root = '/api/v1';

export const eventBus = new Vue();

//reusable methods
Vue.mixin({
	methods: {
		"httpRequest": function (action, route, body, cb) {
	        if (action === "delete" || action === "get") {
	            if (body !== null) {
	                body = {body: body};
	            }
	        }
	        this.$http[action](route, body)
	            .then(response => {
	                cb(null, response);
	            }, response => {
	                cb(response, null);
	            });
	    },
	    "handleModalClick": function (loadingProp, modalName, methodName) {
            //show a loading icon for the modal, and call the methodName passed in
            //when finished, turn off the loading icon, hide the modal, and reload the info
            this[loadingProp] = true;
            this[methodName](() => {
                this[loadingProp] = false;
                if (modalName) {
                    this.$refs[modalName].hide();
                }
                this.environmentClick();
            });
        },
	}
})


/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
