import React, {useEffect, useState} from 'react'
import {setPageMetadata} from '@stellar-expert/ui-framework'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import SearchBoxView from './search-box-view'

function SearchExample({term, children}) {
    return <a href={location.pathname + '?search=' + term} onClick={() => {
        setTimeout(() => {
            document.querySelector('.search-box.primary input')
                .focus()
        }, 300)
    }}>{children}</a>
}

export default function DedicatedSearchBoxView() {
    const [metadata, setMetadata] = useState({
        title: 'Search in StellarExpert',
        description: 'Search for any information on Stellar Network: tokens, accounts, ledgers, transactions, operations, offers, markets, and more.'
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        previewUrlCreator(prepareMetadata({title: metadata.title}))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [])

    return <div className="container narrow">
        <h2>Search</h2>
        <div className="segment blank">
            <div className="dimmed text-small text-center">
                Search for any information on Stellar Network: tokens, accounts, ledgers,
                transactions, operations, offers, markets, and more.
            </div>
            <div className="space"/>
            <SearchBoxView shrinkable={false} className="primary"/>
            <p className="text-small dimmed text-center">
                for example, try typing <SearchExample term="USD">USD</SearchExample>,
                <SearchExample term="4651470">4651470</SearchExample>, or&nbsp;
                <SearchExample term="GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6EFIBNDQTCQHG262N4GGKTM">GA5X...GKTM</SearchExample>
            </p>
            <div className="double-space"/>
        </div>
    </div>
}