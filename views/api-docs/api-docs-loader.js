import settings from '../../app-settings'
import parseApiSpec from './api-spec-parser'

const titlePrefix = 'StellarExpert API - '

const pending = new Map() //url|slug -> Promise

/**
 * Fetch a resource once and cache the resulting promise for the rest of the session
 * @param {String} key - cache key
 * @param {Function} load - loader callback
 * @return {Promise}
 */
function cached(key, load) {
    let promise = pending.get(key)
    if (!promise) {
        promise = load()
            .catch(e => {
                pending.delete(key) //do not cache failures - allow a retry on remount
                throw e
            })
        pending.set(key, promise)
    }
    return promise
}

function fetchJson(url) {
    return fetch(url)
        .then(resp => {
            if (!resp.ok)
                throw new Error(`Failed to load API documentation (HTTP ${resp.status})`)
            return resp.json()
        })
}

/**
 * @typedef {{}} ApiDocsIndexEntry
 * @property {String} slug - documentation section identifier used in the URL
 * @property {String} title - documentation section title
 * @property {String} url - absolute spec URL
 */

/**
 * @typedef {{}} ApiDocsIndex
 * @property {String} version - API version
 * @property {String} termsOfService - ToS link
 * @property {ApiDocsIndexEntry[]} docs - available documentation sections
 */

/**
 * Load the list of available API documentation sections
 * @return {Promise<ApiDocsIndex>}
 */
export function loadApiDocsIndex() {
    return cached('index', async () => {
        const apiEndpoint = settings.apiEndpoint
        const index = await fetchJson(apiEndpoint + '/api-docs/index')
        return {
            version: index.version,
            termsOfService: index.termsOfService,
            docs: (index.docs || []).map(entry => ({
                slug: entry.docs.split('/').pop().replace(/\.json$/, ''),
                title: entry.name.replace(titlePrefix, ''),
                url: apiEndpoint + entry.docs
            }))
        }
    })
}

/**
 * Find a documentation section by its URL parameter
 * @param {ApiDocsIndex} index - documentation index
 * @param {String} param - "doc" route parameter
 * @return {ApiDocsIndexEntry|null}
 */
export function resolveDoc(index, param) {
    if (!index || !param)
        return null
    const docs = index.docs
    return docs.find(doc => doc.slug === param) ||
        //fallback for legacy tag-based links, like "/api-docs/Claimable balances"
        docs.find(doc => normalize(doc.title) === normalize(param)) ||
        null
}

function normalize(value) {
    let decoded = value
    try {
        decoded = decodeURIComponent(value)
    } catch (e) {
        //malformed percent-encoding in the URL - match the raw value instead
    }
    return decoded.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Load and parse the API spec for a given documentation section
 * @param {String} slug - "doc" route parameter
 * @return {Promise<ApiSpec|null>}
 */
export function loadApiSpec(slug) {
    return cached('spec:' + slug, async () => {
        const index = await loadApiDocsIndex()
        const entry = resolveDoc(index, slug)
        if (!entry)
            return null
        return parseApiSpec(await fetchJson(entry.url), entry)
    })
}
