const {Long} = require('bson')
const db = require('../../connectors/mongodb-connector')
const errors = require('../errors')
const ArchiveTxInfo = require('./archive-tx-info')
const ArchiveLedgerInfo = require('./archive-ledger-info')

/**
 * @param {String} network
 * @param {String} collectionName
 * @return {Collection}
 * @private
 */
function archiveCollection(network, collectionName) {
    return db.archive[network].collection(collectionName)
}

function mapTxProps(entry) {
    const tx = new ArchiveTxInfo()
    tx.id = entry._id
    tx.hash = entry.hash
    tx.body = entry.xdr[0]
    tx.result = entry.xdr[1]
    tx.meta = entry.xdr[2]
    return tx
}

function mapLedgerProps(entry) {
    const ledger = new ArchiveLedgerInfo()
    ledger.sequence = entry._id
    ledger.header = entry.xdr
    if (entry.upgrades) {
        ledger.upgrades = entry.upgrades
    }
    return ledger
}

/**
 * Fetch multiple transactions from archive
 * @param {String} network - Network identifier
 * @param {Number} sequence - Ledger sequence
 * @return {Promise<{}>}
 */
async function fetchArchiveLedger(network, sequence) {
    const ledger = await archiveCollection(network, 'ledgers').findOne({_id: parseInt(sequence)})
    if (!ledger)
        return errors.notFound('Ledger not found')
    const res = {
        sequence,
        xdr: ledger.xdr.toString('base64')
    }
    if (ledger.upgrades) {
        res.upgrades = ledger.upgrades.map(u => u.toString('base64'))
    }
    return res
}

/**
 * Fetch multiple transactions from archive
 * @param {String} network - Network identifier
 * @param {Long[]} ids - Transaction identifiers
 * @param {Number} order - Transactions sorting order
 * @return {Promise<ArchiveTxInfo[]>}
 */
async function fetchArchiveTransactions(network, ids, order = -1) {
    if (!ids?.length)
        return []
    const res = await archiveCollection(network, 'transactions')
        .find({_id: {$in: ids}}, {sort: {_id: order}})
        .toArray()
    return res.map(mapTxProps)
}

/**
 * Fetch a single transaction from archive db
 * @param {String} network - Network identifier
 * @param {String|Long|Buffer} idOrHash - Transaction id or hash
 * @return {Promise<ArchiveTxInfo>}
 */
async function fetchSingleArchiveTransaction(network, idOrHash) {
    if (!idOrHash)
        return null
    const query = {}
    if (typeof idOrHash === 'string') {
        if (idOrHash.length === 64) {
            query.hash = Buffer.from(idOrHash, 'hex')
        } else {
            try {
                query._id = Long.fromString(idOrHash, false, 10)
            } catch (e) {
                return null
            }
        }
    } else if (idOrHash instanceof Long) {
        query._id = idOrHash
    } else if (idOrHash instanceof Buffer) {
        query.hash = idOrHash
    } else
        return null //unknown format
    const res = await archiveCollection(network, 'transactions').findOne(query)
    if (!res)
        return null
    return mapTxProps(res)
}

/**
 * Fetch all transaction that belong to a certain ledger from archive db
 * @param {String} network - Network identifier
 * @param {Number} ledger - Ledger sequence
 * @param {Number} [order] - Transactions sorting order
 * @return {Promise<ArchiveTxInfo[]>}
 */
async function fetchArchiveLedgerTransactions(network, ledger, order = 1) {
    if (typeof ledger !== 'number' || !(ledger > 0))
        return []
    const res = await archiveCollection(network, 'transactions')
        .find({_id: {$gte: new Long(0, ledger), $lt: new Long(0, ledger + 1)}}, {sort: {_id: order}})
        .toArray()
    return res.map(mapTxProps)
}

module.exports = {fetchArchiveTransactions, fetchArchiveLedgerTransactions, fetchSingleArchiveTransaction, fetchArchiveLedger}