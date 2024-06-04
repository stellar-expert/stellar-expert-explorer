import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router'
import {
    AccountAddress,
    ButtonGroup,
    Button,
    initHorizon,
    formatExplorerLink,
    fetchData,
    getCurrentStellarNetwork,
    withErrorBoundary,
    setPageMetadata
} from '@stellar-expert/ui-framework'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import AccountClaimableBalanceRowView from './account-claimable-balance-row-view'

function useClaimableBalances(account, limit) {
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
    const cbResponse = useClaimableBalances(address, 10)
    if (!cbResponse.data?.length)
        return null
    const cbListLink = formatExplorerLink('account', address) + '/claimable-balances'
    return <div>
        <h4 style={{marginBottom: 0}}>Pending Claimable Balances</h4>
        <div className="text-small micro-space">
            {cbResponse.data.map(({id, ...props}) => <AccountClaimableBalanceRowView key={id} account={address} {...props}/>)}
            {cbResponse.data.length === 10 && <div className="micro-space">
                <a href={cbListLink}><i className="icon icon-open-new-window"/> All claimable balances</a>
            </div>}
        </div>
    </div>
}

export default withErrorBoundary(function AccountClaimableBalancesView() {
    const {id: address} = useParams()
    const cbResponse = useClaimableBalances(address, 40)
    const [metadata, setMetadata] = useState({
        title: `Pending Claimable Balances for ${address}`,
        description: `Pending Claimable Balances for account ${address} on Stellar Network`
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        const type = address.startsWith('C') ? 'Contract' : 'Account'
        previewUrlCreator(prepareMetadata({
            title: `Pending Claimable Balances`,
            description: `${type} ${address}`
        }))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [])

    if (!cbResponse.data)
        return <div className="loader"/>
    return <>
        <h2>Pending claimable balances for account <AccountAddress account={address}/></h2>
        <div className="segment blank">
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
})