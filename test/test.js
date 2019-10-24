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
            importTest('/applications/groups', './api/v1/applications/groups');
            importTest('/staging/policy', './api/v1/policy/staging');
            importTest('/production/policy', './api/v1/policy/production');
            importTest('/policy/preview', './api/v1/policy/preview');
            importTest('/policy/apps', './api/v1/policy/apps');
            importTest('/permssions/update', './api/v1/permissions/update');
            importTest('/permissions/unmapped', './api/v1/permissions/unmapped');
            importTest('/groups', './api/v1/groups/groups');
            importTest('/groups/names', './api/v1/groups/names');
            importTest('/groups/promote', './api/v1/groups/promote');
            importTest('/messages', './api/v1/messages/messages');
            importTest('/messages/promote', './api/v1/messages/promote');
            importTest('/messages/update', './api/v1/messages/update');
            importTest('/messages/names', './api/v1/messages/names');
            importTest('/module', './api/v1/module/module');
            importTest('/module/promote', './api/v1/module/promote');
            importTest('/vehicle-data', './api/v1/vehicle-data/vehicle-data');
            importTest('/vehicle-data/type', './api/v1/vehicle-data/type');
            importTest('/applications/auto', './api/v1/applications/auto');
            importTest('/applications/administrator', './api/v1/applications/administrator');
            importTest('/applications/passthrough', './api/v1/applications/passthrough');
            importTest('/applications/rpcencryption', './api/v1/applications/rpcencryption');
            importTest('/applications/hybrid', './api/v1/applications/hybrid');
            importTest('/applications/permission', './api/v1/applications/permission');
            importTest('/applications/certificate-get', './api/v1/applications/certificate-get');
            importTest('/applications/certificate', './api/v1/applications/certificate');
            importTest('/about', './api/v1/about/about');
            importTest('/security/certificate', './api/v1/security/certificate');
            importTest('/security/private', './api/v1/security/private');
            importTest('/login', './api/v1/login/login');
        });
    });

    importTest('cache', './cache/cache');
    importTest('basic-auth', './basicAuth/basicAuth');
});
