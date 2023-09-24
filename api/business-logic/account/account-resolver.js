const {BaseIdResolver, BatchJSONResolver} = require('../base-id-resolver')
const db = require('../../connectors/mongodb-connector')

class AccountResolver extends BaseIdResolver {
    constructor() {
        super(20000)
    }

    async searchByValue(network, filter) {
        const accounts = filter.filter(address => address[0] === 'G')
        const contracts = filter.filter(address => address[0] === 'C')
        const results = await Promise.all([
            accounts.length === 0 ? Promise.resolve([]) : AccountResolver.search(network, 'accounts', {address: {$in: accounts}}),
            contracts.length === 0 ? Promise.resolve([]) : AccountResolver.search(network, 'contracts', {address: {$in: contracts}})
        ])
        return results.flat()
    }

    async searchById(network, filter) {
        const accountIds = filter.filter(id => id < (1 << 30))
        const contractIds = filter.filter(id => id >= (1 << 30))
        const results = await Promise.all([
            accountIds.length === 0 ? Promise.resolve([]) : AccountResolver.search(network, 'accounts', {_id: {$in: accountIds}}),
            contractIds.length === 0 ? Promise.resolve([]) : AccountResolver.search(network, 'contracts', {_id: {$in: contractIds}})
        ])
        return results.flat()
    }

    static async search(network, collection, query) {
        const data = await db[network].collection(collection)
            .find(query)
            .project({_id: 1, address: 1})
            .toArray()
        return data.map(({_id, address}) => ({_id, value: address}))
    }

}

const accountResolver = new AccountResolver()

/**
 * @param {String} network
 * @param {String|[String]} address
 * @return {Promise<[Number]>}
 */
async function resolveAccountId(network, address) {
    return await accountResolver.resolveSingleId(network, address)
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

module.exports = {resolveAccountId, resolveAccountAddress, accountResolver, AccountAddressJSONResolver}