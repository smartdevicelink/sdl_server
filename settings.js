module.exports = {
    //name of the folder in the `databases` folder that you want to use as the module of
    //interfacing with a specific database. The entry point must be named index.js and implement the required functions
    dbModule: "postgres",
    //name of the folder in the `loggers` folder that is used as the module of interfacing
    //with a loggin module. The entry point must be named index.js and implement the required functions
    loggerModule: "winston",
    //the fully qualified hostname of this Policy Server (e.g. "policyserver.vehicleoem.com")
    policyServerHost: process.env.POLICY_SERVER_HOST || "localhost",
    //the port this server will be running in
    policyServerPort: process.env.POLICY_SERVER_PORT || 3000,
    //what kind of auth to enforce? "basic" or null (no authentication)
    authType: process.env.AUTH_TYPE || null,
    //an optional password users must enter to access the Policy Server interface when paired with "basic" authType
    basicAuthPassword: process.env.BASIC_AUTH_PASSWORD || null,
    //credentials for using the SHAID API
    shaidPublicKey: process.env.SHAID_PUBLIC_KEY,
    shaidSecretKey: process.env.SHAID_SECRET_KEY,
    //the location of the RPC specification in order to retrieve an up-to-date language list
    githubLanguageSourceUrl: 'https://raw.githubusercontent.com/smartdevicelink/rpc_spec/master/MOBILE_API.xml'
}