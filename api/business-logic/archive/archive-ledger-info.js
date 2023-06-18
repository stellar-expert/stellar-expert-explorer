const ArchiveTxInfo = require('./archive-tx-info')

module.exports = class ArchiveLedgerInfo {
    /**
     * @type {Number}
     */
    sequence
    /**
     * @type {Buffer}
     */
    header
    /**
     * @type {Buffer[]}
     */
    upgrades
}