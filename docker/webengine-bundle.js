// skeleton function for customized downloading and extracting of package information
const http = require('http');
const https = require('https');
const fs = require('fs');
const UUID = require('uuid');
const AWS = require('aws-sdk');
const StreamZip = require('node-stream-zip');
// assumes the bucket already exists. make sure it is set up to allow writing objects to it from remote sources!
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
    const urlObj = new URL(url);
    return new Promise((resolve, reject) => {
        function resCallback (res) {
            res.pipe(fs.createWriteStream(fileName)).on('close', resolve);
        }
        if (urlObj.protocol === "https:") {
            https.get(url, resCallback).end();
        } else {
            http.get(url, resCallback).end();
        }
    });
}

function readUrlToBuffer (url) {
    const urlObj = new URL(url);
    return new Promise((resolve, reject) => {
        let zipBuffer = [];
        function resCallback (res) {
            res.on('data', data => {
                zipBuffer.push(data);
            })
            .on('close', function () { // file fully downloaded
                // put the zip contents to a buffer 
                resolve(Buffer.concat(zipBuffer));
            });
        }

        if (urlObj.protocol === "https:") {
            https.get(url, resCallback).end();
        } else {
            http.get(url, resCallback).end();
        }
    })
}
