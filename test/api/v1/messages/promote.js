var common = require('../../../common');
var expect = common.expect;
var sql = common.sql;
var setupSql = common.setupSql;
var endpoint = '/api/v1/messages/promote';

function getMostRecentMessagesById(ids) {
    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    let inner = sql.select('message_category')
        .from('message_group')
        .where(sql.in('id', ids));

    return sql.select('max(id) as id', 'message_category', 'status')
        .from('message_group')
        .where(sql.in('message_category', inner))
        .groupBy('message_category', 'status')
        .toString();
}

common.post(
    'should promote the message with the given id',
    endpoint,
    {id: [ 1 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setupSql(getMostRecentMessagesById(1), (err, res) => {
            expect(err).to.be.null;
            expect(res[0].id).to.equal(1);
            expect(res[0].status).to.equal('PRODUCTION');
            done();
        });
    }
);

common.post(
    'should promote the messages with the given ids',
    endpoint,
    {id: [ 2, 3, 4 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setupSql(getMostRecentMessagesById([2, 3, 4]), (err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.lengthOf(3);
            for (let i = 0; i < res.length; i++) {
                expect(res[i].status).to.equal('PRODUCTION');
            }
            done();
        });
    }
);

common.post(
    'should not promote message with invalid id',
    endpoint,
    {id: [ 1000 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setupSql(getMostRecentMessagesById(1000), (err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.lengthOf(0);
            done();
        });
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
