import React, {useEffect} from 'react'
import {useParams} from 'react-router'
import {AccountAddress, formatExplorerLink, useExplorerPaginatedApi, usePageMetadata} from '@stellar-expert/ui-framework'
import GridDataActionsView from '../../components/grid-data-actions'
import ErrorNotificationBlock from '../../components/error-notification-block'
import {AccountClaimableBalanceRowView, AccountClaimableBalanceRecordView} from './account-claimable-balance-row-view'

function useClaimableBalances(account, limit) {
    const res = useExplorerPaginatedApi(`account/${account}/claimable-balances`, {
        autoReverseRecordsOrder: true,
        limit,
        autoLoad: false,
        defaultSortOrder: 'desc',
        defaultQueryParams: {order: 'desc'}
    }, [account])
    useEffect(() => {
        res.load()
    }, [account])
    return res
}

export function AccountClaimableBalancesSection({address}) {
    const cbResponse = useClaimableBalances(address, 10)
    if (!cbResponse.data?.length)
        return null
    const cbListLink = formatExplorerLink('account', address) + '/claimable-balances'
    return <div>
        <h4 style={{marginBottom: 0}}>Pending Claimable Balances</h4>
        <div className="text-small micro-space">
            {cbResponse.data.map(({id, ...props}) => <AccountClaimableBalanceRecordView key={id} account={address} id={id} {...props}/>)}
            {cbResponse.data.length === 10 && <div className="micro-space">
                <a href={cbListLink}><i className="icon icon-open-new-window"/> All claimable balances</a>
            </div>}
        </div>
    </div>
}

export default function AccountClaimableBalancesView() {
    const {id: address} = useParams()
    usePageMetadata({
        title: 'Pending claimable balances for account ' + address,
        description: `Explorer list of all payments sent to account ${address} without trustline.`
    })
    const balances = useClaimableBalances(address, 40)
    if (!balances.data)
        return <div className="loader"/>
    if (balances.data?.error) {
        return <ErrorNotificationBlock>
            Failed to load claimable balances.
        </ErrorNotificationBlock>
    }
    return <>
        <h2>Pending claimable balances for account <AccountAddress account={address}/></h2>
        <div className="segment blank">
            <table className="table space">
                <thead>
                <tr>
                    <th className="collapsing"></th>
                    <th>Amount</th>
                    <th>Sender</th>
                    <th className="text-right collapsing nowrap">Created</th>
                </tr>
                </thead>
                <tbody>
                {balances.data.map(({id, ...props}) => <AccountClaimableBalanceRowView key={id} id={id} account={address} {...props}/>)}
                </tbody>
            </table>
            {balances.loaded && !balances.data.length && <div className="dimmed text-center text-small">(no claimable balances)</div>}
            {!balances.loaded && <div className="loader"/>}
            <GridDataActionsView model={balances}/>
        </div>
    </>
}