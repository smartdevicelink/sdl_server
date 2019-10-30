const chai = require('chai');
var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/vehicle-data';
var promoteEndpoint = '/api/v1/vehicle-data/promote';

common.get(
    'should get vehicle data template',
    endpoint,
    { template: 'true' },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.custom_vehicle_data.length).to.equal(1);
        done();
    }
);

common.post(
    'should create a new STAGING vehicle data item',
    endpoint,
    {
        name: 'Struct 1',
        key: 'Struct 1',
        type: 'Struct',
        params: [
            {
                type: 'Float',
                name: 'float',
                key: 'float',
                mandatory: true,
                is_array: true,
                min_size: 0,
                max_size: 10,
                min_value: 0,
                max_value: 10,
            },
            {
                type: 'String',
                name: 'string',
                key: 'string',
                mandatory: false,
                min_length: 0,
                max_length: 10,
            },
            {
                type: 'Struct',
                name: 'Struct 2',
                key: 'Struct 2',
                params: [
                    {
                        type: 'Boolean',
                        name: 'bool',
                        key: 'bool'
                    }
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
    'should create a new STAGING vehicle data item with only the mandatory fields filled out',
    endpoint,
    {
        name: 'example-data',
        key: 'example-data',
        type: 'Integer',
        params: []
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should fail creating vehicle data item when name field is missing',
    endpoint,
    {
        key: 'Struct 1',
        type: 'Struct',
        params: []
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should fail creating vehicle data item when key field is missing',
    endpoint,
    {
        name: 'Struct 1',
        type: 'Struct',
        params: []
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should fail creating vehicle data item when type field is missing',
    endpoint,
    {
        name: 'Struct 1',
        key: 'Struct 1',
        params: []
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.get(
    'should get all STAGING vehicle data',
    endpoint,
    { environment: 'STAGING' },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.custom_vehicle_data).to.have.lengthOf.above(0);
        done();
    }
);

common.post(
    'should promote all STAGING vehicle data',
    promoteEndpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.get(
    'should get all PRODUCTION vehicle data',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.custom_vehicle_data).to.have.lengthOf.above(0);
        done();
    }
);

it('should get vehicle data with the given id', (done) => {
    //get production data first
    chai.request(common.BASE_URL)
        .get(endpoint)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('BASIC-AUTH-PASSWORD', common.config.basicAuthPassword)
        .send()
        .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);

            const id = res.body.data.custom_vehicle_data[0].id;
            //query a specific vehicle data item
            chai.request(common.BASE_URL)
                .get(endpoint)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('BASIC-AUTH-PASSWORD', common.config.basicAuthPassword)
                .query({ id: id })
                .send()
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body.data.custom_vehicle_data).to.have.lengthOf(1);
                    done();
                });
        });
});

common.get(
    'should not get any vehicle data with invalid id',
    endpoint,
    { id: -10 },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.custom_vehicle_data).to.have.lengthOf(0);
        done();
    }
);

common.post(
    'should return 400 with invalid vehicle data',
    endpoint,
    {
        name: 'String 1',
        key: 'String 1',
        //type: 'String' //name, key, and type are required.
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
