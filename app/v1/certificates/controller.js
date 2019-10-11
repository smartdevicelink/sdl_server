const async = require('async');
const pem = require('pem');
const fs = require('fs');
const logger = require('../../../custom/loggers/winston/index');
const settings = require('../../../settings.js');
const tmp = require('tmp');
const { spawnSync } = require('child_process');
const forge = require('node-forge');

const authorityKey = (fs.existsSync(__dirname + '/../../../customizable/ssl/' + settings.certificateAuthority.authorityKeyFileName)) ? 
    //file exists
    fs.readFileSync(__dirname + '/../../../customizable/ssl/' + settings.certificateAuthority.authorityKeyFileName).toString() : 
    //file does not exist
    null;
const authorityCertificate = (fs.existsSync(__dirname + '/../../../customizable/ssl/' + settings.certificateAuthority.authorityCertFileName)) ? 
    //file exists
    fs.readFileSync(__dirname + '/../../../customizable/ssl/' + settings.certificateAuthority.authorityCertFileName).toString() : 
    //file does not exist
    null;

const csrConfigIsValid = fs.existsSync(settings.securityOptions.certificate.csrConfigFile);

const openSSLEnabled = authorityKey && authorityCertificate && csrConfigIsValid && settings.securityOptions.passphrase;

function checkAuthorityValidity(cb){
    pem.createPkcs12(
        authorityKey, 
        authorityCertificate, 
        settings.certificateAuthority.passphrase, 
        {
            cipher: 'aes128',
            clientKeyPassword: settings.certificateAuthority.passphrase
        }, 
        function(err, pkcs12){
            cb((err) ? false : true);
        }
    );
}

function createPrivateKey(req, res, next){
    if(openSSLEnabled){
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
        csrConfigFile: settings.securityOptions.certificate.csrConfigFile,
        serialNumber: options.app_uuid,
    };
}

function createCertificate(req, res, next){
    if(openSSLEnabled){
        let options = req.body.options || {};
        createCertificateFlow(options, function(err, results){
            if(err){
                logger.error(err);
                return res.parcel.setStatus(400)
                    .setData(err)
                    .deliver();
            }
            return res.parcel.setStatus(200)
                .setData(results)
                .deliver();
        });
    } else {
        res.parcel.setStatus(400)
            .setMessage('Security options have not been properly configured')
            .deliver();
    }
}

function createCertificateFlow(options, next){
    if(openSSLEnabled){
        options.serviceKey = authorityKey;
        options.serviceCertificate = authorityCertificate;
        options.serviceKeyPassword = settings.securityOptions.passphrase;
        let tasks = [];
        if(csrConfigIsValid){
            logger.info("using csr config file");
            tasks.push(function(cb){
                writeCSRConfigFile(getCertificateOptions(options), cb);
            });
        }

        //private key exists
        if(options.clientKey){
            tasks.push(function(csrOptions, cb){
                pem.createCSR(csrOptions, function(err, csr){
                    cb(err, csrOptions, csr);
                });
            });
        //private key does not exist
        } else {
            tasks.push(function(csrOptions, cb){
                options = getKeyOptions(options);
                pem.createPrivateKey(options.keyBitsize, options, function(err, key){
                    cb(err, csrOptions, key);
                });
            });
            tasks.push(function(csrOptions, privateKey, cb){
                csrOptions.clientKey = privateKey.key;
                pem.createCSR(csrOptions, function(err, csr){
                    cb(err, csrOptions, csr);
                });
            });
        }
        tasks.push(function(csrOptions, csr, cb){
            csrOptions.csr = csr.csr;
            pem.createCertificate(csrOptions, function(err, certificate){
                cb(err, certificate);
            });
        });
        async.waterfall(tasks, next);
    } else {
        next('Security options have not been properly configured');
    }
}

function createPkcs12(clientKey, certificate, cb){
    if(openSSLEnabled){
        if((!clientKey || clientKey.length == 0) &&
            (!certificate || certificate.length == 0)){
            cb(null, null);
            return;
        }
        pem.createPkcs12(clientKey, 
            certificate, 
            settings.securityOptions.passphrase, 
            function(err, pkcs12){
                return cb(err, err ? null : pkcs12.pkcs12.toString('base64'));
            }
        );
    } else {
        res.parcel.setStatus(400)
            .setMessage('Security options have not been properly configured')
            .deliver();
    }
}

function writeCSRConfigFile(options, cb){
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
    fs.writeFile(
        settings.securityOptions.certificate.csrConfigFile, 
        csrConfig, 
        function(err){
            cb(err, options);
        }
    );
}

module.exports = {
    authorityKey: authorityKey,
    authorityCertificate: authorityCertificate,
    csrConfigIsValid: csrConfigIsValid,
    createPrivateKey: createPrivateKey,
    createCertificate: createCertificate,
    createCertificateFlow: createCertificateFlow,
    createPkcs12: createPkcs12,
    checkAuthorityValidity: checkAuthorityValidity,
    getKeyOptions: getKeyOptions,
    getCertificateOptions: getCertificateOptions,
    openSSLEnabled: openSSLEnabled,
}