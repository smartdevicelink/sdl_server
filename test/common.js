const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiJsonSchema = require('chai-json-schema');
const expect = chai.expect;
const config = require('../settings.js');
const BASE_URL = 'http://' + config.policyServerHost + ':' + config.policyServerPort;
chai.use(chaiHttp);
chai.use(chaiJsonSchema);

exports.get = (testName, endpoint, queryParams, endFunction) => {
    it(testName, (done) => {
        chai.request(BASE_URL)
            .get(endpoint)
            .set('Accept', 'application/json')
            .set('BASIC-AUTH-PASSWORD', config.basicAuthPassword)
            .query(queryParams)
            .send()
            .end( (err, res) => {
                endFunction(err, res, done);
            });
    });
};

exports.post = (testName, endpoint, body, endFunction) => {
    it(testName, (done) => {
        chai.request(BASE_URL)
            .post(endpoint)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('BASIC-AUTH-PASSWORD', config.basicAuthPassword)
            .send(body)
            .end( (err, res) => {
                endFunction(err, res, done);
            })
    });
};

exports.chai = chai;
exports.expect = expect;
exports.BASE_URL = BASE_URL;
exports.config = config;
