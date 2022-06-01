const {Long} = require('bson'),
    OperationsQuery = require('./operations-query'),
    {parseGenericId} = require('../../utils/generic-id-utils'),
    {validateAssetName, validateAccountAddress} = require('../validators'),
    {resolveFederationAccountAddress} = require('../federation/federation-address-resolver')

async function searchPayments(network, basePath, query) {
    const opQuery = new OperationsQuery(network, basePath, query)
    opQuery.addTypesFilter([0, 1, 2, 8, 13])

    const {memo, amount, asset, account, from, to} = query

    if (asset) {
        validateAssetName(asset)
        await opQuery.addAssetFilter(asset)
    }

    let accounts = [account, from, to].filter(a => !!a)
    if (accounts.length) {
        accounts.forEach(a => validateAccountAddress(a))
        accounts = await Promise.all(accounts.map(a => resolveFederationAccountAddress(a)))
        await opQuery.addAccountFilter(accounts)
    }

    if (memo) {
        await opQuery.addMemoFilter(memo)
    }

    if (amount) {
        await opQuery.addAmountFilter(amount)
    }

    const res = await opQuery.toArray()

    for (let record of res._embedded.records) {
        const {ledger, tx} = parseGenericId(Long.fromString(record.id))
        record.ledger = ledger
        record.tx_id = tx
        record.optype = record.type
        record.ts = new Date(record.ts * 1000)
        record.from = record.accounts[0]
        record.to = record.accounts[record.accounts.length - 1]
        record.asset = record.assets[record.assets.length - 1]
        record.source_asset = record.assets[0]
        record.source_amount = record.source_amount || record.amount
    }

    return res
}

module.exports = {searchPayments}