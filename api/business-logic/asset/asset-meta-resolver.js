const db = require('../../connectors/mongodb-connector')

const xlmMeta = {
    name: 'XLM',
    domain: 'stellar.org',
    tomlInfo: {
        image: 'https://stellar.expert/img/vendor/stellar.svg',
        orgName: 'Stellar',
        name: 'Lumen'
    }
}

/**
 * Find domains that have been added to the blocklist
 * @param {String} network - Stellar network
 * @param {String[]} domains
 * @return {Promise<String[]>}
 * @internal
 */
async function checkBlockedDomains(network, domains) {
    const res = await db[network].collection('blocked_domains')
        .find({_id: {$in: domains}})
        .project({_id: 1})
        .toArray()
    return res.map(v => v._id)
}

/**
 * Retrieve assets meta from the db
 * @param {String} network - Stellar network
 * @param {String[]|Number[]} assets - Asset ids or FQANs
 * @return {Promise<Array<{asset: String, name: String, domain?: String, unconfirmed_domain?: String, toml_info?: {}}>>}
 */
async function retrieveAssetsMetadata(network, assets) {
    if (!assets.length) return []
    const query = typeof assets[0] === 'number' ? {_id: {$gt: 0, $in: assets}} : {name: {$in: assets}, _id: {$gt: 0}}

    let foundAssets = await db[network].collection('assets')
        .find(query)
        .project({name: 1, domain: 1, tomlInfo: 1})
        .toArray()

    //add predefined XLM meta
    if (assets.includes('XLM') || assets.includes(0)) {
        foundAssets.unshift(xlmMeta)
    }

    const domainsMap = {}
    //normalize response properties
    foundAssets = foundAssets.map(a => {
        const res = {_id: a._id, asset: a.name, name: a.name}
        if (a.domain) {
            if (a.tomlInfo) {
                //TOML metadata exists
                res.domain = a.domain
                res.toml_info = a.tomlInfo
                domainsMap[a.domain] = 1
            } else {
                //mark domain as unconfirmed if relevant TOML info not found
                res.unconfirmed_domain = a.domain
            }
            domainsMap[a.domain] = 1
        }
        return res
    })

    //check whether any of the found domains has been blocked
    const blockedDomains = await checkBlockedDomains(network, Object.keys(domainsMap))
    if (blockedDomains.length) {
        for (const blockedDomain of blockedDomains) {
            for (const a of foundAssets) {
                if (a.domain === blockedDomain || a.unconfirmed_domain === blockedDomain) {
                    a.blocked = true
                }
            }
        }
    }
    return foundAssets
}

module.exports = {retrieveAssetsMetadata}