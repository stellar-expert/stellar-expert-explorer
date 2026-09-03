import React from 'react'

/**
 * Condensed footer for the public pricing landing
 * @return {JSX.Element}
 */
export default function PricingFooterView() {
    return <div className="pricing-footer">
        <div className="container text-center">
            <div>{new Date().getFullYear()}&nbsp;©&nbsp;StellarExpert <span className="dimmed">v{appVersion}</span>
            </div>
            <div className="pricing-footer-links">
                <a href="/openapi.html" target="_blank">Open API docs</a>
                <a href="/info/tos">Terms of use</a>
                <a href="/info/privacy">Privacy policy</a>
                <a href="https://stellarexpert.statuspage.io/" target="_blank" rel="noreferrer noopener">Status</a>
            </div>
        </div>
    </div>
}