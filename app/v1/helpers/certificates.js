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

/**
 *
 * @param certificate Certificate to check expiration on.
 * @param cb returns (err, isExpired)
 */
function isCertificateExpired(certificate, cb) {
    parseCertificate(certificate)
        .then(certInfo => {
            const expirationDate = certInfo.validity.end;
            //expirationDate is less than now then it is expired
            cb(null, expirationDate < Date.now());
        })
        .catch(err => {
            return cb(err);
        });
}

module.exports = {
    createKeyCertBundle: createKeyCertBundle,
    readKeyCertBundle: readKeyCertBundle,
    parseCertificate: parseCertificate,
    isCertificateExpired: isCertificateExpired,
}
