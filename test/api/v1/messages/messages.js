const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/messages';

common.startTest('should get all messages', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data.messages).to.have.lengthOf.above(0);
});

common.startTest('should get message with the given id', async function () {
    const res = await common.get(endpoint, {id: 1});
    expect(res).to.have.status(200);
    expect(res.body.data.messages).to.have.lengthOf(1);
});

common.startTest('should not get any message with invalid id', async function () {
    const res = await common.get(endpoint, {id: 1000});
    expect(res).to.have.status(200);
    expect(res.body.data.messages).to.have.lengthOf(0);
});

common.startTest('should create new message', async function () {
    const res = await common.post(endpoint, {
        messages: [
            {
                message_category: 'Blarg',
                is_deleted: false,
                languages: [{
                    language_id: 'en-us',
                    selected: true,
                    line1: ''
                }]
            }
        ]
    });
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with invalid messages', async function () {
    const res = await common.post(endpoint, {
        messages: [
            {
                message_category: 'Blarg',
                languages: []
            },
            {
                message_category: 'Blarg2',
                is_deleted: false,
                languages: []
            }
        ]
    });
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});

