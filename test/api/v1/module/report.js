var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/module/report';

common.get(
  'should return a report',
  endpoint,
  {id: 1},
  (err, res, done) => {
      expect(err).to.be.null;
      console.log(res.body);
      expect(res).to.have.status(200);
      done();
  }
);
