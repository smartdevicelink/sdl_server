// skeleton function for customized downloading and extracting of package information

const http = require('http');
const fs = require('fs');
const UUID = require('uuid');

/**
 * asynchronous function for downloading the bundle from the given url and extracting its size information
 * @param package_url - a pubicly accessible external url that's used to download the bundle onto the policy server
 * @param cb - a callback function that expects two arguments
 *      if there was a failure in the process, it should be sent as the first argument. the policy server will log it
 *      the second argument to return must follow the formatted object below
 *      {
 *          url: the policy server should save a copy of the app bundle somewhere publicly accessible
 *              this url must be a full resolved url
 *          size_compressed_bytes: the number of bytes of the compressed downloaded bundle
 *          size_decompressed_bytes: the number of bytes of the extracted downloaded bundle
 *      }
 */
exports.handleBundle = function (package_url, cb) {
    cb();
}
