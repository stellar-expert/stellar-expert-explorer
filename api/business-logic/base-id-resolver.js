const {LRUCache} = require('lru-cache')

/**
 * @typedef {Object} MapEntry
 * @property {Number} _id
 * @property {String} value
 */

class AccountMapCache {
    constructor(cacheSize) {
        this.valueToIdCache = new LRUCache({max: cacheSize})
        this.idToValueCache = new LRUCache({max: cacheSize})
    }

    valueToIdCache
    idToValueCache
}

class BaseIdResolver {
    constructor(cacheSize) {
        this.caches = {}
        this.cacheSize = cacheSize
    }

    /**
     * @type {Object}
     * @private
     */
    caches
    /**
     * @type {Number}
     * @private
     */
    cacheSize

    /**
     * @param {String} network
     * @param {[Number]} filter
     * @return {Promise<[MapEntry]>}
     * @abstract
     */
    async searchById(network, filter) {
        throw new Error('Should be implemented in inherited class')
    }

    /**
     * @param {String} network
     * @param {[String]} filter
     * @return {Promise<[MapEntry]>}
     * @abstract
     */
    async searchByValue(network, filter) {
        throw new Error('Should be implemented in inherited class')
    }

    /**
     *
     * @param {String} network
     * @return {AccountMapCache}
     */
    getEntriesMapCache(network) {
        let cache = this.caches[network]
        if (!cache) {
            cache = this.caches[network] = new AccountMapCache(this.cacheSize)
        }
        return cache
    }

    retrieveResultsFromCache(cache, entries) {
        const results = {}
        const missing = new Set() //we need only unique values here

        for (const entry of entries) {
            //we already added this to the mapping
            if (results[entry] || missing.has(entry)) continue
            //attempt cache hit
            const cached = cache.get(entry)
            if (cached) {//cache hit
                results[entry] = cached
            } else { //cache miss - need to fetch from db
                missing.add(entry)
            }
        }
        return {results, missing: Array.from(missing)}
    }


    async resolveSingleId(network, value) {
        const {valueToIdCache} = this.getEntriesMapCache(network)
        const cached = valueToIdCache.get(value)
        if (cached) return cached
        const [fetched] = await this.searchByValue(network, [value])
        if (!fetched) return null
        valueToIdCache.set(value, fetched._id)
        return fetched._id
    }

    /**
     * Resolve entry id using cached values mapping.
     * @param {String} network
     * @param {String|[String]} valuesToMap
     * @return {Promise<(Number|null)[]>}
     */
    async resolveIds(network, valuesToMap) {
        if (valuesToMap === null || valuesToMap === undefined)
            return []
        //single entry
        if (typeof valuesToMap === 'string')
            return [await this.resolveSingleId(network, valuesToMap)]
        //process array
        if (!(valuesToMap instanceof Array))
            throw new Error(`Invalid value provided: ${valuesToMap}`)

        const {valueToIdCache} = this.getEntriesMapCache(network)

        const {results, missing} = this.retrieveResultsFromCache(valueToIdCache, valuesToMap)

        if (missing.length) {
            const fetched = await this.searchByValue(network, valuesToMap)
            for (const {_id, value} of fetched) {
                results[value] = _id
                valueToIdCache.set(value, _id)
            }
        }
        return valuesToMap.map(v => results[v])
    }

    async resolveSingleValue(network, id) {
        const {idToValueCache} = this.getEntriesMapCache(network)
        const cached = idToValueCache.get(id)
        if (cached) return cached
        const [fetched] = await this.searchById(network, [id])
        if (!fetched) return null
        idToValueCache.set(id, fetched.value)
        return fetched.value
    }

    /**
     * Resolve account id using cached address mapping.
     * @param {String} network
     * @param {Number|[Number]} idToMap
     */
    async resolveValue(network, idToMap) {
        if (idToMap === null || idToMap === undefined) return idToMap
        //single entry
        if (typeof idToMap === 'number') return await this.resolveSingleId(network, idToMap)
        //process array
        if (!(idToMap instanceof Array))
            throw new Error(`Invalid value provided: ${idToMap}`)
        if (!idToMap.length) return {}

        const {idToValueCache} = this.getEntriesMapCache(network)

        const {results, missing} = this.retrieveResultsFromCache(idToValueCache, idToMap)

        if (missing.length) {
            const fetched = await this.searchById(network, idToMap)
            for (let {_id, value} of fetched) {
                results[_id] = value
                idToValueCache.set(_id, value)
            }
        }
        return results
    }
}

class DeferredJSONValueResolver {
    constructor(batchResolver, originalValue, field = null, postProcessCallback) {
        this.batchResolver = batchResolver
        this.originalValue = originalValue
        this.field = field
        this.postProcessCallback = postProcessCallback
    }

    batchResolver
    originalValue
    field
    postProcessCallback

    get value() {
        return this.originalValue
    }

    toJSON() {
        let value = this.batchResolver.reference[this.originalValue]
        if (value) {
            if (this.postProcessCallback) {
                value = this.postProcessCallback(value)
            }
            if (this.field)
                return value[this.field]
        }
        return value
    }
}

class BatchJSONResolver {
    constructor(resolver, network) {
        this.network = network
        this.resolver = resolver
        this.valuesToResolve = new Set()
    }

    valuesToResolve

    reference

    /**
     * Fetch all deferred values from db.
     * @return {Promise<void>}
     */
    async fetchAll() {
        this.reference = await this.resolver.resolveValue(this.network, Array.from(this.valuesToResolve))
    }

    map(array, fieldPath = null) {
        if (!(array instanceof Array)) return array
        if (!fieldPath) {
            for (let i = 0; i < array.length; i++) {
                array[i] = this.resolve(array[i])
            }
        } else {
            const path = fieldPath.split('.')
            for (let value of array) {
                let key, i = 0
                while (true) {
                    key = path[i]
                    if (i === path.length - 1)
                        break
                    value = value[key]
                    i++
                }
                value[key] = this.resolve(value[key])
            }
        }
        return array
    }

    resolve(id, field = null, postProcessCallback = null) {
        if (id === undefined || id === null)
            return id
        this.valuesToResolve.add(id)
        return new DeferredJSONValueResolver(this, id, field, postProcessCallback)
    }
}


module.exports = {BaseIdResolver, BatchJSONResolver}