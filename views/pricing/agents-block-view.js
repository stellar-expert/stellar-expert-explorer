import React from 'react'
import cn from 'classnames'
import {x402Flow} from './landing-content'

/**
 * Pay-per-request access for AI agents over x402 - the option that needs no plan at all
 * @return {JSX.Element}
 */
export default function AgentsBlockView() {
    return <div className="subscription-agents">
        <div className="subscription-agents-watermark" aria-hidden="true">x402</div>
        <div>
            <div className="subscription-block-eyebrow">/ Agentic access</div>
            <h3>AI agents pay per request, no plan needed</h3>
            <p className="subscription-block-lead">
                No account, no API key: the payment itself authorizes the request. Built on the open x402
                standard and settled on Stellar in seconds.
            </p>
        </div>
        <div className="subscription-agents-flow">
            {x402Flow.map(({step, status}, i) => <React.Fragment key={step}>
                {i > 0 && <span className="subscription-agents-arrow" aria-hidden="true">→</span>}
                <span className={cn('subscription-agents-step', status)}>{step}</span>
            </React.Fragment>)}
        </div>
    </div>
}
