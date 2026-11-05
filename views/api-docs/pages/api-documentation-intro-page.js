import React, {useEffect} from 'react'
import {CodeBlock, useLocation} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {allPlans} from '../../../business-logic/billing/api-plans'
import ApiDocsView from '../api-docs-view'

export default function ApiDocumentationIntroPage() {
    const {hash} = useLocation()

    useEffect(() => {
        const chapter = hash && document.getElementById(hash.substring(1))
        if (chapter) {
            chapter.scrollIntoView({behavior: 'smooth'})
        }
    }, [hash])

    return <ApiDocsView>
        <article className="segment api-intro api-docs-text">
            <section id="introduction" className="api-intro-chapter">
                <div className="api-breadcrumbs text-small">Getting started</div>
                <h1 className="api-page-title">API for developers</h1>
                <p>
                    StellarExpert API provides access to the indexed Stellar ledger history and analytics: accounts, assets, Soroban
                    contracts, DEX markets, liquidity pools, transactions. Every endpoint lives
                    under <code>https://api.stellar.expert/explorer/&#123;network&#125;/</code>, where <code>network</code> is
                    either <code>public</code> or <code>testnet</code>.
                </p>
                <p>
                    Each operation in this reference is marked as <em>Paid</em> or <em>Free</em>. Calls to paid endpoints on the public
                    network are charged in compute units and require an identified caller, while free endpoints are open to anyone.
                    Every <code>testnet</code> endpoint is free of charge.
                </p>
            </section>
            <section id="authentication" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-key"/> Authentication</h2>
                <p>
                    Paid endpoints serve only identified callers: requests with an API key, or browser requests from a website origin
                    registered on the account. Both are managed in the <a href="/account">account dashboard</a>. Free endpoints and
                    Testnet do not require authentication.
                </p>
                <p>
                    Pass the API key in the <code>Authorization</code> header using the <code>Bearer</code> scheme: <code>Authorization:
                    Bearer &#123;API_KEY&#125;</code>. Other authorization schemes. For example:
                </p>
                <CodeBlock lang="js">
                    {`fetch('https://api.stellar.expert/{API_ENDPOINT}', {
    headers: {Authorization: 'Bearer {API_KEY}'}
})
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err))`}
                </CodeBlock>
                <ul>
                    <li>API keys are issued for any active paid plan. Keep them on your servers, never embed keys in web pages or mobile
                        apps.
                    </li>
                    <li>Browser applications on Astronomer and Cosmographer plans can register their website origins
                        instead (<code>example.com</code>, or <code>*.example.com</code> for all subdomains). Requests from a registered
                        origin are identified by the <code>Origin</code> header sent by the browser, so the page needs no API key, and
                        responses carry CORS headers for that origin (see <a href="/api-docs#cors">CORS</a>).
                    </li>
                    <li>All API keys and origins of an account share the same compute units balance and rate limits.</li>
                    <li>An unknown or revoked key does not trigger an error by itself. Such a request is processed as anonymous, so paid
                        endpoints respond with <code>402</code> HTTP code.
                    </li>
                    <li>A request with an API key is identified on free endpoints and Testnet as well, and counts towards the plan rate
                        limits. Anonymous requests are limited to 30 requests per minute.
                    </li>
                </ul>
                <p>
                    <strong>Pay per request.</strong> Clients without an account or without compute units left (AI agents, for example) can
                    pay for a single call to a paid endpoint in USDC on Stellar using
                    the <a href="https://github.com/coinbase/x402" target="_blank" rel="noopener noreferrer">x402</a> protocol. An
                    unidentified request receives <code>402</code> with the price in the <code>PAYMENT-REQUIRED</code> header, and the
                    client repeats it with a signed payment in the <code>PAYMENT-SIGNATURE</code> header. The payment is settled only if
                    the request succeeds, and the response is returned after the on-chain settlement, which takes several seconds.
                </p>
                <h3>Cross-Origin Resource Sharing</h3>
                <p>
                    This API sets Cross-Origin Resource Sharing (CORS) headers for browser requests
                    from origins registered on a customer account (see <a href="/api-docs#authentication">authentication</a>):
                    responses, preflight included, carry CORS headers for the requesting origin. Public free endpoints accept requests
                    from any origin. Other endpoints refuse requests from other websites with <code>403</code>.
                    CORS rules apply only to browser requests carrying the <code>Origin</code> header, server-side calls are not affected.
                </p>
                <p>
                    A request with custom headers (including <code>Authorization</code>) from an unregistered website triggers a CORS
                    preflight check. Instead of exposing an API key in the browser, register
                    the website origin, or proxy API calls through your own backend that holds the key.
                </p>
            </section>
            <section id="charges" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-credit-card"/> Charges &amp; estimates</h2>
                <p>
                    Every call to a paid endpoint is debited from the account balance in compute units. The price depends on the request:
                    lists are priced by the page size (the applied <code>limit</code>, not the number of returned records), batch
                    endpoints by the number of requested values, and some endpoints charge extra for filters. The plan allowance is reset
                    at the start of each billing month, unused compute units do not carry over.
                </p>
                <p>
                    Testnet calls are never charged. Calls made with an API key still appear in the account usage, at zero cost.
                </p>
                <p>
                    Add the <code>estimate</code> query parameter to a paid endpoint request to get its price without running the query:
                </p>
                <CodeBlock lang="js">
                    {`// GET /explorer/public/tx?address=GA…&limit=20&estimate
{"cost": 12}`}
                </CodeBlock>
                <ul className="list">
                    <li>A quote is not charged, but counts towards the rate limits.</li>
                    <li>Parameters are validated as usual, so a malformed request receives <code>400</code> instead of a quote.</li>
                    <li>Free endpoints ignore <code>estimate</code> and return data. On paid endpoints this parameter always switches the
                        response to a quote, whatever its value. On Testnet the quote is <code>{'{"cost": 0}'}</code>.
                    </li>
                    <li>The request panel of each paid operation in this reference shows the price for the current parameters.</li>
                </ul>
                <p>
                    Responses are cached on the server for a few seconds to several minutes depending on the endpoint, as stated in
                    the <code>Cache-Control: max-age</code> response header. A response served from the cache is charged like any other,
                    so cache data on your side instead of polling for the same data. Requests refused with <code>402</code>
                    or <code>429</code> are not charged, while an accepted request that fails later (<code>404</code> for a missing
                    record, for example) is. Once the balance is spent, paid endpoints respond with <code>402</code> until the allowance
                    is reset, while free endpoints and Testnet keep working.
                </p>
            </section>
            <section id="conventions" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-settings"/> Conventions</h2>
                <ul>
                    <li>All responses return JSON data unless stated otherwise. Append <code>?prettyPrint</code> to any request to receive
                        indented JSON.
                    </li>
                    <li>Amounts and supplies are integers designated in stroops (10^-7 units), serialized as strings.</li>
                    <li>Uint64 identifiers (in transactions, trades, operations, offers) serialized as decimal strings.</li>
                    <li>Timestamps represented as UNIX time unless a field description says otherwise.</li>
                    <li>For assets the standard input format is either <code>XLM</code>, <code>&#123;CODE&#125;-&#123;ISSUER&#125;</code>,
                        <code>&#123;CODE&#125;-&#123;ISSUER&#125;-&#123;TYPE&#125;</code>, or contract address ( 56-char string starting with <code>C</code>).
                    </li>
                    <li>Responses always use the fully qualified <code>&#123;CODE&#125;-&#123;ISSUER&#125;-&#123;TYPE&#125;</code> form for
                        classic assets.
                    </li>
                    <li>Parameters accepting several values use the array notation: <code>asset[]=XLM&amp;asset[]=USDC-GA5Z…KZVN</code>.
                    </li>
                </ul>
                <h3>Pagination</h3>
                <p>
                    List endpoints return <code>_links</code> (<code>self</code>, <code>prev</code>, <code>next</code>) for pagination
                    and <code>_embedded.records</code> array of data records, each carrying a <code>paging_token</code>. A page is
                    defined by three query parameters:
                </p>
                <ul>
                    <li><code>limit</code> – page size. Default and maximum values vary per endpoint (restricted by the maximum subscription
                        plan batch limit).
                    </li>
                    <li><code>order</code> – <code>asc</code> or <code>desc</code>. Most lists use descending order
                        (newest or highest first) by default.
                    </li>
                    <li><code>cursor</code> – <code>paging_token</code> of the last received record, the next page starts right after
                        it.
                    </li>
                </ul>
                <p>
                    The simplest way to walk through a list is to request the <code>next</code> link as is. It retains filters and sort
                    order of the original request, along with the applied page size and the cursor. Links are paths relative
                    to <code>https://api.stellar.expert</code>. Treat <code>paging_token</code> as an opaque value: its format differs
                    between endpoints (an id, a timestamp, or a position in a ranked list). Ranked lists (like assets sorted by rating)
                    are paged by position, so a record may move to an adjacent page if the ranking changes between requests.
                </p>
                <p>
                    <strong>Page size.</strong> On paid endpoints <code>limit</code> can't exceed the plan page size
                    (see <a href="/api-docs#rate-limits">limits by plan</a>) or the endpoint maximum, whichever is lower.
                    A <code>limit</code> above the cap is reduced silently instead of being refused, and so is the endpoint default page
                    size. Response <code>_links</code> always contain the limit that was actually applied. Free endpoints and Testnet are
                    not limited by plan: they serve up to 200 records per page, or the endpoint maximum. Batch parameters
                    (<code>asset[]</code>, <code>domain[]</code>) follow the same cap, but an oversized batch
                    is refused with <code>400</code> rather than truncated.
                </p>
                <CodeBlock lang="js">
                    {`// GET /explorer/public/tx?address=GA…&limit=500
// called with a Navigator plan API key, page size cap is 100
{
  "_links": {
    "self": {"href": "/explorer/public/tx?…&order=desc&limit=100"},
    "prev": {"href": "/explorer/public/tx?…&order=asc&limit=100&cursor=…"},
    "next": {"href": "/explorer/public/tx?…&order=desc&limit=100&cursor=…"}
  },
  "_embedded": {
    "records": [/* up to 100 records */]
  }
}`}
                </CodeBlock>
                <p>
                    <strong>Detecting the last page.</strong> The <code>next</code> link is present on every page, including the last
                    one, so it can't be used as an end-of-list marker. Instead:
                </p>
                <ol>
                    <li>Take the applied page size from the <code>limit</code> query parameter of <code>_links.self.href</code>, not from
                        the original request.
                    </li>
                    <li>If the page contains fewer records than that limit, or no records at all, it's the last one.</li>
                    <li>Otherwise, request <code>_links.next.href</code>. If the last page turns out to be exactly full, the next request
                        returns an empty page.
                    </li>
                </ol>
            </section>
            <section id="rate-limits" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-warning-circle"/> Errors &amp; rate limits</h2>
                <p>
                    Errors use the standard format <code>{'{"error": "<message>", "status": <http status>}'}</code>.
                </p>
                <table>
                    <thead>
                    <tr>
                        <th>Status</th>
                        <th>Meaning</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td><code>400</code></td>
                        <td>Invalid request parameter. The message reference the invalid parameter, for
                            example <code>{'Bad request. Invalid parameter: "asset". Too many values. Maximum 100 allowed per request.'}</code>
                        </td>
                    </tr>
                    <tr>
                        <td><code>402</code></td>
                        <td>A paid endpoint was called without a recognized API key or origin, or the account ran out of compute units.
                            Endpoints unavailable for your plan respond
                            with <code>{'Payment Required. This endpoint requires the <Plan> plan or higher.'}</code>
                        </td>
                    </tr>
                    <tr>
                        <td><code>403</code></td>
                        <td>A browser request from an origin that is not allowed by CORS rules. The response body is empty.</td>
                    </tr>
                    <tr>
                        <td><code>404</code></td>
                        <td>Requested record does not exist. Unknown API paths respond with a plain text body instead of JSON.</td>
                    </tr>
                    <tr>
                        <td><code>429</code></td>
                        <td>Rate limit exceeded. Retry after the delay from the <code>Retry-After</code> header (60 seconds for plan
                            limits).
                        </td>
                    </tr>
                    <tr>
                        <td><code>500</code></td>
                        <td>Internal server error. Retry later, and contact support if the error persists.</td>
                    </tr>
                    </tbody>
                </table>
                <p>
                    Plan rate limits apply to identified callers, per account (all its API keys and origins combined), over a rolling
                    minute and a rolling hour window. Requests refused with <code>429</code> do not count towards the limit. An
                    account with expired subscription or depleted compute units falls back to free plan limits. Anonymous requests (free
                    endpoints and Testnet) are limited to 30 requests per minute.
                </p>
                <table className="table">
                    <thead>
                    <tr>
                        <th>Plan</th>
                        <th>Requests / minute</th>
                        <th>Requests / hour</th>
                        <th>Page / batch size</th>
                    </tr>
                    </thead>
                    <tbody>
                    {allPlans.map(({key, name, limits}) => <tr key={key}>
                        <td>{name}</td>
                        <td>{formatLimit(limits.requestsPerMinute)}</td>
                        <td>{formatLimit(limits.requestsPerHour)}</td>
                        <td>{formatLimit(limits.batchSize)}</td>
                    </tr>)}
                    </tbody>
                </table>
                <p>
                    To avoid potential problems caused by those limitations it is advised to consider response caching or group queries
                    on the caller side in case of heavy API utilization.
                </p>
            </section>
        </article>
    </ApiDocsView>
}

/**
 * @param {Number|null} value - Plan limit, null when it is negotiated per contract
 * @return {String}
 */
function formatLimit(value) {
    return value ? formatWithAutoPrecision(value) : 'custom'
}
