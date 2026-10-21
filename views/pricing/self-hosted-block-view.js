import React from 'react'
import {hostedBenefits, selfHostedSteps} from './landing-content'
import {BlueprintRocketView, BlueprintSectionView} from './pricing-blueprint-view'
import PricingIconView from './pricing-icons-view'

/**
 * Weighs running an own indexer against querying the hosted one
 * @return {JSX.Element}
 */
export default function SelfHostedBlockView() {
    return <section className="subscription-block subscription-diy-block">
        <BlueprintRocketView/>
        <BlueprintSectionView/>
        <div className="container">
            <div className="subscription-block-eyebrow">/ Self-hosted?</div>
            <h2>No indexer to build or run</h2>
            <div className="subscription-diy-grid">
                <div className="subscription-diy-card">
                    <div className="subscription-diy-caption">Build it yourself</div>
                    <ol className="subscription-diy-steps">
                        {selfHostedSteps.map((step, i) => <li key={step}>
                            <span className="subscription-diy-step-number">{i + 1}</span>{step}
                        </li>)}
                    </ol>
                    <p className="subscription-diy-summary">
                        Requires setup, ongoing engineering and infrastructure cost.
                    </p>
                </div>
                <div className="subscription-diy-card hosted">
                    <div className="subscription-diy-caption">With StellarExpert</div>
                    <div className="subscription-diy-request">
                        <span>GET</span> {'/explorer/public/contract/{id}/events'}
                    </div>
                    <ul className="subscription-diy-benefits">
                        {hostedBenefits.map(benefit => <li key={benefit}>
                            <PricingIconView name="check"/>{benefit}
                        </li>)}
                    </ul>
                    <p className="subscription-diy-summary">
                        Ready to go immediately, with complete retrospective data.
                    </p>
                </div>
            </div>
        </div>
    </section>
}
