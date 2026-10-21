import React, {useCallback} from 'react'

/**
 * Opening band of subscription landing - pitch, entry points, radar artwork
 * @return {JSX.Element}
 */
export default function HeroBlockView() {
    const scrollToPlans = useCallback(e => {
        e.preventDefault()
        document.getElementById('plans')?.scrollIntoView({behavior: 'smooth'})
    }, [])

    return <section className="subscription-hero">
        <div className="subscription-hero-sky"/>
        <div className="container">
            <div className="row">
                <div className="column column-50">
                    <div className="subscription-eyebrow">StellarExpert API plans</div>
                    <h1>
                        Every account, asset and<br/>
                        trade on Stellar<span className="accent"></span><br/>
                        With one API key<span className="accent"></span>
                    </h1>
                    <div className="subscription-hero-request">
                        <span className="subscription-hero-request-method">GET</span>
                        <span className="subscription-hero-request-path">{'/explorer/public/contract/{id}/events'}</span>
                        <span className="subscription-hero-request-status">200 OK</span>
                    </div>
                    <p className="subscription-lead">
                        The same indexed data that powers the explorer, fully indexed and aggregated, is available for your own app.
                        <br/>
                        Start developing right away or reach us for a custom plan.
                    </p>
                    <div className="row space subscription-hero-actions">
                        <div className="column column-50">
                            <a href="#plans" className="button button-block" onClick={scrollToPlans}>Compare plans</a>
                        </div>
                        <div className="mobile-only space"/>
                        <div className="column column-50">
                            <a href="/api-docs" target="_blank" className="button button-block button-outline">
                                Read the docs
                            </a>
                        </div>
                    </div>
                </div>
                <div className="column column-50">
                    <div className="subscription-radar">
                        <div className="subscription-radar-art">
                            <div className="dish">
                            </div>
                        </div>
                        <div className="subscription-radar-caption">Indexing the network, continuously</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
}