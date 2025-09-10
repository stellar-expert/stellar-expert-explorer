import React from 'react'
import {useRouteMatch} from 'react-router'
import {StrKey} from '@stellar/stellar-base'
import {
    AccountAddress,
    Amount,
    ClaimableBalanceClaimants,
    useExplorerApi,
    usePageMetadata,
    UtcTimestamp
} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import ErrorNotificationBlock from '../../components/error-notification-block'
import {ClaimableBalanceStatus} from './claimable-balance-status-view'
import {formatClaimableBalanceValue} from './account-claimable-balance-row-view'

export default function ClaimableBalanceView() {
    const {params} = useRouteMatch()
    const hexId = normalizeClaimableBalanceId(params.id)
    let {loaded, error, data} = useExplorerApi(`claimable-balance/${hexId}`)
    if (!error && data?.error) {
        error = data.error
    }

    usePageMetadata({
        title: `Claimable balance ${data?.assets ? data.assets.map(a => a.asset.split('-')[0]).join('/') : params.id}`,
        description: `Claimable balance ${data?.assets ? data.assets.map(a => a.asset).join('/') : params.id}.`
    })

    return <div>
        <h2><span className="dimmed">Claimable Balance</span> <span>{encodeBalanceAsAddress(params.id)}</span></h2>
        {!loaded && <div className="loader"/>}
        {!!error &&
            <ErrorNotificationBlock>Failed to load claimable balance data.<br/>Either the address is invalid or the balance has been already
                claimed.</ErrorNotificationBlock>}
        {!error && !!data && <ClaimableBalanceSummary balance={data}/>}
        <div className="space"/>
    </div>
}

function ClaimableBalanceSummary({balance}) {
    return <div className="row">
        <div className="column column-50">
            <div className="segment blank ">
                <h3>Summary</h3>
                <hr className="flare"/>
                <dl>
                    <dt>Status:</dt>
                    <dd>
                        <ClaimableBalanceStatus claimants={balance.claimants}/>
                    </dd>
                    <dt>Amount:</dt>
                    <dd>
                        <Amount asset={AssetDescriptor.parse(balance.asset)} amount={balance.amount} adjust/>{' '}
                        {!!balance.value &&
                            <span className="dimmed text-tiny condensed">({formatClaimableBalanceValue(balance.value)}$) </span>}
                    </dd>
                    <dt>Sender:</dt>
                    <dd>
                        <AccountAddress account={balance.sponsor} chars={8}/>
                    </dd>
                    <dt>Created:</dt>
                    <dd>
                        {balance.created ? <UtcTimestamp date={balance.created}/> : <span className="dimmed">(unknown)</span>}
                    </dd>
                </dl>
            </div>
        </div>
        <div className="column column-50">
            <div className="space mobile-only"/>
            <div className="segment blank column-50">
                <h3>Claimants</h3>
                <hr className="flare"/>
                <div>
                    <ClaimableBalanceClaimants claimants={balance.claimants}/>
                </div>
            </div>
        </div>
    </div>
}

function normalizeClaimableBalanceId(id) {
    try {
        if (id.startsWith('B')) {
            id = StrKey.decodeClaimableBalance(id).toString('hex')
        } else if (!/^[a-f0-9]{64}$/.test(id))
            return null
    } catch (e) {
        throw new Error('Invalid claimable balance ID')
    }
    return id
}

function encodeBalanceAsAddress(id) {
    try {
        if (id.startsWith('B') && StrKey.isValidClaimableBalance(id))
            return id
        return StrKey.encodeClaimableBalance(Buffer.from(id, 'hex'))
    } catch (error) {
        return null
    }
}