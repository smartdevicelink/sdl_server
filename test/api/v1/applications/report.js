var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/applications/report';


common.get(
  'id is required',
  endpoint,
  {},
  (err, res, done) => {
      expect(err).to.be.null;
      console.log(res.body);
      expect(res).to.have.status(400);
      done();
  }
);


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
