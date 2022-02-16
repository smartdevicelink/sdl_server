// skeleton function for customized downloading and extracting of package information
const request = require('request');
const fs = require('fs');
const UUID = require('uuid');
const AWS = require('aws-sdk');
const StreamZip = require('node-stream-zip');
const BUCKET_NAME = process.env.BUCKET_NAME;

if (process.env.AWS_REGION !== undefined && BUCKET_NAME !== undefined) {
    AWS.config.update({region: process.env.AWS_REGION});
}

/**
 * asynchronous function for downloading the bundle from the given url and extracting its size information
 * @param package_url - a publicly accessible external url that's used to download the bundle onto the Policy Server
 * @param cb - a callback function that expects two arguments
 *      if there was a failure in the process, it should be sent as the first argument. the Policy Server will log it
 *      the second argument to return must follow the formatted object below
 *      {
 *          url: the Policy Server should save a copy of the app bundle somewhere publicly accessible
 *              this url must be a full resolved url
 *          size_compressed_bytes: the number of bytes of the compressed downloaded bundle
 *          size_decompressed_bytes: the number of bytes of the extracted downloaded bundle
 *      }
 */
exports.handleBundle = function (package_url, cb) {
    if (BUCKET_NAME === undefined || process.env.AWS_REGION === undefined) {
        return cb();
    } 

    let compressedSize = 0;
    let bucketUrl = '';
    const TMP_FILE_NAME = `${UUID.v4()}.zip`;

    // create a new bucket if it doesn't already exist
    new AWS.S3().createBucket({Bucket: BUCKET_NAME, ACL: 'public-read'}, err => {

        // OperationAborted errors are expected, as we are potentially 
        // calling this API multiple times simultaneously
        if (err && err.code !== 'OperationAborted') {
            console.log(err);
            return cb(err);
        }
        // read the URL and save it to a buffer variable
        readUrlToBuffer(package_url)
            .then(zipBuffer => { // submit the file contents to S3
                compressedSize = zipBuffer.length;
                const randomString = UUID.v4();
                const fileName = `${randomString}.zip`;
                bucketUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
                // make the bundle publicly accessible
                const objectParams = {Bucket: BUCKET_NAME, ACL: 'public-read', Key: fileName, Body: zipBuffer};
                // Create object upload promise
                return new AWS.S3().putObject(objectParams).promise();
            })
            .then(() => { // unzip the contents of the bundle to get its uncompressed data information
                return streamUrlToTmpFile(bucketUrl, TMP_FILE_NAME);
            })
            .then(() => {
                return unzipAndGetUncompressedSize(TMP_FILE_NAME);
            })
            .then(uncompressedSize => {
                // delete the tmp zip file
                fs.unlink(TMP_FILE_NAME, () => {
                    // all the information has been collected
                    cb(null, {
                        url: bucketUrl,
                        size_compressed_bytes: compressedSize,
                        size_decompressed_bytes: uncompressedSize
                    });
                });
            })
            .catch(err => {
                console.log(err);
                // delete the tmp zip file
                fs.unlink(TMP_FILE_NAME, () => {
                    cb(err);
                });
            });
    });
}

function unzipAndGetUncompressedSize (fileName) {
    let uncompressedSize = 0;

    return new Promise((resolve, reject) => {
        const zip = new StreamZip({
            file: fileName,
            skipEntryNameValidation: true
        });
        zip.on('ready', () => {
            // iterate through every unzipped entry and count up the file sizes
            for (const entry of Object.values(zip.entries())) {
                if (!entry.isDirectory) {
                    uncompressedSize += entry.size;
                }
            }
            // close the file once you're done
            zip.close()
            resolve(uncompressedSize);
        });

        // Handle errors
        zip.on('error', err => { 
            console.log(err);
            reject(err) 
        });
    });
}

function streamUrlToTmpFile (url, fileName) {
    return new Promise((resolve, reject) => {
        request(url)
            .pipe(fs.createWriteStream(fileName))
            .on('close', resolve);
    });
}

function readUrlToBuffer (url) {
    return new Promise((resolve, reject) => {
        let zipBuffer = [];

        request(url)
            .on('data', data => {
                zipBuffer.push(data);
            })
            .on('close', function () { // file fully downloaded
                // put the zip contents to a buffer 
                resolve(Buffer.concat(zipBuffer));
            });
    })
}
