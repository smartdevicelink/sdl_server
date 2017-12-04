const app = require('../../app');
const setupSql = app.locals.sql.setupSqlCommand;

function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    getMessageCategories(isProduction, function (err, categories) {
        if (err) {
            app.locals.log.error(err);
            return res.sendStatus(500);
        }
        return res.status(200).send({messages: categories}); 
    });
}

function getMessageCategories (isProduction, cb) {
    const getMessagesFlow = app.locals.flow([
        setupSql(app.locals.sql.messageCategories(isProduction, 'en-us')) //english results only
    ], {method: 'waterfall'});
    getMessagesFlow(cb);
}

module.exports = {
    get: get,
    getMessageCategories: getMessageCategories
};
