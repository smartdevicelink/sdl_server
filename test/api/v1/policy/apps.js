var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/policy/apps';

common.post(
    'should get staging policy objects',
    endpoint,
    {
        policy_table: {
            app_policies: {
                "pancakes": 1,
                "ac0a3e87-a45a-4c29-af4c-a3a4955a5ad1": 1,
                "dfda5c35-700e-487e-87d2-ea4b2c572802": 2
            }
        },
        environment: "staging"
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(Object.keys(res.body.data[0].policy_table.app_policies).length).to.equal(6);
        done();
    }
);

common.post(
    'should get production policy objects',
    endpoint,
    {
        policy_table: {
            app_policies: {
                "pancakes": 1,
                "ac0a3e87-a45a-4c29-af4c-a3a4955a5ad1": 1,
                "dfda5c35-700e-487e-87d2-ea4b2c572802": 2
            }
        },
        environment: "production"
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(Object.keys(res.body.data[0].policy_table.app_policies).length).to.equal(6);
        done();
    }
);

common.post(
    'should return 400 with no app policies specified',
    endpoint,
    {
        policy_table: {

        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should get default permissions for invalid app uuid',
    endpoint,
    {
        policy_table: {
            app_policies: {
                "INVALID_APP": 1
            }
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(Object.keys(res.body.data[0].policy_table.app_policies).length).to.equal(4);
        done();
    }
);

common.post(
    'should return 400 with no body specified',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
