var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/policy/apps';

// TODO: check to make sure correct info is returned
common.post(
    'post with environment and app_policies',
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
        done();
    }
);

// TODO: check to make sure correct info is returned
common.post(
    'post with app_policies',
    endpoint,
    {
        policy_table: {
            app_policies: {
                "pancakes": 1,
                "ac0a3e87-a45a-4c29-af4c-a3a4955a5ad1": 1,
                "dfda5c35-700e-487e-87d2-ea4b2c572802": 2
            }
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'post with environment and app_policies',
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

// TODO: check to make sure correct info is returned
common.post(
    'post with environment and app_policies',
    endpoint,
    {
        policy_table: {
            app_policies: {
                "INVALID_APP": 1
            }
        },
        environment: "staging"
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'post with no body',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
