import React from 'react'
import {AssetLink, UtcTimestamp, useExplorerApi} from '@stellar-expert/ui-framework'
import {formatPrice} from '@stellar-expert/formatter'
import {resolvePath} from '../../../business-logic/path'
import SearchResultsSectionView from './search-results-section-view'

const limit = 20

export default function AssetSearchResultsView({term, onLoaded}) {
    const response = useExplorerApi(`asset?search=${encodeURIComponent(term)}&limit=${limit}`)
    if (!response.loaded)
        return null
    const results = []
    let more
    if (term.toLowerCase() === 'xlm') {
        results.push({
            link: resolvePath(`asset/XLM`),
            title: <>Asset <AssetLink asset="XLM" link={false}/></>,
            description: <>
                Native Stellar asset
            </>,
            links: <>
            </>
        })
    } else {
        const {records} = response.data?._embedded || {}
        if (!records?.length) {
            onLoaded(null)
            return null
        }
        for (const {asset, created, trades = 0, payments = 0, trustlines} of records) {
            results.push({
                link: resolvePath(`asset/${asset}`),
                title: <>Asset <AssetLink asset={asset} link={false}/></>,
                description: <>
                    Created&nbsp;<UtcTimestamp date={created} dateOnly/>{' | '}
                    {formatPrice(trustlines[2] || 0)}&nbsp;funded&nbsp;trustlines{', '}
                    {formatPrice(payments)}&nbsp;payments{', '}
                    {formatPrice(trades)}&nbsp;trades
                </>,
                links: <>
                    <AssetLink asset={asset}>Transactions history</AssetLink>&emsp;
                    <AssetLink asset={asset} tab="trades">Trades history</AssetLink>&emsp;
                    <AssetLink asset={asset} tab="markets">Markets</AssetLink>&emsp;
                    <AssetLink asset={asset} tab="asset-holders">Top holders</AssetLink>
                </>
            })
        }

        if (records.length === limit) {
            const moreLink = resolvePath(`asset?search=${term}&cursor=${records[limit - 1].paging_token}`)
            more = <a href={moreLink}>More asset search results...</a>
        }
    }
    onLoaded(results)

    return <SearchResultsSectionView key="assets" section="Assets" items={results} more={more}/>
}