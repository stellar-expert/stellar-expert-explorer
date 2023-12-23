const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const {validateNetwork} = require('../validators')

async function fetchDomainMeta(network, domain) {
    validateNetwork(network)
    if (typeof domain !== 'string')
        throw errors.validationError('domain')
    if (!/^\S+\.[a-z]{2,}$/.test(domain))
        throw errors.validationError('domain', 'Invalid domain name')

    const m = await db[network].collection('domain_meta').findOne({_id: domain})
    if (!m)
        throw errors.notFound(`No metadata records found for domain ${domain}`)

    const res = {
        domain: m._id,
        meta: m.meta || {}
    }
    if (m.tomlCid) {
        res.tomlCid = m.tomlCid
    }
    if (m.interop) {
        res.interop = m.interop
    }
    if (m.warnings?.length) {
        res.warnings = m.warnings
    }
    return res
}

module.exports = {fetchDomainMeta}