const app = require('../app');
const db = app.locals.db;
const hashify = app.locals.hashify;
const arrayify = app.locals.arrayify;
const log = app.locals.log;
const sql = require('./sql.js');
const emails = require('../helpers/emails.js');
const certificates = require('../certificates/controller.js');
const certUtil = require('../helpers/certificates.js');
const webengineHandler = require('../../../customizable/webengine-bundle');
const Url = require('url').URL;
const promisify = require('util').promisify;

//takes SQL data and converts it into a response for the UI to consume
async function constructFullAppObjs (res) {
    //hash the below data for fast access later
    const hashedCategories = hashify({}, res.appCategories, elem => ({
        location: [elem.id],
        data: elem.display_name
    }));
    const hashedAutoApproval = hashify({}, res.appAutoApprovals, elem => ({
        location: [elem.app_uuid],
        data: true
    }));
    const hashedBlacklist = hashify({}, res.appBlacklist, elem => ({
        location: [elem.app_uuid],
        data: true
    }));
    const hashedAdministratorApps = hashify({}, res.appAdministrators, elem => ({
        location: [elem.app_uuid],
        data: true
    }));
    const hashedHybridPreference = hashify({}, res.appHybridPreference, elem => ({
        location: [elem.app_uuid],
        data: elem.hybrid_preference
    }));
    const hashedPassthrough = hashify({}, res.appPassthrough, elem => ({
        location: [elem.app_uuid],
        data: true
    }));
    // app services
    const hashedServices = {};

    hashify(hashedServices, res.appServiceTypes, elem => ({
        location: [elem.app_id, elem.service_type_name],
        data: obj => {
            obj.name = elem.service_type_name,
            obj.display_name = elem.display_name,
            obj.service_names = [],
            obj.permissions = []
        }
    }));
    hashify(hashedServices, res.appServiceTypeNames, elem => ({
        location: [elem.app_id, elem.service_type_name, "service_names"],
        data: arr => arr.push(elem.service_name)
    }));
    //filter out appServiceTypePermissions of elements that don't exist in hashedServices
    const filteredASTP = res.appServiceTypePermissions.filter(astp => {
        return (hashedServices[astp.app_id] !== undefined &&
                hashedServices[astp.app_id][astp.service_type_name] !== undefined)
    });

    hashify(hashedServices, filteredASTP, elem => ({
        location: [elem.app_id, elem.service_type_name, "permissions"],
        data: arr => arr.push({
            "app_id": elem.app_id,
            "function_id": elem.function_id,
            "display_name": elem.display_name,
            "name": elem.name,
            "is_selected": elem.is_selected
        })
    }));

    const hashedApps = hashify({}, res.appBase, appInfo => ({
        location: [appInfo.id],
        data: obj => {
            Object.assign(obj, appInfo) //move properties from appInfo into obj
            obj.uuid = appInfo.app_uuid;
            delete obj.app_uuid;
            obj.short_uuid = appInfo.app_short_uuid;
            delete obj.app_short_uuid;
            obj.category = {
                id: appInfo.category_id,
                display_name: hashedCategories[appInfo.category_id]
            }
            obj.is_auto_approved_enabled = !!hashedAutoApproval[appInfo.app_uuid]; //coerce to boolean
            obj.is_blacklisted = !!hashedBlacklist[appInfo.app_uuid]; //coerce to boolean
            obj.is_administrator_app = !!hashedAdministratorApps[appInfo.app_uuid]; //coerce to boolean
            obj.hybrid_app_preference = hashedHybridPreference[appInfo.app_uuid] || "BOTH";
            obj.allow_unknown_rpc_passthrough = !!hashedPassthrough[appInfo.app_uuid]; //coerce to boolean
            obj.countries = [];
            obj.display_names = [];
            obj.permissions = [];
            obj.categories = [];
            obj.services = arrayify(hashedServices, [appInfo.id]); //services should be an array
            obj.description = appInfo.description;
        }
    }));

    // categories
    hashify(hashedApps, res.appAllCategories, elem => ({
        location: [elem.id, "categories"],
        data: arr => arr.push({
            id: elem.category_id,
            display_name: elem.display_name
        })
    }))
    // countries
    hashify(hashedApps, res.appCountries, elem => ({
        location: [elem.id, "countries"],
        data: arr => arr.push({
            iso: elem.country_iso,
            name: elem.name
        })
    }))
    // display names
    hashify(hashedApps, res.appDisplayNames, elem => ({
        location: [elem.id, "display_names"],
        data: arr => arr.push(elem.display_text)
    }))
    // permissions
    hashify(hashedApps, res.appPermissions, elem => ({
        location: [elem.id, "permissions"],
        data: arr => arr.push({
            key: elem.permission_name,
            hmi_level: elem.hmi_level,
            type: elem.type
        })
    }))

    //convert the hash back to an array!
    let fullApps = [];
    for (let id in hashedApps) {
        fullApps.push(hashedApps[id]);
    }

    return fullApps;
}


