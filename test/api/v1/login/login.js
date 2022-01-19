const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/login';

const oldPassword = common.config.basicAuthPassword;

common.config.authType = 'basic';
common.config.basicAuthPassword = 'testing';

common.startTest('return a 401 when trying to login with the wrong password', async function () {
    const res = await common.post(endpoint, {
        password: 'nope'
    });
    expect(res).to.have.status(401);
});

common.startTest('return a 200 when trying to login with the right password', async function () {
    const res = await common.post(endpoint, {
        password: 'testing'
    });
    expect(res).to.have.status(200);

    //reset
    common.config.authType = undefined;
    common.config.basicAuthPassword = oldPassword;
});

