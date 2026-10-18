import React from 'react'
import Footer from '../layout/footer-view'
import {resolvePath} from '../../business-logic/path'

export default function ApiDocsLayout({version, toggleMenu, children}) {
    return <div className="page-wrapper">
        <div className="blue-ribbon"/>
        <div className="top-block api-docs-header">
            <div className="container">
                <div className="api-docs-header-title">
                    <a href={resolvePath('')} className="logo">
                        Stellar<img alt="StellarExpert" src="/img/stellar-expert-blue.svg"/>Expert
                    </a>
                    <span className="api-docs-header-divider dimmed">/</span>
                    <a href="/api-docs" className="api-docs-header-name">API Docs</a>
                    {!!version && <span className="api-docs-version text-tiny">v{version}</span>}
                </div>
                <nav className="api-docs-header-nav desktop-only">
                    <a href={resolvePath('')}>Explorer</a>
                    <a href="/pricing">Pricing</a>
                    <a href="https://stellarexpert.statuspage.io/" target="_blank" rel="noreferrer noopener">Status</a>
                </nav>
                <a className="api-docs-menu-toggle mobile-only" href="#" onClick={toggleMenu} title="Toggle navigation">
                    <i className="icon icon-menu"/>
                </a>
            </div>
        </div>
        <div className="api-documentation page-container">
            <div className="container">
                {children}
            </div>
        </div>
        <Footer/>
    </div>
}
