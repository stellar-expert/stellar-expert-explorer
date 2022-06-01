const db = require('../../connectors/mongodb-connector')

const operationsCollectionPrefix = 'xs_operations_'

class ShardsIterator {
    constructor(shardsInfo, fromTimestamp, toTimestamp, direction = 1) {
        if (Math.abs(direction) !== 1) throw new Error(`Invalid shard iterator direction: ${direction}`)
        this.shardsInfo = shardsInfo
        this.direction = direction
        this.from = this.shardsInfo.findShardPosition(fromTimestamp)
        if (this.from < 0) {
            this.from = 0
        }
        this.to = this.shardsInfo.findShardPosition(toTimestamp)
        this.position = direction === -1 ? this.to : this.from
    }

    shardsInfo

    position

    from

    to

    direction

    next() {
        if (this.position < this.from || this.position > this.to) return null
        const shard = this.shardsInfo.shards[this.position]
        if (!shard) return null
        this.position += this.direction
        return operationsCollectionPrefix + shard
    }

    [Symbol.iterator]() {
        return {
            next: () => {
                const value = this.next()
                return {
                    value,
                    done: !value//this.direction === -1 ? this.position === 0 : this.position === this.shardsInfo.shards.length - 1
                }
            }
        }
    }
}

class ShardsInfo {
    constructor(network) {
        this.network = network
        this.shards = []
        this.lastUpdated = 0
    }

    network

    shards

    lastUpdated

    updatePromise

    get isStale() {
        //refresh every 10 seconds
        return new Date().getTime() - this.lastUpdated > 10000
    }

    updateShardInfo() {
        if (!this.updatePromise) {
            this.updatePromise = db[this.network].listCollections().toArray()
                .then(collections => {
                    const foundShards = []
                    for (const {name} of collections) {
                        if (name.startsWith(operationsCollectionPrefix)) {
                            foundShards.push(parseInt(name.replace(operationsCollectionPrefix, '')))
                        }
                    }
                    foundShards.sort()
                    this.shards = foundShards
                    this.lastUpdated = new Date().getTime()
                })
                .finally(() => this.updatePromise = undefined)
        }
        return this.updatePromise
    }

    findShardPosition(timestamp) {
        const {shards} = this
        let min = 0,
            mid,
            max = shards.length - 1

        while (min <= max) {
            mid = (min + max) >>> 1
            const midElement = shards[mid]
            if (midElement === timestamp) return mid

            if (midElement < timestamp) {
                min = mid + 1
            } else {
                max = mid - 1
            }
        }
        return max
    }
}

let allShards = {}

async function getShardInfo(network) {
    let shardInfo = allShards[network]
    if (!shardInfo) {
        shardInfo = allShards[network] = new ShardsInfo(network)
    }
    if (shardInfo.isStale) {
        await shardInfo.updateShardInfo()
    }
    return shardInfo
}

/**
 *
 * @param {String} network
 * @param {Number} timestamp
 * @return {Promise<String|null>}
 */
async function resolveOperationShard(network, timestamp) {
    const shardInfo = await getShardInfo(network),
        pos = shardInfo.findShardPosition(timestamp)
    if (pos < 0) return null
    return operationsCollectionPrefix + shardInfo.shards[pos]
}

/**
 *
 * @param {String} network
 * @param {Number} fromTimestamp
 * @param {Number} toTimestamp
 * @param {Number} order
 * @return {Promise<ShardsIterator>}
 */
async function iterateOperationShards(network, fromTimestamp, toTimestamp, order = 1) {
    const shardInfo = await getShardInfo(network)
    return new ShardsIterator(shardInfo, fromTimestamp, toTimestamp, order)

}

module.exports = {resolveOperationShard, iterateOperationShards}