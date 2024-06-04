import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router'
import {StrKey} from '@stellar/stellar-base'
import {AccountAddress, setPageMetadata} from '@stellar-expert/ui-framework'
import {formatDateUTC, formatWithAutoPrecision, shortenString} from '@stellar-expert/formatter'
import {useContractInfo} from '../../../business-logic/api/contract-api'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import ErrorNotificationBlock from '../../components/error-notification-block'
import ContractBalancesView from './contract-balances-view'
import ContractDetailsView from './contract-details-view'
import ContractTabsView from './contract-tabs-view'

function contractTypeInfo(contract) {
    if (contract?.wasm)
        return 'WASM contract ' + shortenString(contract.wasm, 16)
    if (contract?.asset)
        return 'Contract from asset ' + contract.asset?.code
    if (contract?.issuer)
        return 'Contract from address ' + shortenString(contract.issuer, 8)
    return 'unknown'
}

export default function ContractView() {
    const {id: address} = useParams()
    const {data, loaded} = useContractInfo(address)
    const [metadata, setMetadata] = useState({
        title: `Contract ${address}`,
        description: `Explore properties, balance, active offers, and full operations history for contract ${address} on Stellar Network.`
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        if (!data || data.error)
            return
        const {status, source} = data.validation
        const verification = status === 'unverified' ? 'Unavailable' : (source ? 'Confirmed' : 'Verification ' + status)
        const infoList = [
            {name: 'Type', value: contractTypeInfo(data)},
            {name: 'Status', value: verification},
            {name: 'Creator', value: shortenString(address, 12)},
            {name: 'Created', value: `${formatDateUTC(data.created)} UTC`}
        ]
        if (data.payments)
            infoList.push({name: 'Payments', value: data.payments})
        if (data.trades)
            infoList.push({name: 'Trades', value: data.trades})
        const preparedData = prepareMetadata({
            description: `Data storage ${formatWithAutoPrecision(data.storage_entries)} ${data.storage_entries > 1 ? 'entries' : 'entry'}`,
            infoList,
            account: {address}
        })
        previewUrlCreator(preparedData)
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [data])

    if (!StrKey.isValidContract(address))
        return <>
            <h2 className="word-break condensed"><span className="dimmed">Contract</span> {address}</h2>
            <ErrorNotificationBlock>
                Invalid smart contract address. Make sure that you copied it correctly.
            </ErrorNotificationBlock>
        </>
    if (!loaded)
        return <div className="loader"/>
    if (!data)
        return <>
            <h2 className="word-break condensed"><span className="dimmed">Contract</span> {address}</h2>
            <ErrorNotificationBlock>Contract not found on the ledger</ErrorNotificationBlock>
        </>
    return <>
        <h2 className="condensed word-break">
            <span className="dimmed">Contract</span> <AccountAddress account={address} link={false} chars="all"/>
        </h2>
        <div className="row space">
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Summary</h3>
                    <hr className="flare"/>
                    <ContractDetailsView contract={data}/>
                </div>
                <div className="space mobile-only"/>
            </div>
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Contract balances</h3>
                    <hr className="flare"/>
                    <ContractBalancesView address={address}/>
                </div>
            </div>
        </div>
        <div>
            <ContractTabsView contract={data}/>
        </div>
    </>
}