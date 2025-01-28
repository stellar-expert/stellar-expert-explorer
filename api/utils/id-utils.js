/**
 * @param {number} id
 * @return {boolean}
 */
function isContractId(id) {
    return id >= (1 << 30) && id < (((1 << 31) >>> 0) - 1)
}

/**
 * Parse given generic id
 * @param genericId {BigInt|String} - generic id
 */
function parseGenericId(genericId) {
    if (typeof genericId === 'string') {
        genericId = BigInt(genericId)
    }
    if (typeof genericId !== 'bigint')
        throw new Error('Invalid generic id: ' + genericId)
    const operationOrder = genericId % 4096n
    return {
        ledger: genericId / 4294967296n,
        tx: (genericId - operationOrder).toString(),
        txApplicationOrder: Number(genericId / 4096n),
        operationApplicationOrder: Number(operationOrder)
    }
}


module.exports = {isContractId, parseGenericId}