# Security
For your convenience, we have implemented the following security features into the Policy Server.

### HTTPS Connections (SSL/TLS)
HTTPS connections (disabled by default) can be enabled by doing the following:
* Store your SSL Certificate and Private Key files in the `./customizable/ssl` directory
* Set your `POLICY_SERVER_PORT_SSL` environment variable to your desired secure port (typically 443)
* Set your `SSL_CERTIFICATE_FILENAME` environment variable to the filename of your SSL Certificate file
* Set your `SSL_PRIVATE_KEY_FILENAME` environment variable to the filename of your Private Key file
* If  you are unable to modify your environment variables, you may define these settings in the `./settings.js` configuration file
* Restart your Policy Server and navigate to your server's hostname on the secure port!

### Basic Authentication
You may optionally require your Policy Server administrators to enter a password before being able to access the user interface. We recommend using a more secure method of authentication in accordance to your company's IT security standards, but provide this basic authentication feature for convenience.

By default, basic authentication is disabled. To enable it, simply set your `AUTH_TYPE` environment variable to `basic` and your `BASIC_AUTH_PASSWORD` environment variable to a password of your choice, then restart your Policy Server. If you are unable to modify your environment variables, you may define these settings in the `./settings.js` configuration file.

![Basic Authentication](./assets/Basic-Auth-Login.png)

### Policy Table Encryption
You may wish to encrypt your Policy Table when in transit to/from SDL Core. To achieve this, we've implemented skeleton methods to house your custom encryption logic. The Policy Table JSON object (array) is passed to these methods so you can run encryption and decryption transformations against it. By default, these methods perform no transformations.

The customizable Policy Table skeleton `encryptPolicyTable` and `decryptPolicyTable` methods are located in the Policy Server project at the following file path: `./customizable/encryption/index.js`

If you modify this skeleton method to implement Policy Table encryption on your Policy Server, you will also need to implement corresponding cryptography logic via the `crypt` and `decrypt` methods in your build of SDL Core. These methods are available in the `sample_policy_manager.py` [file](https://github.com/smartdevicelink/sdl_core/blob/master/src/appMain/sample_policy_manager.py#L45) of SDL Core.

### Configurable SSL Key and Certificate Creation
If you are attempting to use encrypted RPCs with SDL Core, you will need to have certificates for both Core and the Mobile Proxy. Generating these certificates can be done on your own or via the Policy Server UI. The Policy Server uses a wrapper for OpenSSL to provide the same options that would normally be provided when directly dealing with OpenSSL.

## Prerequisites
OpenSSL version 1.1.0+ must be installed. The source files can be found [here](https://www.openssl.org/source/) along with instructions for installation.

Once OpenSSL is properly installed, you'll need to take the necessary steps to establish a certificate authority. The CA will be responsible for signing all certificates created by the policy server. This can be done by simply entering the following two commands into any terminal:
| Command | Explanation|
|---------|------------|
|openssl genrsa -out CA.key 2048| This creates a 2048 bit RSA private key and saves it in the file "CA.key". It will later be used for signing certificates.|
|openssl req -x509 -new -nodes -key CA.key -sa256 -days 3650 -out CA.pem| This creates a certificate in the file name "CA.pem" that will be used in the creation of additional certificates. It is set to expire after 10 years. OpenSSL will then prompt you for further information.|

The CA files will then need to be relocated to the `./customizable/ssl` folder and their file names will need to be specified in the `.env` file.
To know if this process was successful and if your policy server is now capable of generating keys and certificates, check the About page to see if certificate generation is enabled.

There is an empty `csr.cfg` in the `./customizable/ssl` folder. The contents of this folder don't matter as the file will be filled by the policy server with each certificate that is generated.

## Retrieving the Certificates
SDL_Core's certificate is stored in the module_config of the policy table and is updated via a Policy Table Update. For an app to update its certificate, it must make either a `GET` or `POST` request to the `/applications/certificate/get` endpoint. See the API documentation for more details.