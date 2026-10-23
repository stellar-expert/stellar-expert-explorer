/**
 * Prose of the public subscription landing. The plan catalogue itself lives in
 * business-logic/billing/api-plans.js, shared with the account dashboard
 */

/**
 * Sample endpoint weights - ordered cheapest first so the glyphs read as a ramp
 */
export const computeUnitCosts = [
    {endpoint: '/tx/{hash}', units: 1, description: 'One transaction'},
    {endpoint: '/account/{id}/history', units: 2, description: 'Account history page'},
    {endpoint: '/asset/{id}/stats', units: 4, description: 'Aggregated asset stats'},
    {endpoint: '/market/{pair}/candles?7d', units: 8, description: 'Seven days of candles'}
]

/**
 * What indexing the ledger in-house takes - the left side of the self-hosted comparison
 */
export const selfHostedSteps = [
    'Run and sync your own Stellar node',
    'Backfill ledger history for the period you need',
    'Decode XDR into your own database',
    'Keep it running through every protocol upgrade'
]

/**
 * The right side of the self-hosted comparison
 */
export const hostedBenefits = [
    'Complete history, already indexed',
    'Protocol upgrades handled for you',
    'Nothing to host, sync or maintain'
]

/**
 * Data endpoints per domain - the coverage headline is their sum
 */
export const apiCoverage = [
    {count: 18, title: 'Smart contracts', description: 'Stats, events, state, invocations, WASM, users'},
    {count: 14, title: 'Assets', description: 'Stats, holders, supply, ratings, prices, lists'},
    {count: 9, title: 'Accounts', description: 'Stats, balances, history, trades, claimable balances'},
    {count: 9, title: 'Ledgers and network', description: 'Ledgers, protocol history, daily network stats'},
    {count: 8, title: 'Markets and prices', description: 'Pairs, tickers, candles, offers, price history'},
    {count: 6, title: 'Directory', description: 'Known accounts, asset lists, scam-domain blocklist'},
    {count: 5, title: 'Liquidity pools', description: 'Pool stats, share holders, trades, history'},
    {count: 4, title: 'Transactions', description: 'Search, count, lookup by hash or ledger'}
]

/**
 * Track record figures of the reliability block
 */
export const reliabilityStats = [
    {value: '99.92%', label: 'uptime in 2026'},
    {value: '9 years', label: 'in production'}
]

/**
 * Infrastructure behind the reliability claims
 */
export const platformFeatures = [
    {
        icon: 'index',
        title: 'Indexed queries',
        description: 'Queries run through distributed indexes, so heavy aggregations return in milliseconds.'
    },
    {
        icon: 'cluster',
        title: 'High-availability cluster',
        description: 'Independent servers in a failover configuration keep every data layer available.'
    },
    {
        icon: 'bolt',
        title: 'Fast delivery',
        description: 'Edge caching for API responses. Images, TOML and metadata served from a CDN.'
    }
]

/**
 * Round trip of an x402 request, as it reads left to right
 */
export const x402Flow = [
    {step: 'GET'},
    {step: '402 Payment Required', status: 'warning'},
    {step: 'Signed payment'},
    {step: '200 OK + data', status: 'success'}
]

/**
 * Rendered row-major into the grid, so the order here is left to right, then top to bottom
 */
export const faq = [
    {
        question: 'What exactly is a compute unit?',
        answer: 'A weight assigned to each endpoint by how much work the query does. ' +
            'Simple lookups cost less, heavy aggregations cost more. The reference lists every endpoint.'
    },
    {
        question: 'What happens when compute runs out?',
        answer: 'Nothing goes dark. Requests keep being served at free-tier limits until the next cycle, ' +
            'so a traffic spike degrades instead of failing.'
    },
    {
        question: 'Do unused compute units roll over?',
        answer: 'No. The allowance resets each billing cycle. If you regularly finish the month with compute units ' +
            'to spare, a smaller plan will cost less.'
    },
    {
        question: 'Can I change plan mid-cycle?',
        answer: 'Yes. Unused time on the current plan is credited towards the new one, so you never pay ' +
            'for the same period twice. Compute units are prorated too: the difference between the two ' +
            'allowances is credited for what is left of the cycle.'
    },
    {
        question: 'How do I pay?',
        answer: 'By card, PayPal, Apple Pay or Google Pay, in USD with taxes included. Cosmographer plans can be ' +
            'invoiced directly.'
    },
    {
        question: 'Can I use it in a commercial product?',
        answer: 'Yes, even a rival explorer. Cosmographer contracts can include licensable data. ' +
            'Check the Terms of Service for the limitations.'
    }
]
