import React from 'react'
import PolicyPageView from './policy-page-view'
import source from './privacy-policy.md'

export default function PrivacyPageView() {
    return <PolicyPageView source={source}
                           description="Welcome to StellarExpert administered and maintained by Verdalinhado Unipessoal LDA."/>
}
