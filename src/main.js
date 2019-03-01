// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import BootstrapVue from 'bootstrap-vue'
import VueLadda from 'vue-ladda'
import VueSession from 'vue-session'
import VueResource from 'vue-resource'
import VueScrollTo from 'vue-scrollto'
import SideNav from './components/common/SideNav.vue'
import UserNav from './components/common/UserNav.vue'
import AppRow from './components/common/AppRow.vue'
import AppServicePermissionRow from './components/common/AppServicePermission.vue'
import Invitee from './components/common/Invitee.vue'
import RpcItem from './components/common/RpcItem'
import RpcChecklist from './components/common/RpcChecklist'
import HmiSelector from './components/common/HmiSelector'
import MessageItem from './components/common/MessageItem'
import CardItem from './components/common/CardItem'
import PatternInput from './components/common/PatternInput'

Vue.use(BootstrapVue);
Vue.use(VueSession);
Vue.use(VueResource);
Vue.use(VueScrollTo);

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
Vue.component("app-service-permission-row", AppServicePermissionRow);
Vue.component("invitee", Invitee);
Vue.component("rpc-item", RpcItem);
Vue.component("rpc-checklist", RpcChecklist);
Vue.component("hmi-selector", HmiSelector);
Vue.component("message-item", MessageItem);
Vue.component("card-item", CardItem);
Vue.component("pattern-input", PatternInput);

Vue.http.options.root = '/api/v1';

export const eventBus = new Vue();

//reusable methods
Vue.mixin({
	methods: {
		"httpRequest": function (action, route, options = {}, cb) {
			if(!options){
				options = {};
			}
			if(!options.headers){
				options.headers = {};
			}
			if(!options.body){
				options.body = {};
			}
			if(this.$session.get("BASIC_AUTH_PASSWORD")){
				options.headers["BASIC-AUTH-PASSWORD"] = this.$session.get("BASIC_AUTH_PASSWORD");
			}
			if(["post","put","patch"].indexOf(action) >= 0){
				this.$http[action](route, options.body, options)
	            .then(response => {
	                cb(null, response);
	            }, response => {
					if(response.status == 401 && !options.preventAuthRedirect){
						this.$session.destroy();
						this.$router.go();
					}else{
						cb(response, null);
					}
	            });
			}else{
				this.$http[action](route, options)
	            .then(response => {
	                cb(null, response);
	            }, response => {
					if(response.status == 401 && !options.preventAuthRedirect){
						this.$session.destroy();
						this.$router.go();
					}else{
						cb(response, null);
					}
	            });
			}
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
		}
	}
})


/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
