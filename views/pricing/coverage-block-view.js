import React from 'react'
import {apiCoverage} from './landing-content'

const totalEndpoints = apiCoverage.reduce((total, {count}) => total + count, 0)

/**
 * Breadth of the data API - endpoint counts per domain
 * @return {JSX.Element}
 */
export default function CoverageBlockView() {
    return <section className="subscription-block subscription-coverage-block">
        <div className="container">
            <div className="subscription-coverage">
                <div className="subscription-coverage-summary">
                    <div className="subscription-block-eyebrow">/ Coverage</div>
                    <h2>The most comprehensive Stellar API</h2>
                    <div className="subscription-coverage-total">{totalEndpoints}</div>
                    <div className="subscription-coverage-text">
                        data endpoints, every record back to 2015. Smart contracts since the Soroban launch in 2024.
                    </div>
                </div>
                <div className="subscription-coverage-grid">
                    {apiCoverage.map(({count, title, description}) => <div key={title} className="subscription-coverage-item">
                        <div className="subscription-coverage-count">{count}</div>
                        <div className="subscription-coverage-title">{title}</div>
                        <div className="subscription-coverage-description">{description}</div>
                    </div>)}
                </div>
            </div>
        </div>
    </section>
}
