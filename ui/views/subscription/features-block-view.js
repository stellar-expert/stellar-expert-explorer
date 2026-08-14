import React from 'react'
import cn from 'classnames'
import {platformFeatures} from './landing-content'

/**
 * Capability grid - what the subscription buys beyond the raw limits
 * @return {JSX.Element}
 */
export default function FeaturesBlockView() {
    return <section className="subscription-block">
        <div className="container">
            <h2>What you get</h2>
            <div className="subscription-feature-grid space">
                {platformFeatures.map(({icon, title, description}) => (
                    <div key={title} className="card card-blank billing-card subscription-feature">
                        <i className={cn('subscription-feature-icon icon', icon)}/>
                        <h4>{title}</h4>
                        <div className="dimmed text-small">{description}</div>
                    </div>
                ))}
            </div>
        </div>
    </section>
}