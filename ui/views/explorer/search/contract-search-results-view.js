import React from 'react'
import {AccountAddress, UtcTimestamp, useExplorerApi} from '@stellar-expert/ui-framework'
import {formatPrice} from '@stellar-expert/formatter'
import {resolvePath} from '../../../business-logic/path'
import SearchResultsSectionView from './search-results-section-view'

function formatLink(account, tab) {
    return resolvePath(`contract/${account}${tab ? `?filter=${tab}` : ''}`)
}

export default function ContractSearchResultsView({term, onLoaded}) {
    const response = useExplorerApi('contract?search=' + encodeURIComponent(term))
    if (!response.loaded)
        return null
    const {records} = response?.data?._embedded || {}
    //onLoaded(response.data)
    if (!records?.length) {
        onLoaded(null)
        return null
    }
    const results = records.map(({address, created, trades = 0, payments = 0}) => {
        return {
            link: resolvePath(`contract/${term}`),
            title: <>Contract <AccountAddress account={term} link={false} chars={12}/></>,
            description: <>
                <>Created&nbsp;<UtcTimestamp date={created} dateOnly/></>{' | '}
                {formatPrice(payments)}&nbsp;payments{', '}
                {formatPrice(trades)}&nbsp;trades
            </>,
            links: <>
                <a href={formatLink(address)}>Transactions history</a>
            </>
        }
    })

    onLoaded(results)

    return <SearchResultsSectionView key="contracts" section="Contracts" items={results}/>
}