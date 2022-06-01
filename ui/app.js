import React from 'react'
import {render} from 'react-dom'
import {navigation, bindClickNavHandler} from '@stellar-expert/navigation'
import {subscribeToStellarNetworkChange} from '@stellar-expert/ui-framework'
import {waitPricesLoaded} from './business-logic/api/xlm-price-resolver'
import Router from './views/router'
import appSettings from './app-settings'
import './styles.scss'

const appContainer = document.createElement('div')

bindClickNavHandler(appContainer)

window.explorerFrontendOrigin = window.origin
window.explorerApiOrigin = appSettings.apiEndpoint
window.horizonOrigin = appSettings.horizonUrl

subscribeToStellarNetworkChange(function (network) {
    window.horizonOrigin = appSettings.horizonUrl
})

waitPricesLoaded.then(() => {
    render(<Router history={navigation.history}/>, appContainer)
    const preLoader = document.getElementById('pre-loader')
    preLoader.parentNode.removeChild(preLoader)

    document.body.appendChild(appContainer)
})