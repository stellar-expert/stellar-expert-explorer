const {FederationServer} = require('stellar-sdk')

async function resolveFederationAccountAddress(value) {
    if (/^\S+\*\S.+\.\S+$/g.test(value)) {
        try {
            const {account_id} = await FederationServer.resolve(value)
            return account_id
        } catch (e) {
        }
    }
    return value
}

module.exports = {resolveFederationAccountAddress}