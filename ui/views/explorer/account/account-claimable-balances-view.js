import React from 'react'
import {AccountAddress, Amount, useDependantState, loadAccountClaimableBalances} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'

export default function AccountClaimableBalancesView({address}) {
    const [balances, setBalances] = useDependantState(() => {
        loadAccountClaimableBalances(address)
            .then(balances => setBalances(balances))
        return null
    }, [address])
    if (!balances || !balances.length) return null
    return <div>
        <h4 style={{marginBottom: 0}}>Pending Claimable Balances</h4>
        <div className="text-small micro-space">
            {balances.map(({id, asset, amount, sponsor}) => <div key={id}>
                <i className="icon icon-back-in-time"/> <Amount asset={AssetDescriptor.parse(asset)}
                                                                amount={amount}/>{' '}
                sponsored by <AccountAddress account={sponsor} chars={8}/>
            </div>)}
        </div>
    </div>
}