import React, {useEffect} from 'react'
import {CodeBlock, useLocation} from '@stellar-expert/ui-framework'
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
                    contracts, DEX markets, liquidity pools, transactions and network statistics. Every endpoint lives
                    under <code>https://api.stellar.expert/explorer/&#123;network&#125;/</code>, where <code>network</code> is
                    either <code>public</code> or <code>testnet</code>.
                </p>
            </section>
            <section id="authentication" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-key"/> Authentication</h2>
                <p>
                    Each API request (except for public endpoints) must use <code>Bearer</code> token authentication scheme with an API key or
                    access token. An API key can be obtained in the StellarExpert account dashboard with any active API Subscription tier.
                    Public API endpoints do not require authentication, but using auth token increases the available request rate limit for
                    such endpoints.
                </p>
                <p>
                    Pass API key in the <code>Authorization</code> header: <code>Authorization: Bearer &#123;API_KEY&#125;</code>. For
                    example:
                </p>
                <CodeBlock lang="js">
                    {`fetch('https://api.stellar.expert/{API_ENDPOINT}', {
    headers: {Authorization: 'Bearer {API_KEY}'}
})
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err))`}
                </CodeBlock>
            </section>
            <section id="conventions" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-settings"/> Conventions</h2>
                <ul>
                    <li>All responses return JSON data unless stated otherwise. Append <code>?prettyPrint</code> to any request to receive
                        indented JSON.
                    </li>
                    <li>Amounts and supplies are integers designated in stroops (10^-7 units) serialized as strings.</li>
                    <li>Uint64 identifiers (transactions, trades, operations, offers) are decimal strings.</li>
                    <li>Timestamps are UNIX seconds unless a field description says otherwise.</li>
                    <li>For assets the standard input format is either <code>XLM</code>, <code>&#123;CODE&#125;-&#123;ISSUER&#125;</code>,
                        <code>&#123;CODE&#125;-&#123;ISSUER&#125;-&#123;TYPE&#125;</code>, or contract address (starting with <code>C</code>).
                    </li>
                    <li>Responses always use the fully qualified <code>&#123;CODE&#125;-&#123;ISSUER&#125;-&#123;TYPE&#125;</code> form for
                        classic assets.
                    </li>
                </ul>
            </section>
            <section id="pagination" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-menu"/> Pagination</h2>
                <p>
                    List endpoints return <code>_links</code> (<code>self</code>, <code>prev</code>, <code>next</code>) for pagination
                    and <code>_embedded.records</code> array of data records. To load the next page, pass <code>paging_token</code> of the
                    last record as <code>cursor</code> query parameter.
                </p>
            </section>
            <section id="rate-limits" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-warning-circle"/> Errors &amp; rate limits</h2>
                <p>
                    Errors use the envelope <code>{'{"error": "<message>", "status": <http status>}'}</code>.
                </p>
                <p>
                    The effective API request rate may be a subject to rate limiting. In such cases the server returns 429 HTTP status code
                    error. To avoid potential problems caused by those limitations it is advised to consider response caching or group queries
                    on the caller side in case of heavy API utilization.
                </p>
            </section>
            <section id="cors" className="api-intro-chapter">
                <h2 className="api-section-title"><i className="icon icon-embed"/> Cross-Origin Resource Sharing</h2>
                <p>
                    This API features Cross-Origin Resource Sharing (CORS) implemented in compliance with W3C spec which allows cross-domain
                    communication from the browser. All responses have a wildcard same-origin response headers which makes them directly
                    accessible from any website.
                </p>
            </section>
        </article>
    </ApiDocsView>
}
