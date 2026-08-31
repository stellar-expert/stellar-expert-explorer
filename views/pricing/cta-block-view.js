import React from 'react'
import {Button} from '@stellar-expert/ui-framework'

/**
 * Closing call to action - points at the free tier rather than a paid plan
 * @return {JSX.Element}
 */
export default function CtaBlockView() {
    return <section className="subscription-block">
        <div className="container">
            <div className="card card-blank billing-card subscription-cta">
                <div className="row row-center">
                    <div className="column column-75">
                        <h3>Start on Stargazer, move up when you need to</h3>
                        <div className="dimmed">
                            Generate a key in one click. No card until you cross the free limits.
                        </div>
                    </div>
                    <div className="column column-20 text-center">
                        <div className="mobile-only micro-space"/>
                        <Button href="/account/api-keys" block>Start Exploring</Button>
                    </div>
                </div>
            </div>
        </div>
    </section>
}