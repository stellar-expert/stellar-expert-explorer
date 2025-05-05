import React from 'react'
import {render} from 'react-dom'
import {navigation, bindClickNavHandler} from '@stellar-expert/navigation'
import {createToastNotificationsContainer, initMeta, subscribeToStellarNetworkChange} from '@stellar-expert/ui-framework'
import Router from './views/router'
import appSettings from './app-settings'
import './styles.scss'

const preLoader = document.getElementById('pre-loader')
if (preLoader) { //skip initialization of pre-rendered pages
    const appContainer = document.createElement('div')

    bindClickNavHandler(appContainer)

    window.explorerFrontendOrigin = window.origin
    window.explorerApiOrigin = window.forcedExplorerApiOrigin || appSettings.apiEndpoint
    window.horizonOrigin = appSettings.horizonUrl

    subscribeToStellarNetworkChange(function () {
        window.horizonOrigin = appSettings.horizonUrl
    })

    const metaOrigin = 'https://stellar.expert'
    initMeta({
        serviceTitle: '| StellarExpert',
        origin: metaOrigin,
        description: 'StellarExpert | Stellar XLM block explorer and analytics platform',
        image: metaOrigin + '/img/stellar-expert-social-1200x630.png',
        imageEndpoint: metaOrigin + '/thumbnail'
    })

    render(<Router history={navigation.history}/>, appContainer)
    preLoader.parentNode.removeChild(preLoader)
    createToastNotificationsContainer()

    document.body.appendChild(appContainer)
}