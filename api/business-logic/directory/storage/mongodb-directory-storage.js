const mongodb = require('../../../connectors/mongodb-connector'),
    {Int32} = require('bson'),
    QueryBuilder = require('../../query-builder'),
    {normalizeOrder, normalizeLimit, preparePagedData} = require('../../api-helpers'),
    {validateAccountAddress} = require('../../validators'),
    {parseDate} = require('../../../utils/date-utils')

const mongodbStorage = {
    get db() {
        return mongodb.public
    },
    get directoryCollection() {
        return this.db.collection('directory')
    },
    get requestsCollection() {
        return this.db.collection('directory_requests')
    },
    get changesCollection() {
        return this.db.collection('directory_changes')
    },
    get blockedDomainsCollection() {
        return this.db.collection('blocked_domains')
    },
    async getDirectoryEntryVersion(address) {
        validateAccountAddress(address)
        const entry = await this.directoryCollection.findOne({_id: address}, {projection: {version: 1}})
        return entry ? (entry.version || 0) : -1
    },
    async saveRequest(request) {
        const {address, ts, ...props} = request
        await this.requestsCollection
            .insertOne({_id: ts.getTime() + '_' + address, ts, ...props})
    },
    async deleteRequest(id) {
        await this.requestsCollection
            .deleteOne({_id: id})
    },
    async updateDirectoryEntry(changes) {
        const {address, ts, author, signature, ...entry} = changes
        await this.changesCollection
            .insertOne({_id: new Int32(ts.getTime()), ...changes})
        await this.directoryCollection
            .replaceOne({_id: address}, {_id: address, ...entry}, {upsert: true})
    },
    async getDirectoryEntry(address, extended = false) {
        validateAccountAddress(address)
        const entry = await this.directoryCollection.findOne({_id: address})
        if (!entry) return null
        const {_id, domain, name, tags, notes, version} = entry
        const res = {
            address: _id,
            name,
            domain,
            tags
        }
        if (extended) {
            if (notes) {
                res.notes = notes
            }
            res.version = version || 0
            res.changesHistory = await this.changesCollection
                .find({address: _id})
                .sort({_id: 1})
                .project({_id: 0, address: 0})
                .toArray()
        }
        return res
    },
    async deleteDirectoryEntry(changes) {
        const {address, ts} = changes
        await this.changesCollection
            .insertOne({_id: new Int32(ts.getTime()), ...changes})
        await this.directoryCollection
            .deleteOne({_id: address})
    },
    async getChangesHistory(basePath, address, {cursor, order, limit}) {
        const q = new QueryBuilder({address})
            .setLimit(limit)
            .setSort('_id', order, -1)

        if (cursor) {
            q.addQueryFilter({_id: {[normalizeOrder(order) === 1 ? '$gt' : '$lt']: parseInt(cursor) || 0}})
        }

        let changes = await this.changesCollection
            .find(q.query)
            .project({
                _id: 0
            })
            .sort(q.sort)
            .limit(q.limit)
            .toArray()

        for (const ch of changes) {
            ch.paging_token = ch.ts
        }

        return preparePagedData(basePath, {sort: 'ts', order, cursor, limit: q.limit}, changes)
    },
    async getDirectoryEntries(basePath, {cursor, order, limit, address, search, tag}) {
        order = normalizeOrder(order, 1)
        const q = new QueryBuilder({})
            .setLimit(limit)

        if (address instanceof Array) {
            q.addQueryFilter({_id: {$in: address}})
        }
        if (tag instanceof Array) {
            q.addQueryFilter({tags: {$in: tag}})
        }
        if (cursor) {
            q.addQueryFilter({_id: {[normalizeOrder(order) === 1 ? '$gt' : '$lt']: cursor}})
        }
        if (search) {
            //full-text search
            q.addQueryFilter({$text: {$search: search.trim()}})
            //score should have the highest priority
            q.setSort({score: {$meta: 'textScore'}})
        }

        q.setSort('_id', order, 1)

        let entries = await this.directoryCollection
            .find(q.query)
            .sort(q.sort)
            .limit(q.limit, 200, 10)
            .project({domain: 1, tags: 1, name: 1})
            .toArray()

        entries = entries.map(({_id, ...otherProps}) => ({
            address: _id,
            paging_token: _id,
            ...otherProps
        }))

        return preparePagedData(basePath, {
            sort: 'address',
            order,
            cursor,
            limit: q.limit,
            address,
            search,
            tag
        }, entries)
    },
    async getRecentDirectoryEntries(basePath, {since, cursor, limit}) {
        const skip = parseInt(cursor) || 0
        limit = normalizeLimit(limit, 200, 1000)
        since = parseDate(since) || 0
        let entries = await this.changesCollection
            .aggregate([
                {
                    $match: {_id: {$gt: (since + 1) * 1000}}
                },
                {
                    $group: {
                        _id: '$address',
                        domain: {$last: '$domain'},
                        name: {$last: '$name'},
                        tags: {$last: '$tags'},
                        updated: {$last: '$_id'},
                        deleted: {$last: '$deleted'}
                    }
                },
                {
                    $sort: {updated: 1}
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ])
            .toArray()

        entries = entries.map(({_id, deleted, domain, updated, ...otherProps}, i) => {
            const res = {
                address: _id,
                paging_token: i + skip + 1,
                updated: Math.floor(updated / 1000),
                ...otherProps
            }
            if (domain) {
                res.domain = domain
            }
            if (deleted) {
                res.deleted = true
            }
            return res
        })

        return preparePagedData(basePath, {
            since,
            order: 'asc',
            cursor: skip,
            limit,
            allowedLinks: {
                self: 1,
                next: 1
            }
        }, entries)
    },
    async listBlockedDomains(basePath, {cursor, limit, order, search}) {
        limit = normalizeLimit(limit, 1000, 1000)
        order = normalizeOrder(order, 1)
        const query = {}
        if (cursor) {
            query._id = {[order === 1 ? '$gt' : '$lt']: cursor}
        }
        if (search) {
            //full-text search
            query._id = {...(query._id || {}), $regex: createSearchRegex(search.toLowerCase())}
        }

        let entries = await this.blockedDomainsCollection
            .find(query)
            .sort({_id: order})
            .limit(limit)
            .toArray()

        entries = entries.map(({_id}) => ({domain: _id, paging_token: _id}))

        return preparePagedData(basePath, {
            order,
            cursor,
            limit,
            search
        }, entries)
    },
    async isDomainBlocked(domain) {
        domain = domain.toLowerCase()
        const options = [domain] //check for domain itself and check if upper-level domain blocked
        while (true) {
            domain = domain.substring(domain.indexOf('.') + 1)
            if (!domain.includes('.')) break //we reached the top level domain
            options.push(domain)
        }
        return this.blockedDomainsCollection
            .findOne({_id: {$in: options}})
            .then(r => !!r)
    },
    async blockDomain(domain) {
        domain = domain.toLowerCase()
        await this.blockedDomainsCollection
            .replaceOne({_id: domain}, {_id: domain}, {upsert: true})
    }
}

function createSearchRegex(search) {
    return new RegExp(search.trim().replace(/\./g, '\\.'))
}

module.exports = mongodbStorage