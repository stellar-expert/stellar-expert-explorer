import {isEstimateParam} from './request/api-call-cost-view'

/**
 * Icon font glyphs for the documentation sections
 * @type {Object<String, String>}
 */
const sectionIcons = {
    'account-api': 'icon-user-single',
    'asset-api': 'icon-coins',
    'asset-list-api': 'icon-grid',
    'balance-api': 'icon-wallet',
    'claimable-balance-api': 'icon-lock',
    'contract-api': 'icon-code',
    'directory-api': 'icon-bookmark',
    'domain-meta-api': 'icon-link',
    'ledger-api': 'icon-cubes',
    'liquidity-pool-api': 'icon-liquidity-pool',
    'market-api': 'icon-candlestick-chart',
    'offer-api': 'icon-dex-offer',
    'stats-api': 'icon-chart',
    'tx-api': 'icon-data-transfer'
}

/**
 * @param {String} slug - documentation section identifier
 * @return {String}
 */
export function sectionIcon(slug) {
    return sectionIcons[slug] || 'icon-document'
}

/**
 * Introduction page chapters listed in the "Getting started" navigation block
 * @type {{id: String, title: String, icon: String, href?: String}[]}
 */
export const introChapters = [
    {id: 'introduction', title: 'Introduction', icon: 'icon-document'},
    {id: 'authentication', title: 'Authentication', icon: 'icon-key'},
    {id: 'pricing', title: 'Pricing & photons', icon: 'icon-flash', href: '/pricing'},
    {id: 'conventions', title: 'Conventions', icon: 'icon-settings'},
    {id: 'pagination', title: 'Pagination', icon: 'icon-menu'},
    {id: 'rate-limits', title: 'Errors & rate limits', icon: 'icon-warning-circle'},
    {id: 'cors', title: 'CORS', icon: 'icon-embed'}
]

/**
 * @param {ApiSpec} spec
 * @param {ApiOperation} operation
 * @return {String}
 */
export function operationLink(spec, operation) {
    return `/api-docs/${spec.slug}/${operation.operationId}`
}

/**
 * Find the operations around the current one in the navigation order
 * @param {ApiCatalog} catalog
 * @param {String} slug - current section
 * @param {String} operationId - current operation
 * @return {{prev: {spec: ApiSpec, operation: ApiOperation}|null, next: {spec: ApiSpec, operation: ApiOperation}|null}}
 */
export function findAdjacentOperations(catalog, slug, operationId) {
    const all = catalog?.operations || []
    const position = all.findIndex(({spec, operation}) => spec.slug === slug && operation.operationId === operationId)
    if (position < 0)
        return {prev: null, next: null}
    return {prev: all[position - 1] || null, next: all[position + 1] || null}
}

/**
 * Case-insensitive operation filter matching the summary, path and operation id
 * @param {ApiOperation} operation
 * @param {String} filter - normalized (trimmed, lowercase) filter text
 * @return {Boolean}
 */
export function matchOperation(operation, filter) {
    if (!filter)
        return true
    return [operation.summary, operation.path, operation.operationId]
        .some(value => value?.toLowerCase().includes(filter))
}

/**
 * Short traits of an operation shown as badges next to its path
 * @param {ApiOperation} operation
 * @return {{title: String, hint: String}[]}
 */
export function describeOperationTraits(operation) {
    const params = operation.parameters || []
    const traits = []
    //only priced routes declare the "estimate" switch
    traits.push(params.some(isEstimateParam) ?
        {title: 'Paid', hint: 'Every call is charged in photons, the price depends on the arguments'} :
        {title: 'Free', hint: 'Calls to this endpoint are not charged'})
    if (params.some(p => p.in === 'query' && p.name === 'cursor'))
        traits.push({title: 'Paginated', hint: 'Returns a page of records with prev/next navigation links'})
    return traits
}
