import React from 'react'
import PolicyPageView from './policy-page-view'
import source from './terms-of-service.md'

export default function TOS() {
    return <PolicyPageView source={source}
                           description="Welcome to StellarExpert administered and maintained by Verdalinhado Unipessoal LDA."/>
}
