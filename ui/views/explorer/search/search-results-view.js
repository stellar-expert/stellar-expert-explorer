import React, {useState} from 'react'
import {FederationServer} from 'stellar-sdk'
import {useDependantState} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import appSettings from '../../../app-settings'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import {detectSearchType} from '../../../business-logic/search'
import {resolvePath} from '../../../business-logic/path'
import ErrorNotificationBlock from '../../components/error-notification-block'
import AssetSearchResultsView from './assets-search-results-view'
import AccountSearchResultsView from './account-search-results-view'
import LedgerSearchResultsView from './ledger-search-results-view'
import OperationSearchResultsView from './operation-search-results-view'
import TransactionSearchResultsView from './transaction-search-results-view'
import OfferSearchResultsView from './offer-search-results-view'
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
    {keys: ['asset', 'account'], component: AssetSearchResultsView}
]

async function processSearchTerm(originalTerm) {
    let term = originalTerm
    try {
        let searchTypes = detectSearchType(originalTerm)
        //resolve federation address
        if (searchTypes[0] === 'federation') {
            const {account_id} = await FederationServer.resolve(originalTerm)
            term = account_id
            searchTypes = ['account']
        }
        return {term, originalTerm, searchTypes, error: null}

    } catch (e) {
        console.error(e)
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
            Not found "{originalTerm}"
        </div>}
    </div>
}

function SearchResultsWrapper({originalTerm, children}) {
    return <div className="search container narrow">
        <div className="card">
            <h2 className="text-overflow">Search results for "{originalTerm}"</h2>
            <hr/>
            {children}
        </div>
    </div>
}

export default function SearchResultsView() {
    const originalTerm = (navigation.query.term || '').trim()

    const [state, setState] = useDependantState(() => {
        setPageMetadata({
            title: `Search "${originalTerm}"`,
            description: `Search results for term "${originalTerm}" on Stellar ${appSettings.activeNetwork} network.`
        })
        processSearchTerm(originalTerm)
            .then(newState => setState(newState))

        return {
            searchTypes: [],
            term: '',
            originalTerm: '',
            error: null,
            inProgress: true
        }
    }, [originalTerm])

    if (state.error) return <SearchResultsWrapper originalTerm={originalTerm}>
        <ErrorNotificationBlock>{state.error}</ErrorNotificationBlock>
    </SearchResultsWrapper>

    if (state.inProgress) return <div className="loader"/>

    if (!originalTerm) return <SearchResultsWrapper originalTerm={originalTerm}>
        <div className="text-center dimmed">(no search term provided)</div>
    </SearchResultsWrapper>

    return <SearchResultsWrapper originalTerm={originalTerm}>
        <SearchResults {...state}/>
        <div className="double-space">
            <h3>Not found what you've been looking for?</h3>
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