const config = require('../../app.config.json')
const {version} = require('../../package')
const db = require('../../connectors/mongodb-connector')
const {unixNow, formatDateTime} = require('../../utils/date-utils')

async function getServerInfo() {
    return {
        timezone: 'UTC',
        serverTime: formatDateTime(new Date()),
        version,
        networks: await processRecentLedgers()
    }
}

async function processRecentLedgers() {
    const networks = {}
    for (const network of Object.keys(config.networks)) {
        const lastLedger = await db[network].collection('ledgers').findOne({}, {sort: {_id: -1}})
        const isStale = (unixNow() - lastLedger.ts) > 15 // consider stale if more than 15 seconds elapsed from the last processed ledger
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