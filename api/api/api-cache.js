const {LRUCache} = require('lru-cache')
const config = require('../app.config')
const {timeUnits} = require('../utils/date-utils')

//list of headers that should never be cached
const headerBlacklist = ['access-control-allow-origin']

function formatKey(req, res) {
    return req.originalUrl || req.url
}

function filterBlacklistedHeaders(headers) {
    return Object.keys(headers)
        .filter(key => headerBlacklist.indexOf(key) === -1)
        .reduce((acc, header) => {
            acc[header] = headers[header]
            return acc
        }, {})
}

function makeResponseCacheable(cacheInstance, req, res, next, key, duration, toggle) {
    res._apicache = {
        write: res.write,
        writeHead: res.writeHead,
        end: res.end,
        cacheable: true,
        content: undefined
    }

    res.writeHead = function () {
        //add cache control headers
        if (shouldCacheResponse(req, res, toggle)) {
            res.header('cache-control', 'max-age=' + (duration / timeUnits.second).toFixed(0))
        } else {
            res.header('cache-control', 'no-cache, no-store, must-revalidate')
        }

        res._apicache.headers = Object.assign({}, res._headers)
        return res._apicache.writeHead.apply(this, arguments)
    }

    //patch res.write
    res.write = function (content) {
        accumulateContent(res, content)
        return res._apicache.write.apply(this, arguments)
    }

    //patch res.end
    res.end = function (content, encoding) {
        if (shouldCacheResponse(req, res, toggle)) {
            accumulateContent(res, content)

            if (res._apicache.cacheable && res._apicache.content) {
                const headers = res._apicache.headers || res.getHeaders()
                const cacheObject = {
                    status: res.statusCode,
                    headers: filterBlacklistedHeaders(headers),
                    data: res._apicache.content,
                    encoding
                }

                cacheInstance.set(key, cacheObject, duration)
            }
        }
        return res._apicache.end.apply(this, arguments)
    }
    next()
}

function sendCachedResponse(request, response, cacheObject, toggle) {
    if (toggle && !toggle(request, response))
        return false

    const headers = (typeof response.getHeaders === 'function') ? response.getHeaders() : response._headers

    Object.assign(headers, cacheObject.headers)

    //unstringify buffers
    let data = cacheObject.data
    if (data && data.type === 'Buffer') {
        data = new Buffer(data.data)
    }

    //test Etag against If-None-Match for 304
    const cachedEtag = cacheObject.headers.etag
    const requestEtag = request.headers['if-none-match']

    if (requestEtag && cachedEtag === requestEtag) {
        response.writeHead(304, headers)
        return response.end()
    }

    response.writeHead(cacheObject.status || 200, headers)

    return response.end(data, cacheObject.encoding)
}

function accumulateContent(res, content) {
    if (content) {
        if (typeof (content) === 'string') {
            res._apicache.content = (res._apicache.content || '') + content
        } else if (Buffer.isBuffer(content)) {
            let oldContent = res._apicache.content

            if (typeof oldContent === 'string') {
                oldContent = !Buffer.from ? new Buffer(oldContent) : Buffer.from(oldContent)
            }

            if (!oldContent) {
                oldContent = !Buffer.alloc ? new Buffer(0) : Buffer.alloc(0)
            }

            res._apicache.content = Buffer.concat([oldContent, content], oldContent.length + content.length)
        } else {
            res._apicache.content = content
        }
    }
}

function shouldCacheResponse(request, response, toggle) {
    if (!response)
        return false
    if (toggle && !toggle(request, response))
        return false

    /*var opt = globalOptions
    var codes = opt.statusCodes*/
    /*if (codes.exclude && codes.exclude.length && codes.exclude.indexOf(response.statusCode) !== -1) return false
    if (codes.include && codes.include.length && codes.include.indexOf(response.statusCode) === -1) return false*/
    return true
}

class ApiCache {
    constructor() {
        this.cacheGroups = {}
        this.stats = {
            created: new Date()
        }
    }

    createBucket(group, size, maxAge) {
        maxAge = this.getDuration(maxAge)
        const cacheInstance = this.cacheGroups[group] = new LRUCache({
            max: size,
            ttl: maxAge
        })
        cacheInstance.maxAge = maxAge
        this.stats[group] = {
            hit: 0,
            miss: 0
        }
    }

    clear(group = null) {
        if (group) {
            this.cacheGroups[group].reset()
        } else {
            for (const cacheGroup of Object.values(this.cacheGroups)) {
                cacheGroup.reset()
            }
        }
    }

    getDuration(duration, defaultDuration) {
        if (typeof duration === 'number')
            return duration

        if (typeof duration === 'string') {
            let [match, value, unit] = duration.match(/^([\d.,]+)\s?(\w+)$/)

            if (unit) {
                value = parseFloat(value)
                unit = unit.replace(/s$/i, '').toLowerCase()
                if (unit === 'm') {
                    unit = 'ms'
                }
                return (value || 1) * (timeUnits[unit] || 0)
            }
        }

        return defaultDuration
    }

    /**
     * Middleware
     * @param {string} group - cache group
     * @param {string|number} [duration] - custom cache duration (only if default group settings are not applicable)
     * @param {function} [middlewareToggle] - optional custom function that can be called to determine whether the response should be cached or not
     * @returns {function}
     */
    cache(group, duration, middlewareToggle) {
        const cacheInstance = this.cacheGroups[group]
        const stat = this.stats[group]
        duration = this.getDuration(duration, cacheInstance.maxAge)

        return function (req, res, next) {
            //initial bypass chances
            if (config.apiCacheDisabled || req.headers['x-apicache-bypass'] || req.headers['x-apicache-force-fetch']) {
                return next()
            }

            //embed timer
            req.apicacheTimer = new Date()

            const key = formatKey(req, res)

            //attempt cache hit
            const cached = cacheInstance.get(key)

            //send if cache hit from memory-cache
            if (cached) {
                const sent = sendCachedResponse(req, res, cached, middlewareToggle)
                stat.hit++
                if (sent !== false) return
            }

            stat.miss++
            return makeResponseCacheable(cacheInstance, req, res, next, key, duration, middlewareToggle)
        }
    }
}

module.exports = new ApiCache()