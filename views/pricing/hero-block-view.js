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
        <div className="container">
            <div className="row row-center">
                <div className="column column-50">
                    <div className="subscription-eyebrow">StellarExpert API plans</div>
                    <h1>
                        Every account, asset and<br/>
                        trade on Stellar<span className="accent">.</span><br/>
                        One API key<span className="accent">.</span>
                    </h1>
                    <p className="subscription-lead">
                        The same indexed data that powers the explorer, available for your own product.
                        Pick a plan by the photons you burn each month, not by seat count or feature checklists.
                    </p>
                    <div className="space">
                        <a href="#plans" className="button" onClick={scrollToPlans}>See plans</a>
                        <a href="/openapi.html" target="_blank" className="button button-outline">Read the docs</a>
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
