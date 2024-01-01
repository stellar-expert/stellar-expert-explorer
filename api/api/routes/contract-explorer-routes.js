const {registerRoute} = require('../router')
const {queryAllContracts} = require('../../business-logic/contracts/contract-list')
const {queryContractStats} = require('../../business-logic/contracts/contract-stats')
const {queryContractBalanceHistory} = require('../../business-logic/contracts/contract-balance-history')
const {estimateContractValue} = require('../../business-logic/contracts/contract-value-estimator')
const {queryContractBalances} = require('../../business-logic/contracts/contract-balances')
const {queryContractCode} = require('../../business-logic/contracts/contract-code')

module.exports = function (app) {
    registerRoute(app,
        'contract',
        {cache: 'stats'},
        ({params, query, path}) => queryAllContracts(params.network, path, query))

    registerRoute(app,
        'contract/:contract',
        {cache: 'stats'},
        ({params, query}) => queryContractStats(params.network, params.contract, query))

    registerRoute(app,
        'contract/:contract/balance',
        {cache: 'stats'},
        ({params, query}) => queryContractBalances(params.network, params.contract, query))

    registerRoute(app,
        'contract/:contract/balance/:asset/history',
        {cache: 'balance'},
        ({params}) => queryContractBalanceHistory(params.network, params.contract, params.asset))

    registerRoute(app,
        'contract/:contract/value',
        {cache: 'stats'},
        ({params, query}) => estimateContractValue(params.network, params.contract, query.currency))

    registerRoute(app,
        'contract/wasm/:hash',
        {cache: 'stats'},
        async ({params}, res) => {
            res.type('application/octet-stream')
            res.set('Content-Disposition', `attachment;filename=${params.hash}.wasm`)
            const code = await queryContractCode(params.network, params.hash)
            res.send(code)
            res.end()
        })

}