const {BaseIdResolver, BatchJSONResolver} = require('../base-id-resolver'),
    db = require('../../connectors/mongodb-connector')

class MemoResolver extends BaseIdResolver {
    constructor() {
        super(20000)
    }

    async search(network, query) {
        const data = await db[network].collection('memos')
            .find(query)
            .toArray()
        return data.map(({_id, type, memo}) => ({_id, value: {type, memo}}))
    }

    async searchByValue(network, filter) {
        throw new Error('Not supported for memo resolver')
    }

    async searchById(network, filter) {
        return this.search(network, {_id: {$in: filter}})
    }
}

const memoResolver = new MemoResolver()

/**
 * @param {String} network
 * @param {String|[String]} memo
 * @return {Promise<[Number]>}
 */
async function fetchMemoIds(network, memo) {
    const filter = {memo}
    if (memo instanceof Array) {
        filter.memo = {$in: memo}
    }
    const data = await db[network].collection('memos')
        .find(filter)
        .project({_id: 1})
        .toArray()
    return data.map(d => d._id)
}

/**
 * @param {String} network
 * @param {Number|[Number]} memoId
 * @return {Promise<[String]>}
 */
async function resolveMemo(network, memoId) {
    return await memoResolver.resolveSingleValue(network, memoId)
}

class MemoJSONResolver extends BatchJSONResolver {
    constructor(network) {
        super(memoResolver, network)
    }

    resolveMemoValue(memoId) {
        return this.resolve(memoId, 'memo')
    }

    resolveMemoType(memoId) {
        return this.resolve(memoId, 'type')
    }
}

module.exports = {fetchMemoIds, resolveMemo, MemoJSONResolver}