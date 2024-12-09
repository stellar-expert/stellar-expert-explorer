const {Client} = require('@elastic/elasticsearch')
const config = require('../app.config.json')

const elastic = new Client({
    node: config.elastic,
    compression: true,
    suggestCompression: true,
    name: 'api'
})

elastic.indexBoundaries = {}

/**
 * Find all existing indexes
 * @return {Promise<string[]>}
 * @private
 */
elastic.enumerateIndexes = async function enumerateIndexes() {
    for (const network of Object.keys(config.networks)) {
        const allIndexes = await elastic.indices.get({index: '*'})
        const prefix = config.networks[network].opIndex
        const indexes = Object.keys(allIndexes).filter(i => i.startsWith(prefix))
        const minYear = indexes.map(i => parseInt(i.replace(prefix, '')))
            .reduce((acc, cur) => {
                if (!acc || cur < acc)
                    return cur
                return acc
            }, undefined)
        elastic.indexBoundaries[network] = {min: minYear, max: new Date().getUTCFullYear()}
    }
}

module.exports = elastic