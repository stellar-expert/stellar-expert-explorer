function normalizeLimit(limit, defaultLimit = 10, maxLimit = 200) {
    limit = parseInt(limit || 0, 10)
    if (!limit || limit < 0) return defaultLimit //by default Horizon API
    if (limit > maxLimit) return maxLimit
    return limit
}

function normalizeSkip(skip) {
    skip = parseInt(skip || 0, 10)
    if (!skip || skip < 0) return 0
    return skip
}

function calculateSequenceOffset(skip, limit, cursor, order) {
    let offset = parseInt(cursor, 10) || 0
    if (normalizeOrder(order) === -1) {
        offset += normalizeSkip(skip)
    } else {
        offset -= normalizeSkip(skip) + normalizeLimit(limit) + 1
    }
    if (offset < 0) {
        offset = 0
    }
    return offset
}

/**
 * @param {'asc'|'desc'|1|-1} order
 * @param {1|-1} defaultOrder
 * @return {1|-1}
 */
function normalizeOrder(order, defaultOrder = -1) {
    if (order === 'asc') order = 1
    if (order === 'desc') order = -1
    order = parseInt(order || defaultOrder, 10)
    if (1 === order || -1 === order) return order
    return defaultOrder //contrary to Horizon, which uses asc order by default
}

function inverseOrder(order) {
    return order === 'asc' ? 'desc' : 'asc'
}

/**
 * @param {String} base
 * @param {Object} params
 * @param {Array<Object>} data
 * @return {MultiRows}
 */
function preparePagedData(base, params, data = []) {
    let {order, limit, cursor, allowedLinks, ...otherParams} = params

    function buildLink(order, cursor) {
        const qParams = {...otherParams, order, limit, cursor}
        const qParts = []
        for (const key of Object.keys(qParams)) {
            const value = qParams[key]
            if (value !== undefined && value !== null && value !== '') {
                if (value instanceof Array) {
                    for (const v of value) {
                        qParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`)
                    }
                } else {
                    qParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                }
            }
        }

        return {
            href: `${base}?${qParts.join('\u0026')}`
        }
    }

    switch (normalizeOrder(order)) {
        case 1:
            order = 'asc'
            break
        case -1:
        default:
            order = 'desc'
            break
    }

    const links = {
        self: buildLink(order, cursor)
    }

    if (!data.length) {
        links.prev = buildLink(inverseOrder(order), cursor)
        links.next = buildLink(order, cursor)
    } else {
        links.prev = buildLink(inverseOrder(order), data[0].paging_token)
        links.next = buildLink(order, data[data.length - 1].paging_token)
    }
    if (allowedLinks) {
        for (const key of Object.keys(links)) {
            if (!allowedLinks[key]) {
                delete links[key]
            }
        }
    }
    return {
        _links: links,
        _embedded: {
            records: data
        }
    }
}

function addPagingToken(data, skip = 0) {
    let i = 0
    for (const row of data) {
        row.paging_token = ++i + skip
    }
    return data
}

module.exports = {
    normalizeLimit,
    normalizeSkip,
    calculateSequenceOffset,
    normalizeOrder,
    preparePagedData,
    addPagingToken
}

/**
 * @typedef MultiRows
 * @property {{self: String, prev: String, next: String}} _links
 * @property {{records: Array<Object>}} _embedded
 */
