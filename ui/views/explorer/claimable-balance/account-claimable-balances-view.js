import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router'
import {
    AccountAddress,
    ButtonGroup,
    Button,
    initHorizon,
    formatExplorerLink,
    fetchData,
    getCurrentStellarNetwork
} from '@stellar-expert/ui-framework'
import AccountClaimableBalanceRowView from './account-claimable-balance-row-view'

const limit = 40

function useClaimableBalances(account) {
    const [response, setResponse] = useState([])
    useEffect(() => {
        initHorizon().claimableBalances()
            .claimant(account)
            .order('desc')
            .limit(limit)
            .call()
            .then(updateRecords)
    }, [account])

    function updateRecords(response) {
        if (!response.records?.length) {
            setResponse(response)
            return
        }
        fetchData(getCurrentStellarNetwork() + '/claimable-balance/value?' + response.records.map(r => 'balance[]=' + r.id.substring(8)).join('&'))
            .then(res => {
                if (!res?.data.error) {
                    for (const vcb of res.data.claimable_balances) {
                        if (vcb.value) {
                            const rcb = response.records.find(r => r.id.includes(vcb.id))
                            rcb.value = vcb.value
                        }
                    }
                }
                setResponse(response)
            })
    }

    return {
        data: response?.records,
        next() {
            return response.next().then(updateRecords)
        },
        prev() {
            return response.prev().then(updateRecords)
        }
    }
}

export function AccountClaimableBalancesSection({address}) {
    const cbResponse = useClaimableBalances(address)
    if (!cbResponse.data?.length) return null
    const cbListLink = formatExplorerLink('account', address) + '/claimable-balances'
    return <div>
        <h4 style={{marginBottom: 0}}>Pending Claimable Balances</h4>
        <div className="text-small micro-space">
            {cbResponse.data.map(({id, ...props}) => <AccountClaimableBalanceRowView key={id} account={address} {...props}/>)}
            {cbResponse.data.length === limit && <div className="micro-space">
                <a href={cbListLink}>All claimable balances...</a>
            </div>}
        </div>
    </div>
}

export default function AccountClaimableBalancesView() {
    const {id: address} = useParams()
    const cbResponse = useClaimableBalances(address)
    if (!cbResponse.data)
        return <div className="loader"/>
    return <>
        <h2 style={{marginBottom: 0}}>Claimable balances</h2>
        <div className="card space">
            <h3 style={{marginBottom: 0}}>Pending claimable balances for account <AccountAddress account={address}/></h3>
            <hr/>
            <div className="micro-space">
                {cbResponse.data.map(({id, ...props}) => <AccountClaimableBalanceRowView key={id} account={address} {...props}/>)}
            </div>
            {!cbResponse.data.length && <div className="dimmed text-small">(no claimable founds)</div>}
            <div className="text-center micro-space">
                <ButtonGroup>
                    <Button onClick={cbResponse.prev}>Prev Page</Button>
                    <Button onClick={cbResponse.next}>Next Page</Button>
                </ButtonGroup>
            </div>
        </div>
    </>
}