const apiCache = require('../api-cache')

apiCache.createBucket('operations', 8000, '10 seconds')
apiCache.createBucket('stats', 8000, '2 minutes')
apiCache.createBucket('global-stats', 8000, '5 minutes')
apiCache.createBucket('search', 2000, '30 seconds')

module.exports = function (app) {
    require('./account-explorer-routes')(app)
    require('./asset-explorer-routes')(app)
    require('./liquidity-pool-explorer-routes')(app)
    require('./ledger-explorer-routes')(app)
    require('./domain-meta-routes')(app)
    require('./offer-explorer-routes')(app)
    require('./market-explorer-routes')(app)
    require('./claimable-balance-explorer-routes')(app)
    require('./oauth-routes')(app)
}