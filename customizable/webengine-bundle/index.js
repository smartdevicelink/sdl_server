// skeleton function for customized downloading and extracting of package information

const request = require('request');
const fs = require('fs');
const UUID = require('uuid');

// asynchronous function for downloading the bundle from the given url and extracting its size information
// the package url is a pubicly accessible external url that's used to download the bundle onto the policy server
// the old package url is the url the server stored for this app uuid. this can be used to remove the old resource bundle to prevent using up lots of disk space
// cb is a callback function that expects two arguments:
// err: if there was a failure in the process, it should be sent as the first argument. the policy server will log it
// the second argument to return must follow the formatted object below
/*
    {
        url: the policy server should save a copy of the app bundle and serve that bundle over this url
            the recommendation is to store the bundles as randomized string names in the static folder.
            the url should be a relative path, under the assumption that the host, part, and protocol can change
            if it is a relative path, the full path will be computed by the policy server on runtime
            this can be overwritten by sending an absolute url instead, in which case the policy server will not 
            perform additional logic on the url
        size_compressed_bytes: the number of bytes of the compressed downloaded bundle
        size_decompressed_bytes: the number of bytes of the extracted downloaded bundle
    }
*/
exports.handleBundle = function (package_url, old_package_url, cb) {
    cb();
}
