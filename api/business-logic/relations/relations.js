const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')
const {resolveAccountId, AccountAddressJSONResolver} = require('../account/account-resolver')
const {AssetJSONResolver} = require('../asset/asset-resolver')
const {preparePagedData, normalizeOrder, normalizeLimit} = require('../api-helpers')
const {validateNetwork, validateAccountAddress} = require('../validators')
const errors = require('../errors')

async function queryAccountRelations(network, account, basePath, {order, cursor, limit}) {
    validateNetwork(network)
    validateAccountAddress(account)

    const accountId = await resolveAccountId(network, account)
    if (accountId === null)
        throw errors.validationError('account', `Account ${account} not found on the ledger`)

    limit = normalizeLimit(limit)
    let query = {accounts: accountId}

    if (cursor) {
        const parsedCursor = parseCursor(cursor)
        query = {
            $and: [
                query,
                {
                    $or: [
                        {
                            weight: {$lt: parsedCursor.weight}
                        },
                        {
                            weight: parsedCursor.weight,
                            _id: {$gt: parsedCursor.id}
                        }]
                }]
        }
    }

    const records = await db[network].collection('relations')
        .find(query, {sort: {weight: -1, _id: 1}, limit})
        .toArray()

    const accountResolver = new AccountAddressJSONResolver(network)
    const assetResolver = new AssetJSONResolver(network)

    const rows = records.map(record => {
        const {_id, accounts, type, created, updated, ft, bt, weight} = record
        const volumes = []
        for (const [key, amount] of Object.entries(record)) {
            if (key[0] !== 'v')
                continue
            volumes.push({
                asset: assetResolver.resolve(parseInt(key.substring(1), 10)),
                amount: typeof amount === 'number' ? amount : amount.toNumber()
            })
        }
        return {
            id: _id,
            paging_token: encodeCursor(weight, _id),
            accounts: accounts.map(a => accountResolver.resolve(a)),
            type,
            transfers: [ft || 0, bt || 0],
            volumes,
            created,
            updated
        }
    })

    await accountResolver.fetchAll()
    await assetResolver.fetchAll()

    return preparePagedData(basePath, {order: 'desc', cursor, limit}, rows)
}

/**
 * @param {Number} weight
 * @param {Long} id
 * @return {String}
 */
function encodeCursor(weight, id) {
    return Math.floor(weight).toString(16).padStart(8, '0') + id.toString(16).padStart(16, '0')
}

/**
 * @param {String} cursor
 */
function parseCursor(cursor) {
    return {
        weight: parseInt(cursor.substring(0, 8), 16),
        id: new Long(parseInt(cursor.substring(16, 24), 16), parseInt(cursor.substring(8, 16), 16))
    }
}

module.exports = {queryAccountRelations}