var chai = require('chai');
var chaiHttp = require('chai-http');
var chaiJsonSchema = require('chai-json-schema');
var expect = chai.expect;
var BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

chai.use(chaiHttp);
chai.use(chaiJsonSchema);

function get(testName, endpoint, queryParams, endFunction) {
    it(testName, (done) => {
        chai.request(BASE_URL)
            .get(endpoint)
            .set('Accept', 'application/json')
            .query(queryParams)
            .send()
            .end( (err, res) => {
                endFunction(err, res, done);
            });
    });
}

function post(testName, endpoint, body, endFunction) {
    it(testName, (done) => {
        chai.request(BASE_URL)
            .post(endpoint)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send(body)
            .end( (err, res) => {
                endFunction(err, res, done);
            })
    });
}

exports.chai = chai;
exports.expect = expect;
exports.BASE_URL = BASE_URL;
exports.get = get;
exports.post = post;
