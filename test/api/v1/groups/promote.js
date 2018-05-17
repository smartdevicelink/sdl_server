var common = require('../../../common');
var expect = common.expect;
var sql = common.sql;
var setupSql = require('../../../../app/v1/app').locals.db.setupSqlCommand;
var endpoint = '/api/v1/groups/promote';

function getMostRecentFunctionGroupsById(ids) {
    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    let inner = sql.select('property_name')
        .from('function_group_info')
        .where(sql.in('id', ids));

    return sql.select('max(id) as id', 'property_name', 'status')
        .from('function_group_info')
        .where(sql.in('property_name', inner))
        .groupBy('property_name', 'status')
        .toString();
}

common.post(
    'should promote group to production',
    endpoint,
    {id: [ 1 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setupSql(getMostRecentFunctionGroupsById(1), (err, res) => {
            expect(err).to.be.null;
            expect(res[0].id).to.be.above(1);
            expect(res[0].status).to.equal('PRODUCTION');
            done();
        });
    }
);

common.post(
    'should promote groups to production',
    endpoint,
    {id: [ 2, 3, 4 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setupSql(getMostRecentFunctionGroupsById([2, 3, 4]), (err, res) => {
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
    'should not promote group with invalid id',
    endpoint,
    {id: [ 1000 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        setupSql(getMostRecentFunctionGroupsById(1000), (err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.lengthOf(0);
            done();
        });
    }
);

common.post(
    'should return 400 with no body',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
