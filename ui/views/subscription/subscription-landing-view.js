import React from 'react'
import HeroBlockView from './hero-block-view'
import PlansBlockView from './plans-block-view'
import FeaturesBlockView from './features-block-view'
import PhotonsBlockView from './photons-block-view'
import FaqBlockView from './faq-block-view'
import CtaBlockView from './cta-block-view'
import './subscription-landing.scss'

export default function SubscriptionLandingView() {
    return <div className="subscription-landing">
        <HeroBlockView/>
        <PlansBlockView/>
        <FeaturesBlockView/>
        <PhotonsBlockView/>
        <FaqBlockView/>
        <CtaBlockView/>
    </div>
}