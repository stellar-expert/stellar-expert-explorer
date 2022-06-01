const directoryTags = [{
    name: 'exchange',
    description: 'Centralized exchange account'
}, {
    name: 'anchor',
    description: 'Operational account of an anchor'
}, {
    name: 'issuer',
    description: 'Well known asset issuer account'
}, {
    name: 'wallet',
    description: 'Shared account that belongs to a wallet'
}, {
    name: 'custodian',
    description: 'Reserved, custodian account, or cold wallet'
}, {
    name: 'malicious',
    description: 'Account involved in theft/scam/spam/phishing'
}, {
    name: 'unsafe',
    description: 'Obsolete or potentially dangerous account'
}, {
    name: 'personal',
    description: 'Personal signing key or account address'
}, {
    name: 'sdf',
    description: 'Account under the custody of SDF'
}, {
    name: 'memo-required',
    description: 'Destination requires transaction memo'
}, {
    name: 'airdrop',
    description: 'Airdrop distribution account'
}, {
    name: 'obsolete-inflation-pool',
    description: 'Inflation pool distribution account (obsolete)'
}]

module.exports = directoryTags