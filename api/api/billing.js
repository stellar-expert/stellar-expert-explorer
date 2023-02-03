const BillingService = require('@stellar-expert/api-billing-connector')
const {billing, corsWhitelist} = require('../app.config')

const billingProps = {
    ...billing,
    allowlist: corsWhitelist
}

const billingService = new BillingService(billingProps)
billingService.connect()

module.exports = billingService