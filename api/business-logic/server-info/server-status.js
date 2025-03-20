const config = require('../../app.config.json')
const {version} = require('../../package')
const {unixNow, formatDateTime} = require('../../utils/date-utils')
const {fetchLastLedger} = require('../ledger/ledger-resolver')

async function getServerInfo() {
    const networks = await processRecentLedgers()
    return {
        timezone: 'UTC',
        serverTime: formatDateTime(new Date()),
        version,
        networks,
        ingestion: !Object.values(networks).some(v => v.status !== 'synced') ? 'healthy' : 'problems'
    }
}

async function processRecentLedgers() {
    const networks = {}
    for (const network of Object.keys(config.networks)) {
        const lastLedger = await fetchLastLedger(network)
        const now = unixNow()
        if ((now - lastLedger.ts) > 20) {
            console.warn(`Ingestion delay of ${now - lastLedger.ts - 6} seconds on ${network} network`)
        }
        const isStale = (now - lastLedger.ts) > 60 // consider stale if more than 1 minute elapsed from the last processed ledger
        const timestamp = formatDateTime(new Date(lastLedger.ts * 1000))
        networks[network] = {
            sequence: lastLedger._id,
            protocol: lastLedger.version,
            timestamp,
            status: isStale ? 'stale' : 'synced'
        }
    }
    return networks
}

module.exports = {getServerInfo}