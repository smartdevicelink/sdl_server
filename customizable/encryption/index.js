// skeleton functions for customized encryption

// synchronous function for encrypting a policy table.
// encryption only affects responses to Core, not to UI Policy Table previews
exports.encryptPolicyTable = function(policy_table){
    // optionally put encryption logic here
    return policy_table;
}

// synchronous function for decrypting a policy table.
exports.decryptPolicyTable = function(policy_table){
    // optionally put decryption logic here
    return policy_table;
}