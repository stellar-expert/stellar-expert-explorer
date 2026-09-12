import React, {useCallback, useEffect, useState} from 'react'
import {Federation} from '@stellar/stellar-sdk'
import {navigation, useDependantState, usePageMetadata} from '@stellar-expert/ui-framework'
import appSettings from '../../../app-settings'
import {detectSearchType} from '../../../business-logic/search'
import {resolveSoranName, SoranResolutionError} from '../../../business-logic/soran-resolution'
import {resolvePath} from '../../../business-logic/path'
import ErrorNotificationBlock from '../../components/error-notification-block'
import AssetSearchResultsView from './assets-search-results-view'
import AccountSearchResultsView from './account-search-results-view'
import LedgerSearchResultsView from './ledger-search-results-view'
import OperationSearchResultsView from './operation-search-results-view'
import TransactionSearchResultsView from './transaction-search-results-view'
import OfferSearchResultsView from './offer-search-results-view'
import ContractSearchResultsView from './contract-search-results-view'
import SoranSearchResultView from './soran-search-result-view'
import './search.scss'

/**
 * @typedef {Object} SearchResult
 * @property {String} link
 * @property {Object} title
 * @property {Object} description
 * @property {Object} links
 */

const searchTypesMapping = [
    {keys: ['transaction'], component: TransactionSearchResultsView},
    {keys: ['operation'], component: OperationSearchResultsView},
    {keys: ['offer'], component: OfferSearchResultsView},
    {keys: ['ledger'], component: LedgerSearchResultsView},
    {keys: ['account'], component: AccountSearchResultsView},
    {keys: ['contract'], component: ContractSearchResultsView},
    {keys: ['asset', 'account'], component: AssetSearchResultsView}
]

async function processSearchTerm(originalTerm, network) {
    let term = originalTerm
    try {
        let searchTypes = detectSearchType(originalTerm, network)
        if (searchTypes[0] === 'soran') {
            try {
                const resolution = await resolveSoranName(originalTerm, network, appSettings.networks[network])
                return {term, originalTerm, resolution, searchTypes: [], error: null}
            } catch (error) {
                //An unallocated namespace may instead be an asset code or ordinary search text.
                if (!(error instanceof SoranResolutionError) || error.code !== 5) throw error
                searchTypes = ['account', 'asset']
            }
        }
        //resolve federation address
        if (searchTypes[0] === 'federation') {
            const {account_id} = await Federation.Server.resolve(originalTerm)
            term = account_id
            searchTypes = ['account']
        } else if (searchTypes[0] === 'sorobandomains') {
            const resolved = await fetch(`https://sorobandomains-query.lightsail.network/api/v1/query?q=${originalTerm.trim().toLowerCase()}&type=domain`)
                .then(res => res.json())
            if (resolved?.address) {
                term = resolved.address
                searchTypes = ['account']
            }
        }
        return {term, originalTerm, searchTypes, error: null}

    } catch (e) {
        console.error(e)
        if (e instanceof SoranResolutionError) return {term, error: e.message, retryable: true}
        return {term, results: [], error: `Nothing found for search term "${term}".`}
    }
}

function SearchResults({term, searchTypes, originalTerm}) {
    const [notFound, setNotFound] = useState(null)
    const [componentsToRender] = useDependantState(() => {
        const loading = []
        const components = []
        for (const {component} of searchTypesMapping.filter(st => st.keys.some(key => searchTypes.includes(key)))) {
            let onLoaded
            loading.push(new Promise(resolve => {
                onLoaded = resolve
            }))
            components.push(React.createElement(component, {term, onLoaded}))
        }
        if (!loading.length) {
            setNotFound(true)
        }
        Promise.all(loading)
            .then(allResults => {
                const nonEmpty = allResults.flat().filter(res => !!res)
                switch (nonEmpty.length) {
                case 0:
                    setNotFound(true)
                    break
                case 1:
                    navigation.navigate(nonEmpty[0].link) //navigate to the default result
                    break
                default:
                    setNotFound(false)
                    break
                }
            })
        return components
    }, [term, searchTypes])

    return <div style={{minHeight: '40vh'}}>
        {componentsToRender}
        {typeof notFound !== 'boolean' && <div className="loader"/>}
        {!!notFound && <div className="notfound text-center double-space dimmed">
            Not found &quot;{originalTerm}&quot;
        </div>}
    </div>
}

function SearchResultsWrapper({originalTerm, children}) {
    return <div className="search container narrow">
        <h2 className="text-overflow">Search results for &quot;{originalTerm}&quot;</h2>
        {children}
    </div>
}

export default function SearchResultsView() {
    const originalTerm = (navigation.query.term || '').trim()
    const network = appSettings.activeNetwork
    usePageMetadata({
        title: `Search "${originalTerm}"`,
        description: `Search results for term "${originalTerm}" on Stellar ${appSettings.activeNetwork} network.`
    })

    const [state, setState] = useState(null)
    const [retry, setRetry] = useState(0)
    useEffect(() => {
        let active = true
        setState(null)
        processSearchTerm(originalTerm, network).then(result => {
            if (active) setState({originalTerm, network, result})
        })
        return () => {
            active = false
        }
    }, [originalTerm, network, retry])

    const retryResolution = useCallback(() => {
        setRetry(value => value + 1)
    }, [])

    //Do not show a previous query's result or apply a late testnet read after changing networks.
    if (!state || state.originalTerm !== originalTerm || state.network !== network) return <div className="loader"/>
    const result = state.result

    if (result.error)
        return <SearchResultsWrapper originalTerm={originalTerm}>
            <ErrorNotificationBlock>{result.error}</ErrorNotificationBlock>
            {!!result.retryable && <button type="button" onClick={retryResolution}>Retry</button>}
        </SearchResultsWrapper>

    if (!originalTerm)
        return <SearchResultsWrapper originalTerm={originalTerm}>
            <div className="text-center dimmed">(no search term provided)</div>
        </SearchResultsWrapper>

    if (result.resolution)
        return <SearchResultsWrapper originalTerm={originalTerm}>
            <SoranSearchResultView resolution={result.resolution}/>
        </SearchResultsWrapper>

    return <SearchResultsWrapper originalTerm={originalTerm}>
        <SearchResults key={`${network}:${originalTerm}`} {...result}/>
        <div className="space segment blank">
            <h3>Not found what you&apos;ve been looking for?</h3>
            <hr className="flare"/>
            <div className="row">
                <div className="column column-66 space">
                    <div className="dimmed">
                        Search suggestions:
                    </div>
                    <ul className="list checked">
                        <li>Verify that you copied/typed text correctly.</li>
                        <li>Search by asset, account, transaction hash, operation id, or ledger sequence.</li>
                        <li>Check spelling and reduce the number of searched terms.</li>
                        <li>Try related terms, like ledger sequence or account address.</li>
                    </ul>
                </div>
                <div className="column column-33 space">
                    <div className="dimmed">Or navigate directly to:</div>
                    <div className="micro-space"/>
                    <div className="row">
                        <div className="column column-50">
                            <a href={resolvePath('asset')}>Assets Dashboard</a><br/>
                            <a href={resolvePath('market')}>Markets Dashboard</a><br/>
                            <a href={resolvePath('network-activity')}>Network Stats</a>
                        </div>
                        <div className="column column-50">
                            <a href={resolvePath('', 'directory')}>Accounts Directory</a><br/>
                            <a href={resolvePath('payment-locator')}>Payment Locator</a><br/>
                            <a href={resolvePath('tax-export')}>Tax Data Export</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </SearchResultsWrapper>
}
