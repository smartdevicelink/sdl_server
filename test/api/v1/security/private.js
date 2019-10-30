const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/security/private';

common.post(
    'should return a new private key even with no data provided',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data).to.be.a('string');
        done();
    }
);

common.post(
    'should return a new private key with optional data provided',
    endpoint,
    {
        options: {
            keyBitsize: "l",
            cipher: "sha-256",
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data).to.be.a('string');
        done();
    }
);