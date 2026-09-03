import React from 'react'
import {photonCosts} from './landing-content'

const barWidthPerPhoton = 1.2

/**
 * Explains the billing unit and shows what a few endpoints actually cost
 * @return {JSX.Element}
 */
export default function PhotonsBlockView() {
    return <section className="subscription-block">
        <div className="container">
            <div className="subscription-photons">
                <div>
                    <h3>Photons, not request counts</h3>
                    <p className="subscription-photons-lead">
                        A photon is our name for one compute unit. Each API request charges a different number
                        of photons depending on how much work the query does: a single transaction lookup costs
                        one photon, a seven-day market aggregation costs eight. You are never charged for
                        cached responses.
                    </p>
                    <a href="/openapi.html" target="_blank" className="subscription-photons-link">
                        Full photon reference&nbsp;→
                    </a>
                </div>
                <div className="subscription-cost-list">
                    {photonCosts.map(({endpoint, photons}) => <div key={endpoint} className="subscription-cost">
                        <span className="subscription-cost-endpoint">{endpoint}</span>
                        <span className="subscription-cost-bar" style={{width: `${photons * barWidthPerPhoton}rem`}}/>
                        <span className="subscription-cost-value">{photons} photon{photons === 1 ? '' : 's'}</span>
                    </div>)}
                </div>
            </div>
        </div>
    </section>
}