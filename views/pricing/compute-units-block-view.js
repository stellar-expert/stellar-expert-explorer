import React from 'react'
import {computeUnitCosts} from './landing-content'

/**
 * Explains the billing unit and shows what a few endpoints actually cost
 * @return {JSX.Element}
 */
export default function ComputeUnitsBlockView() {
    return <div className="subscription-compute-units">
        <div>
            <h3>What a compute unit buys</h3>
            <p className="subscription-compute-units-lead">
                Endpoints are weighted by the work a query does, so a lookup and a week of candles are not billed
                the same. Cached responses are free.
            </p>
        </div>
        <div className="subscription-cost-list">
            {computeUnitCosts.map(({endpoint, units, description}) => <div key={endpoint} className="subscription-cost">
                <div className="subscription-cost-weight">
                    <span className="subscription-cost-value">
                        {units}<span>unit{units === 1 ? '' : 's'}</span>
                    </span>
                    <span className="subscription-cost-bar" aria-hidden="true">
                        {Array.from({length: units}, (_, i) => <span key={i}/>)}
                    </span>
                </div>
                <code className="subscription-cost-endpoint">{endpoint}</code>
                <div className="subscription-cost-description">{description}</div>
            </div>)}
        </div>
    </div>
}
