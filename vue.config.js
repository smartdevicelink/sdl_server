//load ENV variables. must happen before the settings module load
require('dotenv').config(); 
const settings = require('./settings.js') //configuration module
process.env.VUE_APP_AUTH_TYPE = JSON.stringify(settings.authType);
process.env.OVERRIDE_ENTRY_POINT = true; // do not run the server immediately
const app = require('./index.js');

module.exports = {
	devServer: {
		before: app,
        port: settings.policyServerPort
    }
}