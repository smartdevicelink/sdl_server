const chai = require('chai');
const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/vehicle-data';
const promoteEndpoint = '/api/v1/vehicle-data/promote';

common.startTest('should get vehicle data template', async function () {
    const res = await common.get(endpoint, { template: 'true' });
    expect(res).to.have.status(200);
    expect(res.body.data.custom_vehicle_data.length).to.equal(1);
});

common.startTest('should create a new STAGING vehicle data item', async function () {
    const res = await common.post(endpoint, {
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
    });
    expect(res).to.have.status(200);
});

common.startTest('should create a new STAGING vehicle data item with only the mandatory fields filled out', async function () {
    const res = await common.post(endpoint, {
        name: 'example-data',
        key: 'example-data',
        type: 'Integer',
        params: []
    });
    expect(res).to.have.status(200);
});

common.startTest('should fail creating vehicle data item when name field is missing', async function () {
    const res = await common.post(endpoint, {
        key: 'Struct 1',
        type: 'Struct',
        params: []
    });
    expect(res).to.have.status(400);
});

common.startTest('should fail creating vehicle data item when key field is missing', async function () {
    const res = await common.post(endpoint, {
        name: 'Struct 1',
        type: 'Struct',
        params: []
    });
    expect(res).to.have.status(400);
});

common.startTest('should fail creating vehicle data item when type field is missing', async function () {
    const res = await common.post(endpoint, {
        name: 'Struct 1',
        key: 'Struct 1',
        params: []
    });
    expect(res).to.have.status(400);
});

common.startTest('should get all STAGING vehicle data', async function () {
    const res = await common.get(endpoint, { environment: 'STAGING' });
    expect(res).to.have.status(200);
    expect(res.body.data.custom_vehicle_data).to.have.lengthOf.above(0);
});

common.startTest('should promote all STAGING vehicle data', async function () {
    const res = await common.post(promoteEndpoint, {});
    expect(res).to.have.status(200);
});

common.startTest('should get all PRODUCTION vehicle data', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data.custom_vehicle_data).to.have.lengthOf.above(0);
});

common.startTest('should get vehicle data with the given id', async function () {
    //get production data first
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    const id = res.body.data.custom_vehicle_data[0].id;

    //query a specific vehicle data item
    const res2 = await common.get(endpoint, { id: id });
    expect(res2).to.have.status(200);
    expect(res2.body.data.custom_vehicle_data).to.have.lengthOf(1);
});

common.startTest('should not get any vehicle data with invalid id', async function () {
    const res = await common.get(endpoint, { id: -10 });
    expect(res).to.have.status(200);
    expect(res.body.data.custom_vehicle_data).to.have.lengthOf(0);
});

common.startTest('should return 400 with invalid vehicle data', async function () {
    const res = await common.post(endpoint, {
        name: 'String 1',
        key: 'String 1',
        //type: 'String' //name, key, and type are required.
    });
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});
