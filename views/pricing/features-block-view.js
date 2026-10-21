import React from 'react'
import {platformFeatures, reliabilityStats} from './landing-content'
import PricingIconView from './pricing-icons-view'

/**
 * Track record and the infrastructure behind it
 * @return {JSX.Element}
 */
export default function FeaturesBlockView() {
    return <section className="subscription-block subscription-reliability-block">
        <div className="container">
            <div className="subscription-reliability">
                <div>
                    <div className="subscription-block-eyebrow">/ Reliability</div>
                    <h2>Time-proven infrastructure</h2>
                    <p className="subscription-block-lead">Tested every day by the whole Stellar ecosystem.</p>
                </div>
                <div className="subscription-reliability-stats">
                    {reliabilityStats.map(({value, label}) => <div key={label}>
                        <div className="subscription-reliability-value">{value}</div>
                        <div className="subscription-reliability-label">{label}</div>
                    </div>)}
                </div>
            </div>
            <div className="subscription-feature-grid">
                {platformFeatures.map(({icon, title, description}) => <div key={title} className="subscription-feature">
                    <span className="subscription-feature-icon"><PricingIconView name={icon}/></span>
                    <div>
                        <div className="subscription-feature-title">{title}</div>
                        <div className="subscription-feature-text">{description}</div>
                    </div>
                </div>)}
            </div>
        </div>
    </section>
}
