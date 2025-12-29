const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')
const errors = require('../errors')

async function queryOfferDetails(network, offerId) {
    validateNetwork(network)
    //check active offers
    let offer = await db[network].collection('offers').findOne({_id: BigInt(offerId)})
    if (!offer) {
        //check expired offers
        offer = await db[network].collection('exoffers').findOne({_id: BigInt(offerId)})
    }
    if (!offer)
        throw errors.notFound(`Offer with id ${offerId.toString()} wasn't found.`)

    const res = {
        id: offer._id.toString(),
        account: offer.account,
        created: offer.created,
        selling: offer.asset[0],
        buying: offer.asset[1],
        amount: (offer.amount || '0').toString(),
        updated: offer.updated,
        price: offer.price,
        trades: offer.trades || 0
    }
    if (!offer.amount) {
        res.deleted = offer.updated
    }

    return res
}

module.exports = {queryOfferDetails}