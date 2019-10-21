const pem = require('pem');
const settings = require('../../../settings.js');

function createKeyCertBundle (clientKey, certificate) {
    return new Promise((resolve, reject) => {
        pem.createPkcs12(
            clientKey,
            certificate,
            settings.securityOptions.passphrase,
            function (err, pkcs12) {
                if (err) {
                    return reject(err);
                }
                return resolve(pkcs12);
            }
        );
    });
}

/**
 * given a bundled key and cert, unpacks it back into its components
 * @param certBuffer - pkcs12 cert buffer
 * @returns {Promise} response is an object with cert, ca, and key. It is an expanded version of the pkcs cert.
 */
function readKeyCertBundle (certBuffer) {
    return new Promise((resolve, reject) => {
        pem.readPkcs12(certBuffer, { //unlock it with the settings password
            p12Password: settings.securityOptions.passphrase
        }, function (err, res) {
            if (err) {
                return reject(err);
            }
            return resolve(res);
        });
    });
}

//given a certificate, returns public information about it
function parseCertificate (cert) {
    return new Promise((resolve, reject) => {
        pem.readCertificateInfo(cert, function (err, res) {
            if (err) {
                return reject(err);
            }
            return resolve(res);
        });
    });
}

//given a key cert bundle, returns the expiration date of the cert
function extractExpirationDateBundle (keyCertBundle, callback) {
    readKeyCertBundle(keyCertBundle)
        .then(keyBundle => {
            return extractExpirationDateCertificate(keyBundle.cert, callback);
        });
}

//given a cert, returns the expiration date of the cert
function extractExpirationDateCertificate (certificate, callback) {
    parseCertificate(certificate)
        .then(certInfo => {
            callback(null, new Date(certInfo.validity.end));
        })
        .catch(err => {
            return callback(err);
        });
}

module.exports = {
    createKeyCertBundle: createKeyCertBundle,
    readKeyCertBundle: readKeyCertBundle,
    parseCertificate: parseCertificate,
    extractExpirationDateBundle: extractExpirationDateBundle,
    extractExpirationDateCertificate: extractExpirationDateCertificate,
}
