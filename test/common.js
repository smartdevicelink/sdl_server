const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiJsonSchema = require('chai-json-schema');
const expect = chai.expect;
const config = require('../settings.js');
const BASE_URL = 'http://' + config.policyServerHost + ':' + config.policyServerPort;
chai.use(chaiHttp);
chai.use(chaiJsonSchema);

exports.startTest = (testName, endFunction) => {
    it(testName, async () => {
        await endFunction();
    });
}

exports.get = (endpoint, queryParams, endFunction) => {
    return new Promise((resolve, reject) => {
        chai.request(BASE_URL)
            .get(endpoint)
            .set('Accept', 'application/json')
            .set('BASIC-AUTH-PASSWORD', config.basicAuthPassword)
            .query(queryParams)
            .send()
            .end( (err, res) => {
                expect(err).to.be.null;
                if (err) {
                    return reject(err);
                }
                resolve(res);
            });
    });
}

exports.postWebhook = (endpoint, body, publicKey, endFunction) => {
    return new Promise((resolve, reject) => {
        chai.request(BASE_URL)
            .post(endpoint)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('BASIC-AUTH-PASSWORD', config.basicAuthPassword)
            .set('public_key', publicKey)
            .send(body)
            .end( (err, res) => {
                expect(err).to.be.null;
                if (err) {
                    return reject(err);
                }
                resolve(res);
            });
    });
};

exports.post = (endpoint, body, endFunction) => {
    return new Promise((resolve, reject) => {
        chai.request(BASE_URL)
            .post(endpoint)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('BASIC-AUTH-PASSWORD', config.basicAuthPassword)
            .send(body)
            .end( (err, res) => {
                expect(err).to.be.null;
                if (err) {
                    return reject(err);
                }
                resolve(res);
            });
    });
};

exports.put = (endpoint, body, endFunction) => {
    return new Promise((resolve, reject) => {
        chai.request(BASE_URL)
            .put(endpoint)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('BASIC-AUTH-PASSWORD', config.basicAuthPassword)
            .send(body)
            .end( (err, res) => {
                expect(err).to.be.null;
                if (err) {
                    return reject(err);
                }
                resolve(res);
            });
    });
};

exports.chai = chai;
exports.expect = expect;
exports.BASE_URL = BASE_URL;
exports.config = config;
