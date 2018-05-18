"use strict";

var sdlServer = require('../index.js');

function importTest(name, path) {
    describe(name, function() {
        require(path);
    });
}

describe('SDL SERVER TESTS', function () {
    before(function(done) {
        this.timeout(16000);
        setTimeout(done, 15000);
    });

    describe('api', function() {
        describe('v1', function() {
            importTest('/applications', './api/v1/applications/applications');
            importTest('/applications/action', './api/v1/applications/action');
            importTest('/applications/auto', './api/v1/applications/auto');
            importTest('/staging/policy', './api/v1/policy/staging');
            importTest('/production/policy', './api/v1/policy/production');
            importTest('/policy/preview', './api/v1/policy/preview');
            importTest('/policy/apps', './api/v1/policy/apps');
            importTest('/permssions/update', './api/v1/permissions/update');
            importTest('/permissions/unmapped', './api/v1/permissions/unmapped');
            importTest('/groups', './api/v1/groups/groups');
            //importTest('/groups/names', './api/v1/groups/names');
            importTest('/groups/promote', './api/v1/groups/promote');
            importTest('/messages', './api/v1/messages/messages');
            importTest('/messages/promote', './api/v1/messages/promote');
            importTest('/messages/update', './api/v1/messages/update');
            //importTest('/messages/names', './api/v1/messages/names');
            importTest('/module', './api/v1/module/module');
            importTest('/module/promote', './api/v1/module/promote');
        });
    });

    importTest('cache', './cache/cache');
    importTest('basic-auth', './basicAuth/basicAuth');
});
