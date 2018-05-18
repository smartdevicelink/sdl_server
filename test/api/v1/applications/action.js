var common = require('../../../common');
var expect = common.expect;
var sql = common.sql;
var setupSql = common.setupSql;
var endpoint = '/api/v1/applications/action';

function getAppStatusById(id) {
    return sql.select('approval_status')
        .from('app_info')
        .where({
            id: id
        })
        .toString();
}

common.post(
    'should change application status',
    endpoint,
    {id: 1, approval_status: 'DENIED'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setupSql(getAppStatusById(1), (err, res) => {
            expect(err).to.be.null;
            expect(res[0].approval_status).to.equal('DENIED');
            done();
        });
    }
);

common.post(
    'should return 400 with only id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with only approval_status',
    endpoint,
    {approval_status: 'ACCEPTED'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with invalid approval_status',
    endpoint,
    {id: 1, approval_status: 'INVALID'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should not change status fo an invalid application id',
    endpoint,
    {id: 10000, approval_status: 'ACCEPTED'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setupSql(getAppStatusById(1000), (err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.lengthOf(0);
            done();
        });
    }
);

common.post(
    'should return 400 when no body is specified',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
