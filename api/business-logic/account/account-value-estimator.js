const errors = require('../errors')
const {validateAccountAddress, validateNetwork} = require('../validators')
const db = require('../../connectors/mongodb-connector')
const {queryBalances} = require('../balance/balances')

async function estimateAccountValue(network, address, currency = 'USD', ts = undefined) {

}

module.exports = {estimateAccountValue}