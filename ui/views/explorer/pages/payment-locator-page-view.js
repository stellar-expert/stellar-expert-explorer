import React, {useEffect, useState} from 'react'
import {setPageMetadata} from '@stellar-expert/ui-framework'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import config from '../../../app-settings'
import TxHistoryView from '../tx/tx-history-view'

const benefits = [
    {value: 'Lookup by transaction memo, asset, source/destination account.'},
    {value: 'Search by a single parameter or a complex criteria.'},
    {value: 'All operations are supported: PAYMENT, PATH_PAYMENT, CREATE_ACCOUNT, MERGE_ACCOUNT.'},
    {value: 'Find everything, no matter how long ago transactions were processed.'},
    {value: 'Works even with deleted(merged) accounts.'},
    {value: 'Free API for developers.', link: '/openapi.html#tag/Payment-Locator-API'}
]

export default function PaymentLocatorPage() {
    const [metadata, setMetadata] = useState({
        title: `Payment locator`,
        description: `Explore payments on the Stellar ${config.activeNetwork} network. Search by amount, assets, transaction memo, source/destination account.`
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        const infoList = benefits.filter(b => b.value.length < 65).map(b => ({icon: '•', value: b.value}))
        previewUrlCreator(prepareMetadata({
            title: `Payment locator`,
            infoList
        }))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [])

    return <div className="container narrow">
        <h2>Transaction Locator</h2>
        <div className="segment blank">
            Explore transactions on Stellar {config.activeNetwork} network.
            <ul className="list checked">
                {benefits.map((entry, i) => <li key={i}>
                    {entry.link ?
                        <a target="_blank" rel="noreferrer noopener" href={entry.link}>{entry.value}</a> :
                        entry.value}</li>)}
            </ul>
        </div>
        <div className="space">
            <TxHistoryView presetFilter={{}}/>
        </div>
    </div>
}