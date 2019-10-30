const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/login';

const oldPassword = common.config.basicAuthPassword;

common.config.authType = 'basic';
common.config.basicAuthPassword = 'testing';

common.post(
    'return a 401 when trying to login with the wrong password',
    endpoint,
    {
    	password: 'nope'
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        done();
    }
);

common.post(
    'return a 200 when trying to login with the right password',
    endpoint,
    {
    	password: 'testing'
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);

        //reset
		common.config.authType = undefined;
		common.config.basicAuthPassword = oldPassword;

        done();
    }
);



