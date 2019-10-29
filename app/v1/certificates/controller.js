const async = require('async');
const pem = require('pem');
const fs = require('fs');
const tmp = require('tmp');
const logger = require('../../../custom/loggers/winston/index');
const settings = require('../../../settings.js');
const CA_DIR_PREFIX = __dirname + '/../../../customizable/ca/';

const authorityKey = (fs.existsSync(CA_DIR_PREFIX + settings.certificateAuthority.authorityKeyFileName)) ?
    //file exists
    fs.readFileSync(CA_DIR_PREFIX + settings.certificateAuthority.authorityKeyFileName).toString() :
    //file does not exist
    null;
const authorityCertificate = (fs.existsSync(CA_DIR_PREFIX + settings.certificateAuthority.authorityCertFileName)) ?
    //file exists
    fs.readFileSync(CA_DIR_PREFIX + settings.certificateAuthority.authorityCertFileName).toString() :
    //file does not exist
    null;

const openSSLEnabled = authorityKey && authorityCertificate
    && settings.securityOptions.passphrase && settings.securityOptions.certificate.commonName;

function checkAuthorityValidity (cb){
    if (!openSSLEnabled) {
        return cb(false);
    }
    pem.createPkcs12(
        authorityKey,
        authorityCertificate,
        settings.securityOptions.passphrase,
        {
            cipher: 'aes128',
            clientKeyPassword: settings.securityOptions.passphrase
        },
        function(err, pkcs12){
            cb((err) ? false : true);
        }
    );
}

function createPrivateKey(req, res, next){
    if (openSSLEnabled) {
        let options = getKeyOptions(req.body.options);
        pem.createPrivateKey(
            options.keyBitsize,
            options,
            function(err, privateKey){
                if(err){
                    return res.parcel.setStatus(400)
                        .setData(err)
                        .deliver();
                }
                return res.parcel.setStatus(200)
                    .setData(privateKey.key)
                    .deliver();
            }
        );
    } else {
        res.parcel.setStatus(400)
            .setMessage('Security options have not been properly configured')
            .deliver();
    }
}

function getKeyOptions(options = {}){
    return {
        keyBitsize: options.keyBitsize || settings.securityOptions.privateKey.keyBitsize,
        cipher: options.cipher || settings.securityOptions.privateKey.cipher,
    };
}

function getCertificateOptions(options = {}){
    return {
        serviceCertificate: authorityCertificate,
        serviceKey: authorityKey,
        serviceKeyPassword: settings.securityOptions.passphrase,
        clientKey: options.clientKey,
        keyBitsize: options.keyBitsize || settings.securityOptions.privateKey.keyBitsize,
        country: options.country || settings.securityOptions.certificate.country,
        state: options.state || settings.securityOptions.certificate.state,
        locality: options.locality || settings.securityOptions.certificate.locality,
        organization: options.organization || settings.securityOptions.certificate.organization,
        organizationUnit: options.organizationUnit || settings.securityOptions.certificate.organizationUnit,
        commonName: options.commonName || settings.securityOptions.certificate.commonName,
        emailAddress: options.emailAddress || settings.securityOptions.certificate.emailAddress,
        hash: settings.securityOptions.certificate.hash,
        days: options.days || settings.securityOptions.certificate.days,
        serialNumber: options.serialNumber,
        csrConfigFile: options.csrConfigFile,
    };
}

function createCertificate(req, res, next){
    if (openSSLEnabled) {
        let options = req.body.options || {};
        createCertificateFlow(options, function(err, certificate){
            if(err){
                logger.error(err);
                return res.parcel.setStatus(400)
                    .setData(err)
                    .deliver();
            }
            return res.parcel.setStatus(200)
                .setData(certificate)
                .deliver();
        });
    } else {
        res.parcel.setStatus(400)
            .setMessage('Security options have not been properly configured')
            .deliver();
    }
}

function createCertificateFlow(options, next){
    if (openSSLEnabled) {
        options.serviceKey = authorityKey;
        options.serviceCertificate = authorityCertificate;
        options.serviceKeyPassword = settings.securityOptions.passphrase;
        let tasks = [];

        let csrOptions = getCertificateOptions(options);
        let keyOptions = getKeyOptions(options);

        //no client key so create one first
        if (!csrOptions.clientKey)
        {
            tasks.push(function(cb){
                pem.createPrivateKey(keyOptions.keyBitsize, keyOptions, function(err, key){
                    csrOptions.clientKey = key.key;
                    cb(err);
                });
            });
        }

        //write the CSR file for the pem module to use when generating the certificate
        tasks.push(function(cb){
            writeCSRConfigFile(csrOptions, cb);
        });

        //create new csr using passed in key or newly generated one.
        tasks.push(function(csrFilePath, doneReadingFile, cb){
            csrOptions.csrConfigFile = csrFilePath;
            pem.createCSR(csrOptions, function(err, csr){
                doneReadingFile();
                cb(err, csr);
            });
        });

        //finally add the csr and create the certificate.
        tasks.push(function(csr, cb){
            csrOptions.csr = csr.csr;
            pem.createCertificate(csrOptions, function(err, certificate){
                cb(err, certificate);
            });
        });

        //returns err,certificate
        async.waterfall(tasks, next);
    } else {
        next('Security options have not been properly configured');
    }
}

function writeCSRConfigFile (options, cb){
    let csrConfig = '# OpenSSL configuration file for creating a CSR for an app certificate\n' +
        '[req]\n' +
        'distinguished_name = req_distinguished_name\n' +
        'prompt = no\n' +
        '[ req_distinguished_name ]\n';
    
    if(options.country){
        csrConfig += 'C = ' + options.country + '\n';
    }
    if(options.state){
        csrConfig += 'ST = ' + options.state + '\n';
    }
    if(options.locality){
        csrConfig += 'L = ' + options.locality + '\n';
    }
    if(options.organization){
        csrConfig += 'O = ' + options.organization + '\n';
    }
    if(options.organizationUnit){
        csrConfig += 'OU = ' + options.organizationUnit + '\n';
    }
    if(options.commonName){
        csrConfig += 'CN = ' + options.commonName + '\n';
    }
    if(options.emailAddress){
        csrConfig += 'emailAddress = ' + options.emailAddress + '\n';
    }

    // all app certificates MUST have the SUBJECT serial number equal to its app_uuid that core will recognize it as
    if(options.serialNumber){
        csrConfig += 'serialNumber = ' + options.serialNumber;
    }

    //store the contents in a file for a moment for the pem module to read from
    tmp.file(function (err, path, fd, done) {
        if (err) {
            return cb(err);
        }

        fs.writeFile(
            path,
            csrConfig, 
            function (err) {
                cb(err, path, done);
            }
        );
    });
}

module.exports = {
    authorityKey: authorityKey,
    authorityCertificate: authorityCertificate,
    createPrivateKey: createPrivateKey,
    createCertificate: createCertificate,
    createCertificateFlow: createCertificateFlow,
    checkAuthorityValidity: checkAuthorityValidity,
    getKeyOptions: getKeyOptions,
    getCertificateOptions: getCertificateOptions,
    openSSLEnabled: openSSLEnabled,
}
