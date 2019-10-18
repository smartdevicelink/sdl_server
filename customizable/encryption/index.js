// skeleton functions for customized encryption

// asynchronous function for encrypting a policy table.
// encryption only affects responses to Core, not to UI Policy Table previews
exports.encryptPolicyTable = function(isProduction, policy_table, cb){
    cb(policy_table)
}

// asynchronous function for decrypting a policy table.
exports.decryptPolicyTable = function(policies, isProduction, cb){
    cb(policies);
}