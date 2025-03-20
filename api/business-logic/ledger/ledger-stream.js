const db = require('../../connectors/mongodb-connector')
const {networks} = require('../../app.config')
const errors = require('../errors')

class LedgerStream {
    constructor(network) {
        this.network = network
        this.subscribers = []
        this.interval = setInterval(this.poll.bind(this), 500) //every 0.5 seconds
    }

    /**
     * @type {string}
     * @readonly
     */
    network
    /**
     * @type {function[]}
     * @private
     */
    subscribers
    /**
     * @type {number}
     * @readonly
     */
    last = 0

    /**
     * Create subscription to wait for the new ledger
     * @return {Promise<number>}
     */
    waitForLedger() {
        return new Promise((resolve, reject) => {
            setTimeout(() => reject(errors.serviceUnavailable('Ledger information stale')), 30_000) //drop if not received new ledgers within 30 seconds
            this.subscribers.push(resolve)
        })
    }

    /**
     * @param {number} ledger
     * @private
     */
    notify(ledger) {
        const {subscribers} = this
        this.subscribers = []
        for (const send of subscribers) {
            send({ledger})
        }
    }

    /**
     * @private
     */
    poll() {
        db[this.network].collection('ledgers')
            .findOne({}, {sort: {_id: -1}, projection: {_id: 1}})
            .then(({_id: ledger}) => {
                if (ledger > this.last) {
                    this.last = ledger
                    this.notify(ledger)
                }
            })
    }
}

const streams = {}

for (let network of Object.keys(networks)) {
    streams[network] = new LedgerStream(network)
}

function waitForLedger(network) {
    return streams[network].waitForLedger()
}

module.exports = {waitForLedger}