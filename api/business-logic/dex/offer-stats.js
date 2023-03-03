const db = require('../../connectors/mongodb-connector'),
    {Long} = require('bson'),
    {AccountAddressJSONResolver} = require('../account/account-resolver'),
    {AssetJSONResolver} = require('../asset/asset-resolver'),
    {validateNetwork} = require('../validators'),
    errors = require('../errors')

async function queryOfferDetails(network, offerId) {
    validateNetwork(network)
    const parsedOfferId = Long.fromString(offerId)

    const offer = await db[network]
        .collection('offers')
        .findOne({_id: parsedOfferId})

    if (!offer)
        throw errors.notFound(`Offer with id ${parsedOfferId.toString()} wasn't found.`)

    const assetResolver = new AssetJSONResolver(network),
        accountResolver = new AccountAddressJSONResolver(network)

    const res = {
        id: offer._id.toString(),
        account: accountResolver.resolve(offer.account),
        created: offer.created,
        selling: assetResolver.resolve(offer.asset[0]),
        buying: assetResolver.resolve(offer.asset[1]),
        amount: (offer.amount || '0').toString(),
        updated: offer.updated,
        price: offer.price,
        trades: offer.trades || 0
    }
    if (offer.deleted) {
        res.deleted = offer.deleted
    }

    await Promise.all([
        assetResolver.fetchAll(),
        accountResolver.fetchAll()
    ])

    return res
}

module.exports = {queryOfferDetails}