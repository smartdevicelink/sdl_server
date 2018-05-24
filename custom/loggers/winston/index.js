//Winston Logger Module
const winston = require('winston');

let logLevel = "info"; //default
if (process.env.NODE_ENV === "production") {
    logLevel = "error"; //logs error
}
else if (process.env.NODE_ENV === "staging") {
    logLevel = "info"; //logs info and error
}

const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({ //write prettified logs to console
            colorize: true,
            timestamp: true,
            level: logLevel
        }),
        /*
        new winston.transports.File({ //write logs to a file as well
            level: logLevel,
            name: 'policy_logs',
            filename: 'policy_logs.log'
        })
        */
    ],
    exitOnError: false
});

module.exports = {
    //required functions to implement
    
    //normal message. log to file and to the console as an "info" message
    info: function (msg) {
        logger.info(msg);
    },
    //error message. log to file and to the console as an "error" message
    error: function (msg) {
        logger.error(msg);
    }
}