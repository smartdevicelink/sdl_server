const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/messages/names';

common.startTest('get with no parameters', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    const names = res.body.data.names;

    const messages = (await common.get('/api/v1/messages', {environment: 'staging'})).body.data.messages
    const messageNames = messages.map(message => message.message_category);

    // check that the data returned from the message names has a corresponding consumer message group name on staging
    for (let name of names) {
        expect(messageNames.includes(name)).to.equal(true);
    }
});
