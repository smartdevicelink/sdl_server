const example1 = new Vue({
	el: '#appRequests',
	data: {
		appRequests: []
	},
	created: function () {
		//on page load, contact the policy server for a list of pending applications
		this.$http.get('/api/v1/application').then(response => {
			this.appRequests = response.body;
			console.log(this.appRequests);
		}, response => {
			console.error(response);
		});
	}
});

Vue.component('app-display', {
	props: {
		app: Object
	},
	data: function () {
		return {
			expandedApp: false
		}
	},
	template: `
		<div>
			<div v-if="!expandedApp" class="appId">
				<div class="appDisplay" v-on:click="invertExpanded"> {{app.app_uuid}} </div>
				<div class="buttonDisplay" v-on:click="denyApp(app)"> Deny application </div>
			</div>
			<div v-else class="appFull">
				<div class="appDisplay" v-on:click="invertExpanded">
					<b style="flex-grow: 1;"> {{app.app_uuid}} </b>
					<p style="flex-grow: 1;"> App Name: {{app.name}} </p>
					<p style="flex-grow: 1;"> Platform: {{app.platform}} </p>
					<div style="flex-grow: 1;" v-if="app.display_names.length !== 0">
						Names: 
						<ul>
			                <li v-for="name in app.display_names">
			                    <p> {{name}} </p>
			                </li>
		                </ul>					
					</div>
					<div style="flex-grow: 1;" v-if="app.rpcPermissions.length !== 0">
		                RPC Permissions: 
						<ul>
			                <li v-for="perm in app.rpcPermissions">
			                    <p> {{perm}} </p>
			                </li>
		                </ul>					
					</div>
					<div style="flex-grow: 1;" v-if="app.vehiclePermissions.length !== 0">
		                Vehicle Data Permissions: 
						<ul>
			                <li v-for="perm in app.vehiclePermissions">
			                    <p> {{perm}} </p>
			                </li>
		                </ul>				
					</div>

					<div v-if="app.tech_email">
						<p> Tech Email: {{app.tech_email} </p>
					</div>
					<div v-if="app.tech_phone">
						<p> Phone Number: {{app.tech_phone}} </p>
					</div>
				</div>
				<div class="buttonDisplay" v-on:click="denyApp(app)"> Deny application </div>
			</div>		
		</div>
	`,
	methods: {
		invertExpanded: function () {
			this.expandedApp = !this.expandedApp;
		},
		denyApp: function (app) {
			const body = {
				id: app.id
			};
			this.$http.post('/api/v1/deny', body).then(response => {
				document.location.reload();
			}, response => {
				console.error(response);
			});
		}
	}
});