import React from 'react'
import {resolvePath} from '../../business-logic/path'

/**
 * Landing header
 * @return {JSX.Element}
 */
export default function PricingHeaderView() {
    return <div className="top-block pricing-header">
        <div className="container nav relative">
            <a href={resolvePath('')} className="logo">
                Stellar<img alt="StellarExpert" src="/img/stellar-expert-blue.svg"/>Expert
            </a>
        </div>
    </div>
}
