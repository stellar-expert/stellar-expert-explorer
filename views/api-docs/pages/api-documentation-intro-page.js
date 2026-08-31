import React from 'react'
import {CodeBlock} from '@stellar-expert/ui-framework'
import ApiDocsView from '../api-docs-view'

export default function ApiDocumentationIntroPage() {
    return <ApiDocsView>
        <h2>API for Developers - Intro</h2>
        <div className="segment" style={{minHeight: '80%', height: 'auto'}}>
            <h3>Authentication</h3>
            <p>
                Each API request (except for public endpoints) must use <code>Bearer</code> token authentication scheme with an API key or access token.
                An API key can be obtained in the StellarExpert account dashboard with any active API Subscription tier.
                Public API endpoints do not require authentication, but using auth token increases the available request rate limit for such endpoints.
            </p>
            <p>
                Pass API key in the <code>"Authorization"</code> header: <code>"Authorization: Bearer &#123;API_KEY&#125;"</code> <br/>
                For example:
                <CodeBlock lang="js">
{`fetch('https://api.stellar.expert/{API_ENDPOINT}, {
    headers: {Authorization: 'Bearer {API_KEY}'}
})
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err))`}
                </CodeBlock>
            </p>
            <br/>
            <h3>Cross-Origin Resource Sharing</h3>
            <p>
                This API features Cross-Origin Resource Sharing (CORS) implemented in compliance with W3C spec which allows cross-domain communication from the
                browser. All responses have a wildcard same-origin response headers which makes them directly accessible from any website.
            </p>
            <br/>
            <h3>Rate Limiting and Caching Considerations</h3>
            <p>
                The effective API request rate may be a subject to rate limiting. In such cases the server returns 429 HTTP status code error.
                To avoid potential problems caused by those limitations it is advised to consider response caching or group queries on the caller side
                in case of heavy API utilization.
            </p>
        </div>
    </ApiDocsView>
}