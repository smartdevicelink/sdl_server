var common = require('../common');
var expect = common.expect;
var cache = require('../../custom/cache');

it('should be enabled', (done) => {
    expect(common.config.cacheModule).to.not.be.null;
    done();
});

it('should set a value in the cache and get the value back', async () => {
    await cache.setCacheData(true, 'test', 'key', 'someValue');
    const res = await cache.getCacheData(true, 'test', 'key');
    expect(res).to.equal('someValue');
});

it('should delete a value from the cache', async () => {
    await cache.deleteCacheData(true, 'test', 'key');

    const res = await cache.getCacheData(true, 'test', 'key');
    expect(res).to.be.null;
});

it('should delete everything from the cache', async () => {
    await cache.setCacheData(false, 'test', 'key', 'flush');
    await cache.flushAll(); 
    const res = await cache.getCacheData(false, 'test', 'key')
    expect(res).to.be.null;
});
