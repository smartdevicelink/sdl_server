var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/messages';

common.get(
    'should get all messages',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.messages).to.have.lengthOf.above(0);
        done();
    }
);

common.get(
    'should get message with the given id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.messages).to.have.lengthOf(1);
        done();
    }
);

common.get(
    'should not get any message with invalid id',
    endpoint,
    {id: 1000},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.messages).to.have.lengthOf(0);
        done();
    }
);

common.post(
    'should create new message',
    endpoint,
    {
        messages: [
            {
                message_category: 'Blarg',
                is_deleted: false,
                languages: [

                ]
            }
        ]
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return 400 with invalid messages',
    endpoint,
    {
        messages: [
            {
                message_category: 'Blarg',
                languages: [

                ]
            },
            {
                message_category: 'Blarg2',
                is_deleted: false,
                languages: [

                ]
            }
        ]
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
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
