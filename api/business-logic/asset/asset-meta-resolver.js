const db = require('../../connectors/mongodb-connector')

const xlmMeta = {
    asset: 'XLM',
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
    const filter = [...domains]
    for (let domain of domains) {
        for (const tld of retrieveTopLevelDomains(domain)) {
            filter.push(tld)
        }
    }
    const res = await db[network].collection('blocked_domains')
        .find({_id: {$in: filter}})
        .project({_id: 1})
        .toArray()
    return res.map(v => v._id)
}

/**
 * Fetch tags for account
 * @param {String} network - Stellar network
 * @param {String[]} issuers - Asset issuer accounts to check
 * @return {Promise<String[]>}
 * @internal
 */
async function checkIssuersWarnings(network, issuers) {
    return await db[network].collection('directory')
        .find({
            _id: {$in: issuers},
            tags: {$in: ['malicious', 'unsafe']}
        }) //search only for accounts with 'malicious' and 'unsafe' tags
        .project({_id: 1})
        .toArray()
}

/**
 * Retrieve assets meta from the db
 * @param {String} network - Stellar network
 * @param {String[]} assets - Asset ids or FQANs
 * @return {Promise<Array<{asset: String, name: String, domain?: String, unconfirmed_domain?: String, toml_info?: {}}>>}
 */
async function retrieveAssetsMetadata(network, assets) {
    if (!assets.length)
        return []
    let addXlm = false
    const xlmIdx = assets.indexOf('XLM')
    if (xlmIdx >= 0) {
        assets.splice(xlmIdx, 1)
        addXlm = true
    }

    let foundAssets = []
    if (assets.length) {
        foundAssets = await db[network].collection('assets')
            .find({_id: {$in: assets}})
            .project({domain: 1, tomlInfo: 1})
            .toArray()

    }
    //add predefined XLM meta
    if (addXlm) {
        foundAssets.unshift(xlmMeta)
    }

    const allDomains = new Set()
    const allIssuers = new Set()

    //normalize response properties
    foundAssets = foundAssets.map(a => {
        const res = {name: a._id || a.name}
        res.asset = res.name
        if (a.domain) {
            if (a.tomlInfo) {
                //TOML metadata exists
                res.domain = a.domain
                res.toml_info = a.tomlInfo
            } else {
                //mark domain as unconfirmed if relevant TOML info not found
                res.unconfirmed_domain = a.domain
            }
            allDomains.add(a.domain)
        }
        if (res.name.includes('-')) {
            const issuer = res.name.split('-')[1]
            allIssuers.add(issuer)
        }
        return res
    })

    //process Directory info
    const [blockedDomains, issuerWarnings, contractAssets] = await Promise.all([
        checkBlockedDomains(network, Array.from(allDomains)), //check whether any of the found domains has been blocked
        checkIssuersWarnings(network, Array.from(allIssuers)) //check warnings set to issuer accounts
    ])
    const tokens = foundAssets.map(a => a.name).filter(a => a.startsWith('C') && a.length === 56)
    if (tokens.length) {
        const tokenInfo = await retrieveAssetContractsMeta(network, tokens)
        if (tokenInfo.size > 0) {
            for (const a of foundAssets) {
                const tokenMeta = tokenInfo.get(a.asset)
                if (tokenMeta) {
                    Object.assign(a, tokenMeta)
                }
            }
        }
    }

    if (blockedDomains.length) {
        const blocked = new Set(blockedDomains)
        for (const a of foundAssets) {
            const originalDomain = a.domain || a.unconfirmed_domain
            for (let domain of [originalDomain, ...retrieveTopLevelDomains(originalDomain)]) {
                if (blocked.has(domain)) {
                    a.unsafe = true
                    break
                }
            }
        }
    }

    if (issuerWarnings.length) {
        for (const issuerTags of issuerWarnings) {
            for (const a of foundAssets) {
                if (a.name.includes(issuerTags._id)) {
                    a.unsafe = true
                }
            }
        }
    }
    return foundAssets
}

/**
 * Retrieve contract properties for contract assets
 * @param {String} network - Stellar network
 * @param {String[]} contracts - Contract ids
 * @return {Promise<Map<String, {code: String, name: String, decimals: Number, traits: String[]}>>}
 */
async function retrieveAssetContractsMeta(network, contracts) {
    const res = await db[network].collection('contracts').find({_id: {$in: contracts}}, {
        projection: {
            code: 1,
            name: 1,
            decimals: 1,
            traits: 1
        }
    }).toArray()
    return res.reduce((map, contract) => {
        map.set(contract._id, {
            code: contract.code,
            token_name: contract.name,
            decimals: contract.decimals,
            features: contract.traits
        })
        return map
    }, new Map())
}

/**
 * @param {string} domain
 * @return {string[]}
 */
function retrieveTopLevelDomains(domain) {
    if (typeof domain !== 'string')
        return []
    const res = []
    const parts = domain.split('.')
    while (parts.length > 2) {
        parts.shift()
        res.push(parts.join('.'))
    }
    return res
}

module.exports = {retrieveAssetsMetadata, retrieveAssetContractsMeta, xlmMeta}