import React from 'react'
import {Button} from '@stellar-expert/ui-framework'

/**
 * Closing call to action - points at the free tier rather than a paid plan
 * @return {JSX.Element}
 */
export default function CtaBlockView() {
    return <section className="subscription-block subscription-cta-block">
        <div className="container">
            <div className="card card-blank billing-card subscription-cta">
                <div className="subscription-cta-copy">
                    <h3>Start on Stargazer, move up when you need to</h3>
                    <div className="dimmed">
                        Generate a key in one click. No card until you cross the free limits.
                    </div>
                </div>
                <Button href="/account/api-keys">Start Exploring</Button>
            </div>
        </div>
    </section>
}