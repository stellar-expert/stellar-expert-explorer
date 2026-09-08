import React from 'react'
import {platformFeatures} from './landing-content'
import PricingIconView from './pricing-icons-view'

/**
 * Capability grid - what the subscription buys beyond the raw limits
 * @return {JSX.Element}
 */
export default function FeaturesBlockView() {
    return <section className="subscription-block">
        <div className="container">
            <h2>What you get</h2>
            <div className="subscription-feature-grid">
                {platformFeatures.map(({icon, title, description}) => <div key={title} className="subscription-feature">
                    <PricingIconView name={icon}/>
                    <div className="subscription-feature-title">{title}</div>
                    <div className="subscription-feature-text">{description}</div>
                </div>)}
            </div>
        </div>
    </section>
}