const {BaseIdResolver, BatchJSONResolver} = require('../base-id-resolver'),
    db = require('../../connectors/mongodb-connector')

class AccountResolver extends BaseIdResolver {
    constructor() {
        super(20000)
    }

    async search(network, query) {
        const data = await db[network].collection('accounts')
            .find(query)
            .project({_id: 1, address: 1})
            .toArray()
        return data.map(({_id, address}) => ({_id, value: address}))
    }

    async searchByValue(network, filter) {
        return this.search(network, {address: {$in: filter}})
    }

    async searchById(network, filter) {
        return this.search(network, {_id: {$in: filter}})
    }
}

const accountResolver = new AccountResolver()

/**
 * @param {String} network
 * @param {String|[String]} accountAddress
 * @return {Promise<[Number]>}
 */
async function resolveAccountId(network, accountAddress) {
    return await accountResolver.resolveSingleId(network, accountAddress)
}

/**
 * @param {String} network
 * @param {Number|[Number]} accountId
 * @return {Promise<[String]>}
 */
async function resolveAccountAddress(network, accountId) {
    return await accountResolver.resolveSingleValue(network, accountId)
}

class AccountAddressJSONResolver extends BatchJSONResolver {
    constructor(network) {
        super(accountResolver, network)
    }
}

module.exports = {resolveAccountId, resolveAccountAddress, AccountAddressJSONResolver}