//store the information using a SQL transaction
async function storeApp (notifyOEM, appObj) {
    // process message groups synchronously (due to the SQL transaction)
    return await db.asyncTransaction(async client => {
        //stage 1: insert app info
        const storedApp = await client.getOne(sql.insertAppInfo(appObj));
        //stage 2: insert countries, display names, permissions, app auto approvals, and certificates if enabled
        log.info("New/updated app " + storedApp.app_uuid + " added to the database");

        const allInserts = [];
        if (appObj.countries.length > 0) {
            allInserts.push(sql.insertAppCountries(appObj.countries, storedApp.id));
        }
        if (appObj.display_names.length > 0) {
            allInserts.push(sql.insertAppDisplayNames(appObj.display_names, storedApp.id));
        }
        if (appObj.permissions.length > 0) {
            allInserts.push(sql.insertAppPermissions(appObj.permissions, storedApp.id));
        }
        if (appObj.services.length > 0) {
            allInserts.push(sql.insertAppServices(appObj.services, storedApp.id));
            allInserts.push(sql.insertAppServiceNames(appObj.services, storedApp.id));
            allInserts.push(sql.insertStandardAppServicePermissions(appObj.services, storedApp.id));
        }
        if (appObj.is_auto_approved_enabled) {
            allInserts.push(sql.insertAppAutoApproval(appObj));
        }
        if (appObj.categories.length > 0) {
            allInserts.push(sql.insertAppCategories(appObj.categories, storedApp.id));
        }

        //generate app certificate if cert generation is enabled
        if (certificates.openSSLEnabled) {
            //perform a cert check
            const data = await client.getOne(sql.getApp.certificate(storedApp.app_uuid));
            const shouldCreateCert = !data;

            if (shouldCreateCert) {
                //no cert exists. make one
                log.info("Updating certificate of " + storedApp.app_uuid);
                const cert = await certificates.asyncCreateCertificate({
                    serialNumber: storedApp.app_uuid
                });
                const keyCertBundle = await certUtil.createKeyCertBundle(cert.clientKey, cert.certificate);
                //add the cert as part of the inserts
                const expirationDate = await certUtil.extractExpirationDateBundle(keyCertBundle.pkcs12);
                const insertObj = {
                    app_uuid: storedApp.app_uuid,
                    certificate: keyCertBundle.pkcs12.toString('base64'),
                    expirationDate: expirationDate
                }
                allInserts.push(sql.updateAppCertificate(insertObj));
            } //cert exists. let the cron update the cert if it's nearing expiration
        }

        //execute all the sql statements
        for (const insert of allInserts) {
            await client.getOne(insert);
        }

        //stage 3: locales insert. this is a multi step process so it needs its own flow
        if (!appObj.locales || appObj.locales.length === 0) {
            // no locales. skip
        } else {
            // attempt locale and tts chunks insert
            await Promise.all(appObj.locales.map(insertLocaleInfo));
            async function insertLocaleInfo (localeInfo) {
                const localeResult = await client.getOne(sql.insertAppLocale(localeInfo, storedApp.id));
                // continue with inserting ttschunks after retreiving the returned id
                // use the passed in locales 
                if (localeInfo.tts_chunks.length === 0) {
                    // no tts chunks to process
                } else {
                    await client.getOne(sql.insertAppLocaleTtsChunks(localeInfo.tts_chunks, localeResult.id));
                }
            }
        }
        //stage 4: call custom routine to get the byte size of the bundle at the package url if it exists
        if (appObj.transport_type === 'webengine' && appObj.package_url) {
            const data = await promisify(webengineHandler.handleBundle)(appObj.package_url);

            if (!data) {
                return new Error('No object returned for the webengine bundle for uuid ' + appObj.uuid);
            }
            if (!data.url) {
                return new Error('No url property for the webengine bundle for uuid ' + appObj.uuid);
            }
            if (!data.size_compressed_bytes) {
                return new Error('No size_compressed_bytes property for the webengine bundle for uuid ' + appObj.uuid);
            }
            if (!data.size_decompressed_bytes) {
                return new Error('No size_decompressed_bytes property for the webengine bundle for uuid ' + appObj.uuid);
            }
            // store the returned results of the custom webengine bundle handler function
            await client.getOne(sql.updateWebengineBundleInfo(storedApp.id, data));
        }
        //stage 5: sync with shaid
        if(!storedApp.version_id){
            // skip sync with SHAID if no app version ID is present
        } else {
            await app.locals.shaid.setApplicationApprovalVendor([storedApp]);
        }
        //stage 6: notify OEM of pending app?
        if(!(
            notifyOEM
            && app.locals.emailer.isSmtpConfigured()
            && storedApp.approval_status == 'PENDING'
            && app.locals.config.notification.appsPendingReview.email.frequency == "REALTIME"
            && app.locals.config.notification.appsPendingReview.email.to
        )){
            // don't send email
        } else {
            // attempt to send email
            app.locals.emailer.send({
                to: app.locals.config.notification.appsPendingReview.email.to,
                subject: "SDL App Pending Review",
                html: emails.populate(emails.template.appPendingReview, {
                    action_url: app.locals.baseUrl + "/applications/" + storedApp.id,
                    app_name: storedApp.name
                })
            });
        }

        return appObj.uuid;
    });
}

//given an app uuid and pkcs12 bundle, stores their relation in the database
async function updateAppCertificate (uuid, keyCertBundle) {
    const expirationDate = await certUtil.extractExpirationDateBundle(keyCertBundle.pkcs12);
    
    const insertObj = {
        app_uuid: uuid,
        certificate: keyCertBundle.pkcs12.toString('base64'),
        expirationDate: expirationDate
    }

    await db.asyncSql(sql.updateAppCertificate(insertObj));
}

async function getExpiredCerts () {
    return await db.asyncSql(sql.getApp.allExpiredCertificates());
}

module.exports = {
    constructFullAppObjs: constructFullAppObjs,
    storeApp: storeApp,
    updateAppCertificate: updateAppCertificate,
    getExpiredCerts: getExpiredCerts
}
