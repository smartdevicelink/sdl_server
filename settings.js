require('dotenv').config();

module.exports = {
    //name of the folder in the `databases` folder that you want to use as the module of
    //interfacing with a specific database. The entry point must be named index.js and implement the required functions
    dbModule: "postgres",
    dbUser: process.env.DB_USER || null,
    dbDatabase: process.env.DB_DATABASE || null,
    dbPassword: process.env.DB_PASSWORD || null,
    dbHost: process.env.DB_HOST || null,
    dbPort: process.env.DB_PORT || null,
    //name of the folder in the `loggers` folder that is used as the module of interfacing
    //with a loggin module. The entry point must be named index.js and implement the required functions
    loggerModule: process.env.LOG_MODULE || "winston",
    //name of the folder in the `cache` folder that is used as the module for interfacing
    //with a cache module. The entry point must be named index.js and implement the required functions
    cacheModule: process.env.CACHE_MODULE || null,
    cacheModulePort: process.env.CACHE_PORT,
    cacheModuleHost: process.env.CACHE_HOST,
    cacheModulePassword: process.env.CACHE_PASSWORD,
    // SMTP email server settings
    smtp: {
        host: process.env.SMTP_HOST || null,
        port: parseInt(process.env.SMTP_PORT) || 25,
        username: process.env.SMTP_USERNAME || null,
        password: process.env.SMTP_PASSWORD || null,
        from: process.env.SMTP_FROM || null
    },
    notification: {
        appsPendingReview: {
            email: {
                frequency: (process.env.NOTIFY_APP_REVIEW_FREQUENCY || "DISABLED").toUpperCase(), // enum: "DISABLED", "REALTIME"
                to: process.env.NOTIFY_APP_REVIEW_EMAILS || "" // e.g. "person1@oem.com,person2@oem.com,person3@oem.com"
            }
        }
    },
    //the fully qualified hostname of this Policy Server (e.g. "policyserver.vehicleoem.com")
    policyServerHost: process.env.POLICY_SERVER_HOST || "localhost",
    //the port this server will be running in
    policyServerPort: process.env.POLICY_SERVER_PORT || 3000,
    //the SSL certificate files and secure port to listen for secure connections with
    //files should be stored in ./customizable/ssl
    ssl: {
        privateKeyFilename: process.env.SSL_PRIVATE_KEY_FILENAME || null,
        certificateFilename: process.env.SSL_CERTIFICATE_FILENAME || null,
        policyServerPort: process.env.POLICY_SERVER_PORT_SSL || null, // typically 443
    },
    certificateAuthority: {
        authorityKeyFileName: process.env.CA_PRIVATE_KEY_FILENAME || null,
        authorityCertFileName: process.env.CA_CERTIFICATE_FILENAME || null,
    },
    securityOptions: {
        passphrase: process.env.CERTIFICATE_PASSPHRASE || null,
        privateKey: {
            keyBitsize: process.env.PRIVATE_KEY_BITSIZE || 2048,
            cipher: process.env.PRIVATE_KEY_CIPHER || "des3",
        },
        certificate: {
            country: process.env.CERTIFICATE_COUNTRY || null,
            state: process.env.CERTIFICATE_STATE || null,
            locality: process.env.CERTIFICATE_LOCALITY || null,
            organization: process.env.CERTIFICATE_ORGANIZATION || null,
            organizationUnit: process.env.CERTIFICATE_ORGANIZATION_UNIT || null,
            commonName: process.env.CERTIFICATE_COMMON_NAME || null,
            emailAddress: process.env.CERTIFICATE_EMAIL_ADDRESS || null,
            hash: process.env.CERTIFICATE_HASH || null,
            days: process.env.CERTIFICATE_DAYS || 7,
        },
        //whether to package the module config's cert and private key into a pkcs12 bundle string using the passphrase
        //if false, it will just be a concatenation of the certificate and the private key
        moduleConfigEncryptCertBundle: process.env.MODULE_CONFIG_ENCRYPT_CERT_BUNDLE == "true" ? true : false
    },
    //what kind of auth to enforce? "basic" or null (no authentication)
    authType: process.env.AUTH_TYPE || null,
    //an optional password users must enter to access the Policy Server interface when paired with "basic" authType
    basicAuthPassword: process.env.BASIC_AUTH_PASSWORD || null,
    //whether or not to auto-approve all app versions received by SHAID (unless specifically blacklisted)
    autoApproveAllApps: process.env.AUTO_APPROVE_ALL_APPS == "true" ? true : false,
    //whether or not to require encryption for all auto-approved apps
    autoApproveSetRPCEncryption: process.env.ENCRYPTION_REQUIRED == "true" ? true : false,
    //credentials for using the SHAID API
    shaidPublicKey: process.env.SHAID_PUBLIC_KEY,
    shaidSecretKey: process.env.SHAID_SECRET_KEY,
    //the location of the RPC specification in order to retrieve an up-to-date language list
    rpcSpecXmlUrl: 'https://raw.githubusercontent.com/smartdevicelink/rpc_spec/master/MOBILE_API.xml'
}
