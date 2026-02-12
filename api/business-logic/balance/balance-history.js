const {validateNetwork, validateAccountOrContractAddress, validateAssetName} = require('../validators')
const errors = require('../errors')
const {fetchBalances} = require('./balances')

async function queryAddressBalanceHistory(network, address, asset) {
    validateNetwork(network)
    validateAccountOrContractAddress(address)
    asset = validateAssetName(asset)

    const [trustline] = await fetchBalances(network, {address, asset}, {projection: {history: 1, deleted: 1}})
    if (!trustline)
        throw errors.notFound('Account balance history was not found on the ledger. Check if you specified account address and asset identifier correctly.')

    const res = []
    for (let [ts, balance] of Object.entries(trustline.history)) {
        res.push([parseInt(ts), balance[0].toString(), balance[1].toString()])
    }
    if (trustline.deleted && res.length) {
        res[res.length - 1][2] = '0'
    }
    return res.reverse()
}

/*function extendHistory(res, history) {
    const lastRecord = history[0]
    if (lastRecord.balance.toString() === '0' && lastRecord.max && lastRecord.max.toNumber() > 0n) {
        res.unshift([res[0][0] + timeUnits.day / timeUnits.second, '0'])
    }
    return res
}*/

module.exports = {queryAddressBalanceHistory}