import React from 'react'
import {useParams} from 'react-router'
import {StrKey} from 'stellar-base'
import {AccountAddress} from '@stellar-expert/ui-framework'
import ErrorNotificationBlock from '../../components/error-notification-block'
import {useContractInfo} from '../../../business-logic/api/contract-api'
import ContractBalancesView from './contract-balances-view'
import ContractDetailsView from './contract-details-view'
import ContractHistoryTabsView from './contract-history-tabs-view'
import {setPageMetadata} from '../../../util/meta-tags-generator'

export default function ContractView() {
    const {id: address} = useParams()
    const {data, loaded} = useContractInfo(address)
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
    setPageMetadata({
        title: `Contract ${address}`,
        description: `Explore properties, balance, active offers, and full operations history for contract ${address} on Stellar Network.`
    })
    return <>
        <h2 className="condensed word-break">
            <span className="dimmed">Contract</span> <AccountAddress account={address} link={false} chars="all"/>
        </h2>
        <div className="row">
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Summary</h3>
                    <hr className="flare"/>
                    <ContractDetailsView contract={data}/>
                </div>
            </div>
            <div className="column column-50">
                <div className="segment blank">
                    <h3>Contract balances</h3>
                    <hr className="flare"/>
                    <ContractBalancesView address={address}/>
                </div>
            </div>
        </div>
        <div className="">
            <ContractHistoryTabsView contract={address}/>
        </div>
    </>
}