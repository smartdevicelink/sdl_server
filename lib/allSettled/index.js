function allSettledPolyfill (promises) {
    return Promise.all(promises.map(promise => {
        return promise
            .then(value => ({
                status: "fulfilled",
                value: value,
            }))
            .catch(reason => ({
                status: "rejected",
                reason: reason
            }));
    }));
}

module.exports = allSettledPolyfill;