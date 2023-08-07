import React from 'react'
import {AssetLink, AccountAddress, OfferLink, Amount, UtcTimestamp, useExplorerApi} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {formatWithPrecision, formatPrice, approximatePrice} from '@stellar-expert/formatter'
import {resolvePath} from '../../../business-logic/path'
import SearchResultsSectionView from './search-results-section-view'

export default function OfferSearchResultsView({term, onLoaded}) {
    const response = useExplorerApi('offer/' + term)
    const {data, loaded} = response
    if (!loaded) return null
    if (!data?.id || data.error) {
        onLoaded(null)
        return null
    }
    const {id, account, created, trades=0, amount, selling, buying, price, deleted} = data,
        basePath = resolvePath(`offer/${id}`)
    const results = [{
        link: basePath,
        title: <>Offer {id} {deleted && <span className="details">(deleted)</span>}</>,
        description: <>
            By account <AccountAddress account={account} chars={12}/>{' | '}
            <Amount amount={amount} asset={selling}/> for{' '}
            <AssetLink asset={buying}/> at{' '}
            {formatWithPrecision(approximatePrice(price), 7)}{' '}
            {AssetDescriptor.parse(buying).toCurrency()}/{AssetDescriptor.parse(selling).toCurrency()} {' | '}
            Created&nbsp;<UtcTimestamp date={created} dateOnly/>{', '}
            {formatPrice(trades)}&nbsp;trades
        </>,
        links: <>
            <OfferLink offer={id} href={basePath + '?filter=trades'}>Trades history</OfferLink>&emsp;
            <OfferLink offer={id} href={basePath + '?filter=changes'}>Changes history</OfferLink>
        </>
    }]
    onLoaded(results)

    return <SearchResultsSectionView key="Offers" section="Offers" items={results}/>
}