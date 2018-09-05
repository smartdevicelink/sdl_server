var common = require('../common');
var expect = common.expect;
var cache = require('../../custom/cache');

it('should be enabled', (done) => {
    expect(common.config.cacheModule).to.not.be.null;
    done();
});

it('should set a value in the cache and get the value back', (done) => {
    cache.setCacheData(true, 'test', 'key', 'someValue', (err, res) => {
        expect(err).to.be.null;
        cache.getCacheData(true, 'test', 'key', (err, res) => {
            expect(err).to.be.null;
            expect(res).to.equal('someValue');
            done();
        });
    });
});

it('should delete a value from the cache', (done) => {
    cache.deleteCacheData(true, 'test', 'key', (err, res) => {
        expect(err).to.be.null;
        cache.getCacheData(true, 'test', 'key', (err, res) => {
            expect(err).to.be.null;
            expect(res).to.be.null;
            done();
        });
    });
});

it('should delete everything from the cache', (done) => {
    cache.setCacheData(false, 'test', 'key', 'flush', (err, res) => {
        expect(err).to.be.null;
        cache.flushAll( (err, res) => {
            expect(err).to.be.null;
            cache.getCacheData(false, 'test', 'key', (err, res) => {
                expect(err).to.be.null;
                expect(res).to.be.null;
                done();
            });
        });
    });
});
