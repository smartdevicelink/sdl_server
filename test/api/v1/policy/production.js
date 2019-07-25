var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/production/policy';

common.post(
    'should return production policy table',
    endpoint,
    {
        policy_table: {
            app_policies: {},
            consumer_friendly_messages: {},
            device_data: {},
            functional_groupings: {},
            module_config: {},
            usage_and_error_counts: {}
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);

        let policy_table = res.body.data[0].policy_table;
        let {functional_groupings} = policy_table;
        expect(functional_groupings).not.to.be.undefined;


        let functionGroup;
        //https://github.com/smartdevicelink/sdl_core/blob/develop/src/appMain/sdl_preloaded_pt.json
        //Should match the preloaded core policy table for the most part.
        let Base4 = functional_groupings['Base-4'];
        functionGroup = Base4;
        expect(functionGroup).not.to.be.undefined;
        expect(functionGroup.rpcs.ShowAppMenu,`The ShowAppMenu rpc should be included in Base-4 for production.`).not.to.be.undefined;
        expect(functionGroup.rpcs.ShowAppMenu.hmi_levels).to.have.members(
          [
              "FULL"
          ]
        );

        let Base6 = functional_groupings['Base-6'];
        functionGroup = Base6
        expect(functionGroup).not.to.be.undefined;
        expect(functionGroup.rpcs.ShowAppMenu,`The ShowAppMenu rpc should be included in Base-6 for production.`).not.to.be.undefined;
        expect(functionGroup.rpcs.ShowAppMenu.hmi_levels).to.have.members(
          [
              "FULL"
          ]
        );

        done();
    }
);

common.post(
    'should return 400 with invalid policy_table',
    endpoint,
    {
        policy_table: {
            app_policies: {},
            consumer_friendly_messages: {},
            functional_groupings: {},
            module_config: {},
            usage_and_error_counts: {}
        }
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
