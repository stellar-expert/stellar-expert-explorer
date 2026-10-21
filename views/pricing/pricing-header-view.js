import React from 'react'
import {resolvePath} from '../../business-logic/path'

/**
 * Landing header
 * @return {JSX.Element}
 */
export default function PricingHeaderView() {
    return <div className="top-block pricing-header">
        <div className="container nav relative">
            <a href={resolvePath('')} className="logo">
                Stellar<img alt="StellarExpert" src="/img/stellar-expert-blue.svg"/>Expert
            </a>
            <nav className="pricing-header-nav">
                <a href={resolvePath('')} className="desktop-only">Explorer</a>
                <a href="/api-docs">API docs</a>
                <a href="/pricing" className="current desktop-only">Pricing</a>
                <a href="/login" className="pricing-header-sign-in">Sign in</a>
            </nav>
        </div>
    </div>
}
