const {Client} = require('@elastic/elasticsearch')
const config = require('../app.config.json')

const elastic = new Client({
    node: config.elastic,
    compression: true,
    suggestCompression: true,
    name: 'api'
})

const indexBoundaries = {}

const indexKeys = ['opIndex', 'tradeIndex', 'invocationIndex', 'errorIndex', 'eventIndex']

/**
 * Locate all existing indexes
 * @return {Promise<string[]>}
 * @private
 */
elastic.enumerateIndexes = async function enumerateIndexes() {
    //const thisYear = new Date().getUTCFullYear()
    for (const network of Object.keys(config.networks)) {
        const allIndexes = await elastic.indices.get({index: '*'})
        const res = {}
        for (const index of Object.keys(allIndexes)) {
            for (const indexKey of indexKeys) {
                const indexPrefix = config.networks[network][indexKey]
                if (index.startsWith(indexPrefix)) {
                    const year = parseInt(index.replace(indexPrefix, ''))
                    res[indexKey] = Math.min(year, res[indexKey] || Infinity)
                }
            }
        }
        indexBoundaries[network] = res
    }
}

/**
 * Find the earliest year for a given index
 * @param {string} network
 * @param {'opIndex'|'tradeIndex'|'invocationIndex'|'errorIndex'|'eventIndex'} indexKey
 * @return {number}
 */
elastic.getIndexLowerBoundary = function (network, indexKey) {
    return indexBoundaries[network][indexKey]
}

module.exports = elastic