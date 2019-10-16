const pem = require('pem');
const settings = require('../../../settings.js');

function createKeyCertBundle (clientKey, certificate) {
    return new Promise((resolve, reject) => {
        pem.createPkcs12(
            clientKey, 
            certificate, 
            settings.certificateAuthority.passphrase, 
            function (err, pkcs12) {
                if (err) {
                    return reject(err);
                }
                return resolve(pkcs12);         
            }
        );
    });
}

//given a bundled key and cert, unpacks it back into its components
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

module.exports = {
    createKeyCertBundle: createKeyCertBundle,
    readKeyCertBundle: readKeyCertBundle,
    parseCertificate: parseCertificate,
}