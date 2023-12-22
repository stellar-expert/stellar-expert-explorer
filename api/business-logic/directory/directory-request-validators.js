const {StrKey} = require('@stellar/stellar-sdk')
const directoryTags = require('./directory-tags')
const errors = require('../errors')

function validateUpdateEntryData({address, domain, name, tags, notes}) {
    if (!StrKey.isValidEd25519PublicKey(address))
        throw errors.badRequest('Invalid "address" parameter value. Expected a valid Stellar public key.')
    if (domain && (typeof domain !== 'string' || domain.length > 60 || !/\w+\.\w+/.test(domain) || /[:/?]/.test(domain)))
        throw errors.badRequest('Invalid "domain" parameter value. Expected a valid FQDN domain name.')
    if (typeof name !== 'string' || name.length < 4 || name.length > 50)
        throw errors.badRequest('Invalid "name" parameter value. Expected a string (6-50 characters).')
    if (!(tags instanceof Array))
        throw errors.badRequest('Invalid "tags" parameter value. Account tags are mandatory.')
    if (tags.length < 1)
        throw errors.badRequest('Invalid "tags" parameter value. At least one tag is required.')
    if (tags.length > 6)
        throw errors.badRequest('Invalid "tags" parameter value. Too many tags.')
    for (let tag of tags) {
        if (!directoryTags.some(t => t.name === tag))
            throw errors.badRequest(`Invalid "tags" parameter value. Unknown tag: "${tag}".`)
    }
    if (notes && (typeof notes !== 'string' || notes.length > 1000))
        throw errors.badRequest('Invalid "notes" parameter value. Expected a string up to 700 characters.')
}

function validateDeletedEntryData({address, notes, version}) {
    if (!StrKey.isValidEd25519PublicKey(address))
        throw errors.badRequest('Invalid "address" parameter value. Expected a valid Stellar public key.')
    if (notes && (typeof notes !== 'string' || notes.length > 1000))
        throw errors.badRequest('Invalid "notes" parameter value. Expected a string up to 700 characters.')
    if (!(parseInt(version, 10) > 0))
        throw errors.badRequest('Invalid "version" parameter value. Expected a numeric revision version.')
}

module.exports = {
    validateUpdateEntryData,
    validateDeletedEntryData
}
