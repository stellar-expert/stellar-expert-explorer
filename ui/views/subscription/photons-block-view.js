import React from 'react'
import {photonCosts} from './landing-content'

const maxPhotons = Math.max(...photonCosts.map(cost => cost.photons))

/**
 * Explains the billing unit and shows what a few endpoints actually cost
 * @return {JSX.Element}
 */
export default function PhotonsBlockView() {
    return <section className="subscription-block">
        <div className="container">
            <div className="card card-blank billing-card subscription-photons">
                <div className="row row-center">
                    <div className="column column-50">
                        <h3>Photons, not request counts</h3>
                        <p className="subscription-lead">
                            A photon is our name for one compute unit. Each API request charges a different number
                            of photons depending on how much work the query does: a single transaction lookup costs
                            one photon, a seven-day market aggregation costs eight. You are never charged for
                            cached responses.
                        </p>
                        <a href="/openapi.html" target="_blank">Full photon reference&nbsp;→</a>
                    </div>
                    <div className="column column-50">
                        {/*stacked on a phone, the first row would otherwise sit straight on the link above*/}
                        <div className="mobile-only micro-space"/>
                        {photonCosts.map(({endpoint, photons}) => <div key={endpoint} className="subscription-cost">
                            <code className="billing-code">{endpoint}</code>
                            <span className="subscription-cost-bar">
                                <span style={{width: `${photons / maxPhotons * 100}%`}}/>
                            </span>
                            <span className="subscription-cost-value">
                                {photons} <span className="dimmed text-tiny">photons</span>
                            </span>
                        </div>)}
                    </div>
                </div>
            </div>
        </div>
    </section>
}