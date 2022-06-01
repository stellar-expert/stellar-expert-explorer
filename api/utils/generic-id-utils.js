const {Long, ObjectId} = require('bson')

/**
 * Generate id for a given ledger entity.
 * @param ledgerSequence {Number} - ledger sequence
 * @param txApplicationOrder {Number} - application order for transaction (starting with 1)
 * @param operationApplicationOrder {Number} - application order for order (starting with 1)
 * @returns {Long}
 */
function predictGenericId(ledgerSequence, txApplicationOrder = 0, operationApplicationOrder = 0) {
    // see https://github.com/stellar/go/blob/6a367049e8f9ad52798f5c8f69df8b875fde4a1a/services/horizon/internal/toid/main.go
    return new Long(0, ledgerSequence) // << 32
        .add(new Long(txApplicationOrder).multiply(new Long(4096))) // << 12
        .add(new Long(operationApplicationOrder))
}

function nextLedgerGenericId(ledgerSequence) {
    return new Long(0, ledgerSequence + 1) // << 32
}

/**
 * Extract ledger sequence from a given generic id.
 * @param genericId {Long} - generic id
 */
function extractSequenceFromGenericId(genericId) {
    //TODO: replace with single parse id util that returns sequence, tx order, op order
    if (!(genericId instanceof Long)) throw new Error('Invalid generic id: ' + genericId)
    return genericId.getHighBits()
}


class ParsedGenericId {
    constructor(props = undefined) {
        Object.assign(this, props)
    }

    type = 'unknown'
    ledger = 0
    tx = '0'
    txApplicationOrder = 0
    operationApplicationOrder = 0
}

const txOrderOffset = new Long(4096)

/**
 * Parse given generic id.
 * @param genericId {Long|String} - generic id
 */
function parseGenericId(genericId) {
    if (typeof genericId === 'string') {
        if (!/^\d{1,19}$/.test(genericId)) return new ParsedGenericId()
        genericId = Long.fromString(genericId)
    }

    const ledger = genericId.getHighBits()
    //it's a ledger
    if (genericId.getLowBits() === 0) return new ParsedGenericId({type: 'ledger', ledger})

    //operation or transaction id
    const operationOrder = genericId.modulo(txOrderOffset),
        txApplicationOrder = Math.floor(genericId.getLowBits() / 4096),
        tx = genericId.subtract(operationOrder).toString()

    return new ParsedGenericId({
        type: operationOrder.isZero() ? 'transaction' : 'operation',
        ledger,
        tx,
        txApplicationOrder,
        operationApplicationOrder: operationOrder.getLowBits()
    })
}

function generateEffectId(operationId, applicationOrder = 0) {
    //LEDGER[32]-TX_ORDER[20]-OP_ORDER[12]-EFFECT_ORDER[32]
    const raw = Buffer.allocUnsafe(12)
    //encode operationId
    raw.writeInt32BE(operationId.getHighBits(), 0)
    raw.writeInt32BE(operationId.getLowBits(), 4)
    //encode timestamp and application order
    raw.writeInt32BE(applicationOrder, 8)

    return new ObjectId(raw.toString('hex'))
}

module.exports = {
    predictGenericId,
    nextLedgerGenericId,
    extractSequenceFromGenericId,
    generateEffectId,
    parseGenericId
}