import React from 'react'
import ApiDocsView from '../api-docs-view'

export default function ApiDocumentationIntroPage() {
    return <ApiDocsView>
        <h2>Intro</h2>
        <div className="segment" style={{height: '80%'}}>
            [StellarExpert](https://stellar.expert/) API for developers. <br/>
            <p>[Auth]</p>
            <p>Cross-Origin Resource Sharing <br/>
                This API features Cross-Origin Resource Sharing (CORS) implemented in compliance with W3C spec. And that allows cross-domain
                communication from the browser. All responses have a wildcard same-origin which makes them completely public and accessible to everyone,
                including any code on any site.
            </p>
            <p>
                Rate Limiting and Caching Considerations <br/>
                The effective API request rate may be a subject to rate limiting. In such cases the server returns 429 HTTP status code error.
                To avoid potential problems caused by those limitations it is advised to consider response caching or group queries on the caller side
                in case of heavy API utilization.
            </p>
        </div>
    </ApiDocsView>
}