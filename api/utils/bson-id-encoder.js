const {ObjectId} = require('mongodb')

function validateInt32(value) {
    if (typeof value !== 'number')
        throw new Error(`Invalid Int32 value: ${value}.`)
    if (value <= 4294967295 && value > 2147483647)
        return value >> 0
    if (value < -2147483648 || value > 2147483647)
        throw new Error(`Too large Int32 value: ${value}.`)
    return value
}

module.exports = {
    /**
     * Encode composite BSON ObjectId from 3 UInt32 values
     * @param {Number} high
     * @param {Number} mid
     * @param {Number} low
     * @return {ObjectId}
     */
    encodeBsonId(high, mid, low) {
        const raw = Buffer.allocUnsafe(12)
        raw.writeInt32BE(validateInt32(high), 0)
        raw.writeInt32BE(validateInt32(mid), 4)
        raw.writeInt32BE(validateInt32(low), 8)
        return new ObjectId(raw)
    },
    /**
     * @param {ObjectId} objectId
     * @return {[Number, Number, Number]}
     */
    decodeBsonId(objectId) {
        const {id} = objectId
        return [id.readInt32BE(0), id.readInt32BE(4), id.readInt32BE(8)]
    },
    /**
     * @param {ObjectId} objectId
     * @param {0|1|2} index
     * @return {Number}
     */
    decodeBsonIdPart(objectId, index) {
        return objectId.id.readInt32BE(index * 4)
    }
}