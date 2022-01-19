const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/messages/promote';

common.startTest('should promote the message with the given id', async function () {
    const res = await common.post(endpoint, {id: [ 1 ]});
    expect(res).to.have.status(200);
});

common.startTest('should promote the messages with the given ids', async function () {
    const res = await common.post(endpoint, {id: [ 2, 3, 4 ]});
    expect(res).to.have.status(200);
});

common.startTest('should not promote message with invalid id', async function () {
    const res = await common.post(endpoint, {id: [ 1000 ]});
    expect(res).to.have.status(200);

    const res2 = await common.get('/api/v1/messages', {id: 1000});
    expect(res2).to.have.status(200);
    expect(res2.body.data.messages).to.have.lengthOf(0);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});
