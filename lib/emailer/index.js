const NODEMAILER = require("nodemailer");
const CONFIG = require("../../settings.js");

let transporter = null;

let smtp_config = {
    "host": CONFIG.smtp.host,
    "port": CONFIG.smtp.port,
    "secure": CONFIG.smtp.port == 465 ? true : false
};

if(CONFIG.smtp.username || CONFIG.smtp.password) smtp_config.auth = {};
if(CONFIG.smtp.username) smtp_config.auth.user = CONFIG.smtp.username;
if(CONFIG.smtp.password) smtp_config.auth.pass = CONFIG.smtp.password;

if(isSmtpConfigured()){
    transporter = NODEMAILER.createTransport(smtp_config, {
        "from": CONFIG.smtp.from
    });
}

function isSmtpConfigured(){
    return (CONFIG.smtp.host && CONFIG.smtp.from);
}

module.exports = {
    send: function(data, callback){
        if(!transporter){
            if(typeof callback == "function") callback(null, null);
            return;
        }
        transporter.sendMail(data, callback);
    },
    isSmtpConfigured: isSmtpConfigured
}