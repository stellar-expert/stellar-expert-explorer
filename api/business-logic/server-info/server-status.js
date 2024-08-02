const config = require('../../app.config.json')
const {version} = require('../../package')
const db = require('../../connectors/mongodb-connector')
const {unixNow, formatDateTime} = require('../../utils/date-utils')

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
        const lastLedger = await db[network].collection('ledgers').findOne({}, {sort: {_id: -1}})
        const isStale = (unixNow() - lastLedger.ts) > 30 // consider stale if more than 30 seconds elapsed from the last processed ledger
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