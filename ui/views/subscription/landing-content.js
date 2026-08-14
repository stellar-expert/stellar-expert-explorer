/**
 * Prose of the public subscription landing. The plan catalogue itself lives in
 * business-logic/billing/api-plans.js, shared with the account dashboard
 */

/**
 * Platform capabilities - the "What you get" grid
 */
export const platformFeatures = [
    {
        icon: 'icon-key',
        title: 'One key, every dataset',
        description: 'Accounts, assets, markets, liquidity pools, contracts and protocol history behind a single credential.'
    },
    {
        icon: 'icon-search-engine',
        title: 'Indexed, not proxied',
        description: 'Queries run against our own index, so aggregations that would time out on Horizon return in milliseconds.'
    },
    {
        icon: 'icon-cubes',
        title: 'Batch responses',
        description: 'Pull up to 1,000 records per call on Astronomer instead of paging through them one screen at a time.'
    },
    {
        icon: 'icon-lock',
        title: 'Origin restrictions',
        description: 'Pin each key to the domains that may use it, and revoke a leaked key instantly.'
    },
    {
        icon: 'icon-chart',
        title: 'Usage you can see',
        description: 'Per-endpoint photon breakdown updated live, so a runaway loop shows up before the invoice does.'
    },
    {
        icon: 'icon-lifebelt',
        title: 'Soft limits',
        description: 'Run out of photons and requests keep working at free-tier limits until the next cycle. Nothing goes dark.'
    }
]

/**
 * Sample endpoint weights - ordered cheapest first so the bars read as a ramp
 */
export const photonCosts = [
    {endpoint: '/tx/{hash}', photons: 1},
    {endpoint: '/account/{id}/history', photons: 2},
    {endpoint: '/asset/{id}/stats', photons: 4},
    {endpoint: '/market/{pair}/candles?7d', photons: 8}
]

/**
 * Rendered row-major into two columns, so the order here is left, right, left, right...
 */
export const faq = [
    {
        question: 'What exactly is a photon?',
        answer: 'A photon is one compute unit — a weight assigned to each endpoint based on how much work the ' +
            'query does. Simple lookups cost one photon, heavy aggregations cost more. The reference table lists ' +
            'every endpoint.'
    },
    {
        question: 'What happens when I run out?',
        answer: 'Nothing goes dark. Once the monthly allowance is spent, requests keep being served at free-tier ' +
            'limits until the next cycle starts, so a traffic spike degrades instead of failing.'
    },
    {
        question: 'Can I change plan mid-cycle?',
        answer: 'Yes. Change or cancel at any time — unused time on the current plan is credited towards the ' +
            'upgrade, so you never pay for the same period twice.'
    },
    {
        question: 'How do I pay?',
        answer: 'By card or crypto through our payment processor. Prices are quoted in USD. Cosmographer plans ' +
            'can be invoiced instead.'
    },
    {
        question: 'Do unused photons roll over?',
        answer: 'No. The allowance resets at the start of each billing cycle. If you regularly finish the month ' +
            'with photons to spare, a smaller plan will cost less.'
    },
    {
        question: 'Is there a rate limit on Stargazer?',
        answer: 'Yes — 60 requests per minute across the free public endpoints, with up to 25 items per batch ' +
            'response. No registration required.'
    }
]